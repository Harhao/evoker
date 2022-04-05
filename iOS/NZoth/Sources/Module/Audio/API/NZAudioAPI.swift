//
//  NZAudioAPI.swift
//
//  Copyright (c) NZoth. All rights reserved. (https://nzothdev.com)
//
//  This source code is licensed under The MIT license.
//

import Foundation

enum NZAudioAPI: String, NZBuiltInAPI {
    
    case operateInnerAudioContext
    
    func onInvoke(args: NZJSBridge.InvokeArgs, bridge: NZJSBridge) {
        DispatchQueue.main.async {
            switch self {
            case .operateInnerAudioContext:
                operateInnerAudioContext(args: args, bridge: bridge)
            }
        }
    }
    
    private func operateInnerAudioContext(args: NZJSBridge.InvokeArgs, bridge: NZJSBridge) {
        struct Params: Decodable {
            let audioId: Int
            let method: Method
            let data: [String: Any]
            
            enum CodingKeys: String, CodingKey {
                case audioId, method, data
            }
            
            public init(from decoder: Decoder) throws {
                let container = try decoder.container(keyedBy: CodingKeys.self)
                audioId = try container.decode(Int.self, forKey: .audioId)
                method = try container.decode(Method.self, forKey: .method)
                data = try container.decode([String: Any].self, forKey: .data)
            }
        }
        
        enum Method: String, Decodable {
            case play
            case pause
            case stop
            case seek
            case setVolume
        }
        
        guard let appService = bridge.appService else { return }
        
        guard let params: Params = args.paramsString.toModel() else {
            let error = NZError.bridgeFailed(reason: .jsonParseFailed)
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard let page = appService.currentPage as? NZWebPage else {
            let error = NZError.bridgeFailed(reason: .appServiceNotFound)
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard let module: NZAudioModule = appService.getModule() else {
            let error = NZError.bridgeFailed(reason: .moduleNotFound(NZAudioModule.name))
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        switch params.method {
        case .play:
            if var playParams: NZAudioPlayer.Params = params.data.toModel() {
                let src = playParams.src
                playParams._url = FilePath.nzFilePathToRealFilePath(appId: appService.appId,
                                                                    userId: NZEngine.shared.userId,
                                                                    filePath: src) ?? URL(string: src)
                if let player = module.players.get(page.pageId, params.audioId) {
                    player.play(params: playParams)
                } else {
                    let player = NZAudioPlayer(audioId: params.audioId)
                    player.delegate = module
                    player.setup(params: playParams)
                    player.play(params: playParams)
                    module.players.set(page.pageId, params.audioId, value: player)
                }
            } else {
                bridge.invokeCallbackFail(args: args, error: .custom("create audio player options invalid"))
            }
        case .pause:
            guard let player = module.players.get(page.pageId, params.audioId) else { break }
            player.pause()
        case .stop:
            guard let player = module.players.get(page.pageId, params.audioId) else { break }
            player.stop()
        case .seek:
            guard let player = module.players.get(page.pageId, params.audioId) else { break }
            if let position = params.data["position"] as? Double {
                player.seek(position: position)
            }
        case .setVolume:
            guard let player = module.players.get(page.pageId, params.audioId) else { break }
            if let volume = params.data["volume"] as? Float {
                player.setVolume(volume)
            }
        }
        
        bridge.invokeCallbackSuccess(args: args)
    }
}

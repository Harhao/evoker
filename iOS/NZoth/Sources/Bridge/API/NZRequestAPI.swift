//
//  NZRequestAPI.swift
//
//  Copyright (c) NZoth. All rights reserved. (https://nzothdev.com)
//
//  This source code is licensed under The MIT license.
//

import Foundation
import Alamofire
import QuartzCore

enum NZRequestAPI: String, NZBuiltInAPI {
   
    case request
    case cancelRequest
    case downloadFile
    case uploadFile
   
    func onInvoke(args: NZJSBridge.InvokeArgs, bridge: NZJSBridge) {
        switch self {
        case .request:
            request(args: args, bridge: bridge)
        case .cancelRequest:
            cancelRequest(args: args, bridge: bridge)
        case .downloadFile:
            downloadFile(args: args, bridge: bridge)
        case .uploadFile:
            uploadFile(args: args, bridge: bridge)
        }
    }
    
    private func request(args: NZJSBridge.InvokeArgs, bridge: NZJSBridge) {
        
        struct Params: Decodable {
            let taskId: Int
            let url: String
            let method: String
            let header: [String: String]
            let timeout: TimeInterval
            let responseType: ResponseType
            let data: String
            
            enum ResponseType: String, Decodable {
                case text
                case arraybuffer
            }
        }
        
        guard let appService = bridge.appService else { return }
        
        guard let params: Params = args.paramsString.toModel() else {
            let error = NZError.bridgeFailed(reason: .jsonParseFailed)
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard !params.url.isEmpty else {
            let error = NZError.bridgeFailed(reason: .fieldRequired("url"))
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        do {
            var header = HTTPHeaders(params.header)
            if !NZEngine.shared.userAgent.isEmpty {
                header.update(.userAgent(NZEngine.shared.userAgent))
            }
            var urlRequest = try URLRequest(url: params.url,
                                            method: HTTPMethod(rawValue: params.method),
                                            headers: header)
            urlRequest.timeoutInterval = params.timeout / 1000
            
            if !params.data.isEmpty {
                urlRequest.httpBody = params.data.data(using: .utf8)
            }
                        
            let request = AF.request(urlRequest)
            
            let taskId = params.taskId
            appService.requests[taskId] = request
            
            request.responseData(completionHandler: { [weak bridge] response in
                guard let bridge = bridge else { return }
                
                bridge.appService?.requests.removeValue(forKey: taskId)
                
                switch response.result {
                case .success(let data):
                    let url = response.request!.url!
                    let header = response.response!.headers.dictionary
                    let cookies = HTTPCookie.cookies(withResponseHeaderFields: header, for: url).map { cookie -> String? in
                        var res = ["\(cookie.name)=\(cookie.value)"]
                        cookie.properties?.forEach {
                            if $0.key != .name && $0.key != .value {
                                res.append("\($0.key.rawValue)=\($0.value)")
                            }
                        }
                        return res.joined(separator: "; ")
                    }
                    
                    var result: Any
                    if params.responseType == .arraybuffer {
                        result = data.bytes
                    } else {
                        result = responseSerializerToString(response)
                    }
                    bridge.invokeCallbackSuccess(args: args, result: ["statusCode": response.response!.statusCode,
                                                                      "header": header,
                                                                      "cookies": cookies,
                                                                      "data": result])
                case .failure(let error):
                    let error = NZError.bridgeFailed(reason: .networkError(error.localizedDescription))
                    bridge.invokeCallbackFail(args: args, error: error)
                }
            })
        } catch {
            let error = NZError.bridgeFailed(reason: .networkError(error.localizedDescription))
            bridge.invokeCallbackFail(args: args, error: error)
        }
    }
    
    private func responseSerializerToString(_ response: AFDataResponse<Data>) -> String {
        let result = try? StringResponseSerializer().serialize(request: response.request,
                                                               response: response.response,
                                                               data: response.data,
                                                               error: response.error)
        return result ?? ""
    }
    
    private func cancelRequest(args: NZJSBridge.InvokeArgs, bridge: NZJSBridge) {
        guard let appService = bridge.appService else { return }
        
        guard let params = args.paramsString.toDict(),
              let taskId = params["taskId"] as? Int else {
                  let error = NZError.bridgeFailed(reason: .fieldRequired("id"))
                  bridge.invokeCallbackFail(args: args, error: error)
                  return
              }
        
        if let request = appService.requests[taskId] {
            request.cancel()
        }
        bridge.invokeCallbackSuccess(args: args)
    }
    
    private func downloadFile(args: NZJSBridge.InvokeArgs, bridge: NZJSBridge) {
        
        struct Params: Decodable {
            let taskId: Int
            let url: String
            let header: [String: String]
            let filePath: String
            let timeout: TimeInterval
        }
        
        guard let appService = bridge.appService else { return }
        
        guard let params: Params = args.paramsString.toModel() else {
            let error = NZError.bridgeFailed(reason: .jsonParseFailed)
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        var destinationNZFilePath = ""
        let destination: DownloadRequest.Destination = { temporaryURL, response in
            let fn = response.suggestedFilename!
            var ext = "unknown"
            if let extIdx = fn.lastIndex(of: "."), extIdx < fn.endIndex {
                ext = String(fn[fn.index(after: extIdx)..<fn.endIndex])
            }
            
            let dest: URL
            if !params.filePath.isEmpty {
                dest = FilePath.createUserNZFilePath(appId: appService.appId, path: params.filePath)
            } else {
                let (destURL, destNZFile) = FilePath.createTempNZFilePath(ext: ext)
                dest = destURL
                destinationNZFilePath = destNZFile
            }
            return (dest, [.removePreviousFile, .createIntermediateDirectories])
        }
        let request = AF.download(params.url, headers: HTTPHeaders(params.header), to: destination)
        appService.requests[params.taskId] = request
        request.downloadProgress { progress in
            let key = NZSubscribeKey("APP_DOWNLOAD_FILE_PROGRESS")
            bridge.subscribeHandler(method: key, data: [
                "taskId": params.taskId,
                "progress": progress.fractionCompleted,
                "totalBytesWritten": progress.totalUnitCount,
                "totalBytesExpectedToWrite": progress.completedUnitCount
            ])
        }
        
        request.responseData { [weak bridge] response in
            guard let bridge = bridge else { return }
            
            bridge.appService?.requests.removeValue(forKey: params.taskId)
            
            switch response.result {
            case .success(let data):
                bridge.invokeCallbackSuccess(args: args, result: [
                    "statusCode": response.response!.statusCode,
                    "tempFilePath": destinationNZFilePath,
                    "header": response.response!.headers.dictionary,
                    "dataLength": data.count
                ])
            case .failure(let error):
                bridge.invokeCallbackFail(args: args, error: .custom(error.localizedDescription))
            }
        }
    }
    
    private func uploadFile(args: NZJSBridge.InvokeArgs, bridge: NZJSBridge) {
        
        struct Params: Decodable {
            let task: Int?
            let url: String
            let filePath: String
            let name: String
            let formData: [String: String]
            let header: [String: String]
            let timeout: Int
        }
        
        guard let appService = bridge.appService else { return }
        
        let start = CACurrentMediaTime()
        guard let params: Params = args.paramsString.toModel() else {
            let error = NZError.bridgeFailed(reason: .jsonParseFailed)
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard !params.url.isEmpty else {
            let error = NZError.bridgeFailed(reason: .fieldRequired("url"))
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard let filePath = FilePath.nzFilePathToRealFilePath(appId: appService.appId, filePath: params.filePath) else {
            let error = NZError.bridgeFailed(reason: .filePathNotExist(params.filePath))
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        do {
            let data = try Data(contentsOf: filePath)
            let request = AF.upload(multipartFormData: { multipartFormData in
                multipartFormData.append(data, withName: params.name)
                params.formData.forEach { (key, value) in
                    let data = Data(value.utf8)
                    multipartFormData.append(data, withName: key)
                }
            }, to: params.url, headers: HTTPHeaders(params.header))
            if let requestId = params.task {
                appService.requests[requestId] = request
            }
            request.responseString { [weak bridge] response in
                guard let bridge = bridge else { return }
                
                if let requestId = params.task {
                    bridge.appService?.requests.removeValue(forKey: requestId)
                }
                let end = String(format: "%.3f", CACurrentMediaTime() - start)
                NZLogger.debug("HTTP request use time \(end)s")
                
                switch response.result {
                case .success:
                    let callback: [String : Any?] = [
                        "success": true,
                        "status": response.response?.statusCode,
                        "headers": response.response?.headers.dictionary,
                        "data": response.value,
                        "error": "",
                    ]
                    bridge.invokeCallbackSuccess(args: args, result: callback)
                case let .failure(error):
                    let callback: [String : Any?] = [
                        "success": false,
                        "status": response.response?.statusCode,
                        "headers": response.response?.headers.dictionary,
                        "data": response.value,
                        "error": error.localizedDescription,
                    ]
                    bridge.invokeCallbackSuccess(args: args, result: callback)
                }
            }
        } catch {
            let error = NZError.bridgeFailed(reason: .networkError(error.localizedDescription))
            bridge.invokeCallbackFail(args: args, error: error)
        }
    }
}


//
//  NZInputModule.swift
//
//  Copyright (c) NZoth. All rights reserved. (https://nzothdev.com)
//
//  This source code is licensed under The MIT license.
//

import Foundation

class NZInputModule: NZModule {
    
    typealias PageId = Int
    
    typealias InputId = Int
    
    static var name: String {
        return "com.nozthdev.module.input"
    }
    
    static var apis: [String : NZAPI] {
        var result: [String : NZAPI] = [:]
        NZInputAPI.allCases.forEach { result[$0.rawValue] = $0 }
        return result
    }
    
    weak var appService: NZAppService?
    
    lazy var inputs: DoubleLevelDictionary<PageId, InputId, NZInput> = DoubleLevelDictionary()
    
    var prevKeyboardHeight: CGFloat = 0
    
    required init(appService: NZAppService) {
        self.appService = appService
        
        KeyboardManager.shared.addObserver(self)
        
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(textViewDidChangeHeightNotification(_:)),
                                               name: NZTextView.didChangeHeightNotification,
                                               object: nil)
    }
    
    deinit {
        KeyboardManager.shared.removeObserver(self)
        NotificationCenter.default.removeObserver(self)
    }
    
    func didSetupPage(_ page: NZPage) {
        
    }
    
    func willExitPage(_ page: NZPage) {
        inputs.remove(page.pageId)
    }
    
    func findInput(pageId: PageId, where predicate: (NZInput) throws -> Bool) rethrows -> NZInput? {
        guard let inputs = inputs.get(pageId) else { return nil }
        return try? inputs.values.first(where: predicate)
    }
    
    func allInputs(pageId: PageId) -> [NZInput] {
        guard let inputs = inputs.get(pageId) else { return [] }
        return Array(inputs.values)
    }
    
    @objc func textViewDidChangeHeightNotification(_ notify: Notification) {
        guard let appService = appService,
              let page = appService.currentPage as? NZWebPage,
              page.isVisible,
              let input = notify.object as? NZTextView,
              let transition = KeyboardManager.shared.currentTransition,
              let selectedTextRange = input.textView.selectedTextRange else { return }
        let caretRect = input.textView.caretRect(for: selectedTextRange.start)
        let rect = input.textView.convert(caretRect, to: UIApplication.shared.keyWindow)
        let keyboardY = transition.toFrame.minY
        if rect.maxY > keyboardY {
            page.webView.adjustPosition = true
            UIView.animate(withDuration: transition.animationDuration,
                           delay: 0,
                           options: transition.animationOptions) {
                page.webView.frame.origin.y -= rect.maxY - keyboardY
            }
        }
    }
}

extension NZInputModule: KeyboardObserver {
    
    func keyboardChanged(_ transition: KeyboardTransition) {
        guard let appService = appService,
              let page = appService.currentPage as? NZWebPage,
              page.isVisible else { return }
        
        let webView = page.webView
        let keyboardHeight = transition.toFrame.height
        
        allInputs(pageId: page.pageId).forEach { input in
            let message: [String: Any] = [
                "inputId": input.inputId,
                "height": transition.toVisible ? keyboardHeight : 0,
                "duration": transition.animationDuration,
            ]
            webView.bridge.subscribeHandler(method: KeyboardManager.heightChangeSubscribeKey, data: message)
        }
        
        var keyboardHeightUpdated = false
        if keyboardHeight != prevKeyboardHeight {
            prevKeyboardHeight = keyboardHeight
            keyboardHeightUpdated = true
        }
        
        if transition.toVisible {
            if keyboardHeightUpdated {
                if let input = findInput(pageId: page.pageId, where: { $0.input.isFirstResponder }), input.adjustPosition {
                    let data: [String: Any] = ["inputId": input.inputId, "height": keyboardHeight]
                    webView.bridge.subscribeHandler(method: KeyboardManager.onShowSubscribeKey, data: data)
                    let keyboardY = transition.toFrame.minY
                    let rect = input.convert(input.frame, to: UIApplication.shared.keyWindow)
                    if rect.maxY > keyboardY {
                        webView.adjustPosition = true
                        webView.adjustOldY = webView.frame.minY
                        UIView.animate(withDuration: transition.animationDuration,
                                       delay: 0,
                                       options: transition.animationOptions) {
                            webView.frame.origin.y -= rect.maxY - keyboardY
                        }
                    }
                }
            }
        } else {
            prevKeyboardHeight = 0
            if webView.adjustPosition {
                webView.adjustPosition = false
                UIView.animate(withDuration: transition.animationDuration,
                               delay: 0,
                               options: transition.animationOptions) {
                    webView.frame.origin.y = webView.adjustOldY
                }
            }
        }
    }
}

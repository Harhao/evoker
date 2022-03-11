//
//  NZNativelyContainerView.swift
//
//  Copyright (c) NZoth. All rights reserved. (https://nzothdev.com)
//
//  This source code is licensed under The MIT license.
//

import Foundation
import UIKit

class NZNativelyContainerView: UIView {
    
    override func conforms(to aProtocol: Protocol) -> Bool {
        if NSStringFromProtocol(aProtocol) == "WKNativelyInteractible" {
            return true
        }
        return super.conforms(to: aProtocol)
    }
}

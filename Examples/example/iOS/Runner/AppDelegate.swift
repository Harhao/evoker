//
//  AppDelegate.swift
//  Runner
//
//  Created by yizhi996 on 2022/3/3.
//

import UIKit
import NZoth
import Bugly
import AMapFoundationKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window: UIWindow?
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        Bugly.start(withAppId: "c175518c9c")
        
        window = UIWindow(frame: UIScreen.main.bounds)
        window!.makeKeyAndVisible()
        
        NZEngine.shared.getAppInfoHandler = { appId, envVersion, completionHandler in
            if let app = LaunchpadViewController.apps.first(where: { $0.appId == appId }) {
                completionHandler(NZAppInfo(appName: app.appName, appIconURL: ""))
            } else {
                completionHandler(NZAppInfo(appName: appId, appIconURL: ""))
            }
        }
        
        NZEngine.shared.checkAppUpdateHandler = { appId, envVersion, appVersion, nzVersion, completionHandler in
            completionHandler(true)
        }
        
        var config = NZEngineConfig()
        config.devServer.useDevJSSDK = true
        config.devServer.useDevServer = true
        config.devServer.host = "172.17.205.50"
        NZEngine.shared.launch(config)
        NZEngine.shared.injectModule(NZMapModule.self)
        
        NZVersionManager.shared.updateJSSDK { _ in
            NZEngine.shared.preload()
        }
        
        AMapServices.shared().apiKey = "35130e0c213883fba57defc0d2004c79"
        
        window?.rootViewController = UINavigationController(rootViewController: LaunchpadViewController())

        return true
    }
    
    func applicationDidEnterBackground(_ application: UIApplication) {
        
    }
    
    func applicationWillTerminate(_ application: UIApplication) {
        FilePath.cleanTemp()
    }
    
    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return .all
    }
}

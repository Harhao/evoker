Pod::Spec.new do |s|
    s.name                    = 'Evoker'
    s.version                 = '0.1.0'
    s.summary                 = 'Evoker'
  
    s.homepage                = 'https://evokerdev.com'
    s.license                 = { :type => 'MIT', :file => '../LICENSE' }
    s.authors                 = 'yizhi996'
  
    s.source                  = {
      :git => 'https://github.com/yizhi996/evoker.git',
      :tag =>  s.version.to_s
    }
  
    s.swift_version           = '5.3'

    s.platform = :ios
  
    s.ios.deployment_target = '11.0'

    s.static_framework = true

    s.framework = 'Foundation'
    s.ios.framework  = 'UIKit'
  
    s.cocoapods_version       = '>= 1.4.0'
    s.prefix_header_file      = false

    s.default_subspecs = "Core", "Resources"

    s.subspec 'Core' do |ss|
      ss.source_files = ['Evoker/Sources/**/*.swift']

      ss.dependency 'Alamofire', '~> 5.4'
      ss.dependency 'SDWebImage', '~> 5.0'
      ss.dependency 'SDWebImageWebPCoder'
      ss.dependency 'JXPhotoBrowser', '~> 3.0'
      ss.dependency 'PureLayout'
      ss.dependency 'MJRefresh'
      ss.dependency 'Telegraph'
      ss.dependency 'CryptoSwift', '~> 1.4.1'
      ss.dependency 'Zip', '~> 2.1'
      ss.dependency 'ZLPhotoBrowser'
      ss.dependency 'KTVHTTPCache', '~> 2.0.0'
      ss.dependency 'SQLite.swift', '~> 0.13.2'
      ss.dependency 'SwiftyRSA'
    end
    
    s.subspec 'Resources' do |ss|
      ss.resource_bundles = {'Evoker' => [
        'Evoker/Sources/Resources/Image.xcassets',
        'Evoker/Sources/Resources/Sound/**/*',
        'Evoker/Sources/Resources/SDK/**/*']
      }
    end

    s.subspec 'Map' do |ss|
      ss.source_files = ['EvokerMap/Sources/**/*.swift']

      ss.dependency 'AMap3DMap'
      ss.dependency 'AMapSearch'
      ss.dependency 'AMapLocation'
    end

end

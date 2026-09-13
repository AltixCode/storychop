require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', '..', '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'VideoTrimmer'
  s.version        = package['version'] || '1.0.0'
  s.summary        = 'On-device video trimming backed by AVFoundation.'
  s.description    = 'Trims video losslessly by copying samples rather than re-encoding.'
  s.author         = 'AltixCode'
  s.homepage       = 'https://www.altixcode.com'
  s.license        = 'MIT'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end

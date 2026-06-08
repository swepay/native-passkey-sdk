Pod::Spec.new do |s|
  s.name             = 'native_passkey_flutter'
  s.version          = '0.1.0'
  s.summary          = 'SDK Flutter híbrido de Passkey (WebAuthn/FIDO2) — Swepay / NativeGuard.'
  s.description      = <<-DESC
Cerimônia WebAuthn nativa no iOS via ASAuthorization (iOS 16+) com fallback WebView.
                       DESC
  s.homepage         = 'https://swepay.github.io/native-passkey-sdk/'
  s.license          = { :type => 'MIT', :file => '../LICENSE' }
  s.author           = { 'Swepay' => 'engineering@swepay.com.br' }
  s.source           = { :path => '.' }
  s.source_files     = 'Classes/**/*'
  s.dependency 'Flutter'
  s.platform = :ios, '12.0'
  s.swift_version = '5.0'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end

# Setup Android e iOS

Passkeys são vinculadas a um domínio: o **RP ID** (*Relying Party ID*). O RP ID
do seu projeto vem do backend NativePasskey, na resposta de `begin`. O sistema
operacional só libera a passkey para o app se o app provar que pertence a esse
domínio. É isso que o Digital Asset Links (Android) e o Associated Domains (iOS)
fazem.

## Android

### Gradle

O plugin declara `minSdk 23` e compila com `compileSdk 34`. Ajuste o app:

```groovy
// android/app/build.gradle
android {
    compileSdk = 34

    defaultConfig {
        minSdk = 23
    }
}
```

O plugin já traz as dependências do Credential Manager
(`androidx.credentials:credentials:1.3.0` e
`androidx.credentials:credentials-play-services-auth:1.3.0`).

### Quando o caminho nativo é usado

O plugin considera o autenticador disponível em **Android 9 (API 28) ou
superior**. Abaixo disso, o SDK usa o fallback WebView (se configurado).

::: warning Google Play Services
O Credential Manager depende do Google Play Services para passkeys. A
verificação de disponibilidade do plugin olha apenas a versão do Android. Em
aparelhos sem Play Services, a cerimônia nativa falha com `unknown_error`.
:::

### Digital Asset Links

Publique `https://<RP ID>/.well-known/assetlinks.json` declarando o seu app:

```json
[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls",
      "delegate_permission/common.get_login_creds"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "com.exemplo.app",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:...:FF"
      ]
    }
  }
]
```

- `package_name`: o `applicationId` do seu app.
- `sha256_cert_fingerprints`: o SHA-256 do certificado de assinatura
  (`keytool -list -v -keystore <keystore>`). Inclua o certificado de debug e o
  de release (ou o da Play App Signing).

### Origem do app Android

Na cerimônia nativa Android, a origem enviada ao backend não é uma URL HTTPS,
e sim `android:apk-key-hash:<hash>`. Se o backend responder
[`origin_not_allowed`](/reference/errors#origin-not-allowed), cadastre essa
origem na allowlist do projeto.

## iOS

### Versões

O podspec do plugin declara iOS 12. O caminho nativo (ASAuthorization platform
passkeys) só é usado no **iOS 16+**.

```ruby
# ios/Podfile
platform :ios, '12.0'
```

### Associated Domains

1. No Xcode, abra **Runner → Signing & Capabilities → + Capability →
   Associated Domains**.
2. Adicione `webcredentials:<RP ID>` (ex.: `webcredentials:app.exemplo.com.br`).

O entitlement fica assim:

```xml
<!-- ios/Runner/Runner.entitlements -->
<key>com.apple.developer.associated-domains</key>
<array>
  <string>webcredentials:app.exemplo.com.br</string>
</array>
```

3. Publique `https://<RP ID>/.well-known/apple-app-site-association` (sem
   extensão, `Content-Type: application/json`):

```json
{
  "webcredentials": {
    "apps": ["ABCDE12345.com.exemplo.app"]
  }
}
```

`ABCDE12345` é o seu Team ID da Apple e `com.exemplo.app` é o bundle identifier.

## Fallback WebView

O fallback usa o pacote [`flutter_inappwebview`](https://pub.dev/packages/flutter_inappwebview)
(dependência do plugin). A página carregada precisa estar em HTTPS e no mesmo
RP ID, porque a cerimônia WebAuthn roda no WebView. Detalhes em
[Fallback WebView](/flutter/webview-fallback).

## Checklist

- [ ] `minSdk 23` e `compileSdk 34` no Android
- [ ] `assetlinks.json` publicado no RP ID, com os fingerprints de debug e release
- [ ] Associated Domains com `webcredentials:<RP ID>` no iOS
- [ ] `apple-app-site-association` publicado no RP ID
- [ ] Origem do app Android cadastrada no projeto, se necessário

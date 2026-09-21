# native_passkey_flutter

SDK Flutter **híbrido** de autenticação WebAuthn/FIDO2 (Passkey) do ecossistema
Swepay/NativeGuard. Tenta a cerimônia **nativa** de Passkey (Android Credential
Manager / iOS ASAuthorization) e, quando o autenticador de plataforma não está
disponível, recorre automaticamente a um **fallback WebView** que carrega o app
web (`@nativeguard/passkey-angular` ou `@nativeguard/passkey-react`), com o
qual compartilha o mesmo contrato de API.

- pub.dev: [`native_passkey_flutter`](https://pub.dev/packages/native_passkey_flutter)
- Código-fonte e README completo:
  [`packages/flutter`](https://github.com/swepay/native-passkey-sdk/tree/main/packages/flutter)

## Requisitos de plataforma

| Plataforma | Caminho nativo | Mínimo |
|-----------|----------------|--------|
| Android   | Credential Manager (Jetpack) | API 28 (Android 9) + Google Play Services |
| iOS       | ASAuthorization platform passkeys | iOS 16 |

Abaixo desses mínimos (ou em plataformas sem suporte), o SDK usa o fallback
WebView se `webFallbackUrl` estiver configurado.

## Instalação

```yaml
dependencies:
  native_passkey_flutter: ^0.1.0
```

Consulte o [README do pacote](https://github.com/swepay/native-passkey-sdk/tree/main/packages/flutter#readme)
para a configuração completa de Android (Digital Asset Links) e iOS
(Associated Domains), além dos exemplos de uso do fallback WebView com o
`FlutterBridgeService` do `@nativeguard/passkey-angular`.

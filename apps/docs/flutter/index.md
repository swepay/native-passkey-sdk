# native_passkey_flutter

SDK Flutter **híbrido** de autenticação WebAuthn/FIDO2 (Passkey) do ecossistema
Swepay/NativeGuard. Tenta a cerimônia **nativa** de Passkey (Android Credential
Manager / iOS ASAuthorization) e, quando o autenticador de plataforma não está
disponível, recorre a um **fallback WebView** que carrega o seu app web
(`@swepay/native-passly-angular` ou `@swepay/native-passly-react`).

- pub.dev: [`native_passkey_flutter`](https://pub.dev/packages/native_passkey_flutter)
- Código-fonte:
  [`packages/flutter`](https://github.com/swepay/native-passkey-sdk/tree/main/packages/flutter)

## Requisitos de plataforma

| Plataforma | Caminho nativo | Nativo a partir de | Mínimo para instalar |
|-----------|----------------|--------------------|----------------------|
| Android   | Jetpack Credential Manager | API 28 (Android 9) | `minSdk 23` |
| iOS       | ASAuthorization platform passkeys | iOS 16 | iOS 12 |

Abaixo da versão nativa, o SDK usa o fallback WebView se `webFallbackUrl`
estiver configurado. Sem ele, as operações retornam
`PasskeyErrorCode.unsupported`.

Dart `>=3.3.0 <4.0.0`, Flutter `>=3.19.0`.

## Instalação

```yaml
dependencies:
  native_passkey_flutter: ^0.1.2
```

Depois, configure o [Android e o iOS](/flutter/setup).

## Arquitetura híbrida

```
register() / authenticate()
        │
        ├─ preferNative && autenticador de plataforma disponível?
        │      └─ SIM → begin → cerimônia nativa (Credential Manager / ASAuthorization) → finish
        │
        └─ NÃO → webFallbackUrl configurado e context informado?
                   ├─ SIM → PasskeyWebView (o app web executa begin + cerimônia + finish)
                   └─ NÃO → PasskeyError(unsupported)
```

A camada nativa apenas executa a cerimônia WebAuthn local. **Toda a validação
criptográfica acontece no backend** (`/passkey/*/finish`).

## Exemplo mínimo

```dart
import 'package:flutter/material.dart';
import 'package:native_passkey_flutter/native_passkey_flutter.dart';

final passkey = NativePasskey(
  const NativePasskeyConfig(
    projectId: 'proj_abc123',
    webFallbackUrl: 'https://app.exemplo.com.br/passkey', // opcional
  ),
);

Future<void> login(BuildContext context) async {
  final auth = await passkey.authenticate(context: context);
  if (auth.success) {
    // Envie auth.assertionJwt ao seu backend para validar via JWKS.
  }
}
```

## Páginas

- [Setup Android/iOS](/flutter/setup)
- [API Dart](/flutter/api)
- [Fallback WebView](/flutter/webview-fallback)
- [Tutorial Angular PWA + Flutter WebView](/examples/angular-pwa-flutter)

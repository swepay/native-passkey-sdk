# native_passkey_flutter

SDK Flutter **híbrido** de autenticação WebAuthn/FIDO2 (Passkey) do ecossistema
**Swepay / NativeGuard**.

Tenta a cerimônia **nativa** de Passkey (Android Credential Manager / iOS
ASAuthorization) e, quando o autenticador de plataforma não está disponível,
recorre automaticamente a um **fallback WebView** que carrega o app web
(`@nativeguard/passkey-angular` ou `@nativeguard/passkey-react`).

Faz parte do monorepo [`native-passkey-sdk`](https://github.com/swepay/native-passkey-sdk),
ao lado dos pacotes npm `@nativeguard/passkey`, `-angular` e `-react`, com os quais
compartilha o mesmo contrato de API.

## Requisitos de plataforma

| Plataforma | Caminho nativo | Mínimo |
|-----------|----------------|--------|
| Android   | Credential Manager (Jetpack) | API 28 (Android 9) + Google Play Services |
| iOS       | ASAuthorization platform passkeys | iOS 16 |

Abaixo desses mínimos (ou em plataformas sem suporte), o SDK usa o fallback WebView
se `webFallbackUrl` estiver configurado.

## Instalação

```yaml
dependencies:
  native_passkey_flutter: ^0.1.0
```

### Android

- `minSdkVersion 23` no `android/app/build.gradle` (o caminho nativo ativa em 28+).
- Configure o **Digital Asset Links** (`assetlinks.json`) do seu domínio (RP ID).

### iOS

- iOS Deployment Target ≥ 12 (passkey nativo ativa em 16+).
- Configure o **Associated Domains** (`webcredentials:seu-dominio`) no entitlement.

## Uso

```dart
import 'package:native_passkey_flutter/native_passkey_flutter.dart';

final passkey = NativePasskey(
  const NativePasskeyConfig(
    projectId: 'proj_abc123',
    // Default: https://api-passkey.swepay.com.br
    webFallbackUrl: 'https://sso.swepay.com.br/passkey', // opcional
  ),
);

// Registro
final reg = await passkey.register(
  const RegisterPasskeyOptions(
    externalUserId: 'user_123',
    userDisplayName: 'Ada Lovelace',
    deviceName: 'iPhone 16 Pro',
  ),
  context: context, // necessário só para o fallback WebView
);

// Autenticação
final auth = await passkey.authenticate(context: context);
if (auth.success) {
  // Envie auth.assertionJwt ao seu backend para validar via JWKS.
}
```

### Detecção de suporte

```dart
final support = await passkey.isAvailable();
if (!support.available) {
  // Não renderize o botão de biometria.
}
```

## Arquitetura híbrida

```
register() / authenticate()
        │
        ├─ preferNative && autenticador de plataforma disponível?
        │      └─ SIM → begin → cerimônia nativa (Credential Manager / ASAuthorization) → finish
        │
        └─ NÃO → webFallbackUrl configurado?
                   ├─ SIM → PasskeyWebView (app web executa begin + cerimônia + finish)
                   └─ NÃO → PasskeyError(unsupported)
```

A camada nativa apenas executa a cerimônia WebAuthn local; **toda a validação
criptográfica acontece no backend** (`/passkey/*/finish`).

## Publicação no pub.dev

Releases são automatizados via **GitHub Actions + OIDC** (sem tokens de longa
duração). Veja [CONTRIBUTING.md](https://github.com/swepay/native-passkey-sdk/blob/main/CONTRIBUTING.md).

## Licença

MIT © Swepay

# Fallback WebView

Quando o dispositivo não tem autenticador de plataforma (ou com
`preferNative: false`), o `NativePasskey` abre o seu app web dentro de um
WebView. O app web executa a cerimônia WebAuthn completa (begin, biometria e
finish) e devolve o resultado ao Flutter.

## Quando o fallback é usado

`register()` e `authenticate()` abrem o WebView se **todas** as condições forem
verdadeiras:

1. o caminho nativo não está disponível ou `preferNative` é `false`;
2. `NativePasskeyConfig.webFallbackUrl` está definido;
3. você passou um `context` montado (`context.mounted`).

Caso contrário, o resultado é `PasskeyErrorCode.unsupported`.

`registerWithRecoveryAssertion()` **não** tem fallback.

## Como funciona

1. O SDK abre uma rota modal em tela cheia (título *Registrar Passkey* ou
   *Entrar com Passkey*, com botão de fechar) contendo um `PasskeyWebView`.
2. O WebView carrega `webFallbackUrl` com o user agent
   `Mozilla/5.0 FlutterWebView/1.0 NativePasskey`.
3. Ao terminar o carregamento, o Flutter posta uma mensagem `passkey_init` em
   `window.AngularChannel` e em `window.PasskeyChannel` (se existirem):

```json
{
  "type": "passkey_init",
  "payload": {
    "mode": "authenticate",
    "externalUserId": "user_123"
  }
}
```

4. O app web executa a cerimônia e chama
   `window.flutter_inappwebview.callHandler('FlutterChannel', json)` com uma das
   mensagens abaixo.
5. O Flutter fecha a rota e converte o payload em `RegisterResult` ou
   `AuthenticateResult`.

| Mensagem do app web | Resultado no Flutter |
|---------------------|----------------------|
| `{ "type": "passkey_registered", "payload": { "credentialId": "...", "deviceName": "..." } }` | `RegisterResult` com `success: true` |
| `{ "type": "passkey_authenticated", "payload": { "assertionJwt": "...", "externalUserId": "..." } }` | `AuthenticateResult` com `success: true` |
| `{ "type": "passkey_error", "payload": { "error": "<código>", "message": "..." } }` | `success: false`, `error.code = PasskeyErrorCode.fromWire(error)` |
| Usuário fechou a tela | `success: false`, `PasskeyErrorCode.userCancelled` |
| Falha ao carregar a página principal | `success: false`, `PasskeyErrorCode.networkError` |

## O app web

### Angular

O [`@swepay/native-passly-angular`](/angular/flutter-bridge) já fala esse
protocolo: o `FlutterBridgeService` detecta o user agent `FlutterWebView`,
instala `window.AngularChannel`, e o `NativePasskeyService` envia
`passkey_registered`, `passkey_authenticated` ou `passkey_error`
automaticamente. Tutorial completo:
[Angular PWA + Flutter WebView](/examples/angular-pwa-flutter).

### React

O `@swepay/native-passly-react` **não** tem ponte Flutter embutida. Envie a
mensagem você mesmo após a operação:

```tsx
'use client';
import { usePasskey, type AuthenticateResult } from '@swepay/native-passly-react';

interface FlutterInAppWebView {
  callHandler(name: string, ...args: unknown[]): Promise<unknown>;
}

function sendToFlutter(result: AuthenticateResult): void {
  const bridge = (window as unknown as { flutter_inappwebview?: FlutterInAppWebView })
    .flutter_inappwebview;
  if (!bridge) return;

  const message = result.success
    ? {
        type: 'passkey_authenticated',
        payload: { assertionJwt: result.assertionJwt, externalUserId: result.externalUserId },
      }
    : { type: 'passkey_error', payload: { error: result.error?.code ?? 'unknown_error' } };

  void bridge.callHandler('FlutterChannel', JSON.stringify(message));
}

export function FlutterPasskeyLogin() {
  const { authenticate, isLoading } = usePasskey();
  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={async () => sendToFlutter(await authenticate())}
    >
      Entrar com passkey
    </button>
  );
}
```

## Usando `PasskeyWebView` diretamente

O widget é exportado se você quiser montar sua própria tela.

```dart
PasskeyWebView({
  Key? key,
  required String url,
  required PasskeyWebViewMode mode,
  required void Function(Map<String, dynamic> payload) onResult,
  required void Function(PasskeyError error) onError,
  String? externalUserId,
  String? userDisplayName,
  String? deviceName,
});
```

| Parâmetro | Descrição |
|-----------|-----------|
| `url` | URL do app web |
| `mode` | `PasskeyWebViewMode.register` ou `PasskeyWebViewMode.authenticate` |
| `onResult` | Recebe o `payload` de `passkey_registered` / `passkey_authenticated` |
| `onError` | Recebe `passkey_error` ou falha de carregamento |
| `externalUserId`, `userDisplayName`, `deviceName` | Repassados ao app web no `passkey_init` |

```dart
import 'package:flutter/material.dart';
import 'package:native_passkey_flutter/native_passkey_flutter.dart';

class PasskeyLoginScreen extends StatelessWidget {
  const PasskeyLoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Entrar')),
      body: PasskeyWebView(
        url: 'https://app.exemplo.com.br/passkey',
        mode: PasskeyWebViewMode.authenticate,
        onResult: (payload) {
          final jwt = payload['assertionJwt'] as String?;
          Navigator.of(context).pop(jwt);
        },
        onError: (error) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Erro: ${error.code.wireValue}')),
          );
        },
      ),
    );
  }
}
```

## Erros comuns

| Sintoma | Causa provável |
|---------|----------------|
| Sempre retorna `unsupported` | `webFallbackUrl` nulo ou `context` não informado |
| A tela abre e nunca fecha | O app web não chama `FlutterChannel` |
| `origin_not_allowed` no WebView | A origem do app web não está na allowlist do projeto |
| Código de recuperação vira `unknownError` | Veja a [nota de recuperação](/reference/errors#flutter) |

# Ponte Flutter (FlutterBridgeService)

O `FlutterBridgeService` conecta o app Angular a um app Flutter quando o Angular
roda dentro de um WebView do pacote
[`flutter_inappwebview`](https://pub.dev/packages/flutter_inappwebview) — por
exemplo, no [fallback WebView](/flutter/webview-fallback) do
`native_passkey_flutter`.

```typescript
import { FlutterBridgeService } from '@swepay/native-passly-angular';
```

## Protocolo

| Direção | Mecanismo |
|---------|-----------|
| Angular → Flutter | `window.flutter_inappwebview.callHandler('FlutterChannel', json)` |
| Flutter → Angular | `window.AngularChannel.postMessage(json)` |

As mensagens são strings JSON no formato `{ "type": "...", "payload": ... }`.

## Detecção do contexto Flutter

O serviço considera que está dentro do Flutter quando:

- `window.flutter_inappwebview` existe, **ou**
- o user agent contém `FlutterWebView` (o `PasskeyWebView` do
  `native_passkey_flutter` usa `Mozilla/5.0 FlutterWebView/1.0 NativePasskey`).

Nesse caso, o construtor instala `window.AngularChannel` para receber mensagens
do Flutter. Fora do Flutter, o serviço não faz nada.

## API

### `isFlutterContext`

`readonly boolean` — resultado da detecção, calculado na criação do serviço.

### `detectFlutterContext()`

Refaz a detecção. **Retorno:** `boolean`.

### `sendToFlutter(message)`

Envia uma mensagem ao handler `FlutterChannel`. Não faz nada fora do Flutter.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `message` | `FlutterChannelMessage` | ✅ | Mensagem a enviar |

**Retorno:** `void`

### `on(type)`

Observable com o `payload` das mensagens recebidas do Flutter de um tipo.
Os callbacks rodam dentro da zona do Angular (`NgZone.run`).

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `type` | `FlutterBridgeMessage['type']` | ✅ | `'biometric_result'`, `'device_info'` ou `'ready'` |

**Retorno:** `Observable<T>` (genérico, padrão `unknown`)

## Tipos

```typescript
/** Flutter → Angular */
interface FlutterBridgeMessage {
  type: 'biometric_result' | 'device_info' | 'ready';
  payload?: unknown;
}

/** Angular → Flutter */
interface FlutterChannelMessage {
  type: 'passkey_registered' | 'passkey_authenticated' | 'passkey_error';
  payload?: unknown;
}
```

## Mensagens enviadas automaticamente

O [`NativePasskeyService`](/angular/service) chama `sendToFlutter` depois de
cada operação que **resolve**:

| Método | Sucesso | Falha (`success: false`) |
|--------|---------|--------------------------|
| `registerPasskey` / `registerWithRecoveryAssertion` | `{ type: 'passkey_registered', payload: { credentialId, deviceName } }` | `{ type: 'passkey_error', payload: { error: <code> } }` |
| `authenticateWithPasskey` | `{ type: 'passkey_authenticated', payload: { assertionJwt, externalUserId } }` | `{ type: 'passkey_error', payload: { error: <code> } }` |

Se o método rejeitar (erro do backend, rede), nada é enviado. Nesse caso, envie
você mesmo um `passkey_error`:

```typescript
import { Injectable, inject } from '@angular/core';
import {
  FlutterBridgeService,
  NativePasskeyService,
  PasskeyError,
  type AuthenticateResult,
} from '@swepay/native-passly-angular';

@Injectable({ providedIn: 'root' })
export class PasskeyLoginFlow {
  private readonly passkey = inject(NativePasskeyService);
  private readonly bridge = inject(FlutterBridgeService);

  async authenticate(): Promise<AuthenticateResult | null> {
    try {
      return await this.passkey.authenticateWithPasskey();
    } catch (error) {
      const code = error instanceof PasskeyError ? error.code : 'unknown_error';
      this.bridge.sendToFlutter({ type: 'passkey_error', payload: { error: code } });
      return null;
    }
  }
}
```

## Mensagem de inicialização do `PasskeyWebView`

Quando a página termina de carregar, o `PasskeyWebView` do Flutter posta em
`window.AngularChannel` uma mensagem do tipo **`passkey_init`**:

```json
{
  "type": "passkey_init",
  "payload": {
    "mode": "register",
    "externalUserId": "user_123",
    "userDisplayName": "Ada Lovelace",
    "deviceName": "iPhone 16 Pro"
  }
}
```

`mode` é `register` ou `authenticate`. Os demais campos só aparecem quando
informados.

::: warning `passkey_init` não está no tipo `FlutterBridgeMessage`
O union de `FlutterBridgeMessage['type']` não inclui `'passkey_init'`. Em tempo
de execução, `on()` só compara strings, então você consegue assinar a mensagem
com um cast:

```typescript
import { Component, inject } from '@angular/core';
import { FlutterBridgeService, type FlutterBridgeMessage } from '@swepay/native-passly-angular';

interface PasskeyInitPayload {
  mode: 'register' | 'authenticate';
  externalUserId?: string;
  userDisplayName?: string;
  deviceName?: string;
}

// `passkey_init` não faz parte do union — o cast duplo é necessário.
const PASSKEY_INIT = 'passkey_init' as unknown as FlutterBridgeMessage['type'];

@Component({ selector: 'app-root', standalone: true, template: '' })
export class AppComponent {
  constructor() {
    inject(FlutterBridgeService)
      .on<PasskeyInitPayload>(PASSKEY_INIT)
      .subscribe((init) => console.log('Modo pedido pelo Flutter:', init.mode));
  }
}
```

A assinatura precisa existir **antes** do `onLoadStop` do WebView, ou a
mensagem se perde (não há replay).
:::

## Lado Flutter

Se você usa o `native_passkey_flutter`, o `PasskeyWebView` já registra o handler
`FlutterChannel` e converte as mensagens em `RegisterResult` /
`AuthenticateResult`. Veja [Fallback WebView](/flutter/webview-fallback).

Com seu próprio `InAppWebView`, registre o handler manualmente:

```dart
controller.addJavaScriptHandler(
  handlerName: 'FlutterChannel',
  callback: (args) {
    final message = jsonDecode(args.first as String) as Map<String, dynamic>;
    // message['type'] == 'passkey_authenticated' | 'passkey_registered' | 'passkey_error'
  },
);
```

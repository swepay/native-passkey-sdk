# @swepay/native-passly-angular

Módulo Angular, serviço, componentes e guard de rota sobre o cliente
`@swepay/native-passly-sdk`, com ponte nativa para WebView Flutter.

- npm: [`@swepay/native-passly-angular`](https://www.npmjs.com/package/@swepay/native-passly-angular)
- Código-fonte: [`packages/angular`](https://github.com/swepay/native-passkey-sdk/tree/main/packages/angular)

## Instalação

```bash
pnpm add @swepay/native-passly-angular
```

Instale apenas este pacote — o `@swepay/native-passly-sdk` é reexportado
automaticamente (`NativePasskeyClient`, `PasskeyError` e os tipos públicos).

## API pública

Exportado por `public-api.ts`:

- `NativePasskeyModule` e o token `NATIVE_PASSKEY_CONFIG`.
- `NativePasskeyService` — serviço com os mesmos métodos do cliente core.
- `FlutterBridgeService` — comunicação com o WebView nativo Flutter
  (tipos `FlutterBridgeMessage`, `FlutterChannelMessage`).
- `PasskeyButtonComponent`, `PasskeyManagerComponent` — componentes prontos
  (tipo `PasskeyButtonMode`).
- `passkeySupportedGuard` — guard de rota que verifica suporte à plataforma.

## Exemplo mínimo

```ts
import { NativePasskeyModule } from '@swepay/native-passly-angular';

@NgModule({
  imports: [
    NativePasskeyModule.forRoot({ projectId: 'proj_xxx' }),
  ],
})
export class AppModule {}
```

```ts
import { NativePasskeyService } from '@swepay/native-passly-angular';

constructor(private readonly passkey: NativePasskeyService) {}

async login() {
  const result = await this.passkey.authenticateWithPasskey();
}
```

## Integração com Flutter

Quando o app Angular roda dentro de um WebView Flutter (ver
[`native_passkey_flutter`](/flutter/)), o `FlutterBridgeService` permite delegar
a cerimônia de Passkey para o caminho nativo (Credential Manager/ASAuthorization)
antes de recorrer ao WebAuthn do navegador.

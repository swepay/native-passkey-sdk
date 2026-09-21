# @nativeguard/passkey-angular

Módulo Angular, serviço, componentes e guard de rota sobre o cliente
`@nativeguard/passkey`, com ponte nativa para WebView Flutter.

- npm: [`@nativeguard/passkey-angular`](https://www.npmjs.com/package/@nativeguard/passkey-angular)
- Código-fonte: [`packages/angular`](https://github.com/swepay/native-passkey-sdk/tree/main/packages/angular)

## Instalação

```bash
pnpm add @nativeguard/passkey-angular
```

Instale apenas este pacote — o `@nativeguard/passkey` é reexportado
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
import { NativePasskeyModule } from '@nativeguard/passkey-angular';

@NgModule({
  imports: [
    NativePasskeyModule.forRoot({ projectId: 'proj_xxx' }),
  ],
})
export class AppModule {}
```

```ts
import { NativePasskeyService } from '@nativeguard/passkey-angular';

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

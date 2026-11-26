# @swepay/native-passly-angular

Módulo, serviço, componentes standalone e guard de rota sobre o cliente
`@swepay/native-passly-sdk`, com ponte para WebView Flutter.

- npm: [`@swepay/native-passly-angular`](https://www.npmjs.com/package/@swepay/native-passly-angular)
- Código-fonte: [`packages/angular`](https://github.com/swepay/native-passkey-sdk/tree/main/packages/angular)

## Instalação

```bash
pnpm add @swepay/native-passly-angular @swepay/native-passly-sdk
```

`@swepay/native-passly-sdk` é peer dependency. Depois de instalado, você importa
tudo — inclusive `NativePasskeyClient`, `PasskeyError` e os tipos do core — de
`@swepay/native-passly-angular`.

## API pública

| Export | Documentação |
|--------|--------------|
| `NativePasskeyModule`, `NATIVE_PASSKEY_CONFIG` | [Setup](/angular/setup) |
| `NativePasskeyService` | [Serviço](/angular/service) |
| `PasskeyButtonComponent`, `PasskeyButtonMode` | [Componentes](/angular/components#passkeybuttoncomponent) |
| `PasskeyManagerComponent` | [Componentes](/angular/components#passkeymanagercomponent) |
| `passkeySupportedGuard` | [Guard](/angular/guard) |
| `FlutterBridgeService`, `FlutterBridgeMessage`, `FlutterChannelMessage` | [Ponte Flutter](/angular/flutter-bridge) |
| `NativePasskeyClient`, `PasskeyError` e tipos | [Core](/core/client) |

## Exemplo mínimo

```typescript
// src/app/app.config.ts
import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { NativePasskeyService } from '@swepay/native-passly-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      inject(NativePasskeyService).configure({ projectId: 'proj_xxx' });
    }),
  ],
};
```

```typescript
// src/app/login.component.ts
import { Component, inject } from '@angular/core';
import { NativePasskeyService } from '@swepay/native-passly-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `<button type="button" (click)="login()">Entrar com passkey</button>`,
})
export class LoginComponent {
  private readonly passkey = inject(NativePasskeyService);

  async login(): Promise<void> {
    const result = await this.passkey.authenticateWithPasskey();
    if (result.success) {
      console.log('JWT:', result.assertionJwt);
    }
  }
}
```

::: warning
`NativePasskeyModule.forRoot(config)` sozinho **não** configura o serviço. Veja
[Setup](/angular/setup).
:::

## Integração com Flutter

Quando o app Angular roda dentro de um WebView Flutter (ver
[`native_passkey_flutter`](/flutter/)), o `NativePasskeyService` envia o
resultado de cada registro/autenticação ao Flutter pelo
[`FlutterBridgeService`](/angular/flutter-bridge). Tutorial:
[Angular PWA + Flutter WebView](/examples/angular-pwa-flutter).

# NativePasskeyService

Serviço injetável (`providedIn: 'root'`) que encapsula o
[`NativePasskeyClient`](/core/client). Todos os métodos retornam `Promise`.

Além de chamar o cliente, o serviço envia o resultado de cada registro e
autenticação ao Flutter quando a aplicação roda dentro de um WebView Flutter
(veja [Ponte Flutter](/angular/flutter-bridge#mensagens-enviadas-automaticamente)).

```typescript
import { NativePasskeyService } from '@swepay/native-passly-angular';
```

## `configure(config)`

Cria o cliente interno. **Obrigatório** antes de qualquer outro método, exceto
`checkBiometricSupport`. Veja [Setup](/angular/setup).

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `config` | `NativePasskeyConfig` | ✅ | `projectId` e, opcionalmente, `apiBaseUrl` |

**Retorno:** `void`

## `checkBiometricSupport()`

Equivale a [`NativePasskeyClient.isAvailable()`](/core/client#nativepasskeyclient-isavailable).
Não depende de `configure()`.

**Retorno:** `Promise<PasskeySupport>`

```typescript
const support = await this.passkey.checkBiometricSupport();
if (!support.available) {
  this.showPasswordLogin = true;
}
```

## `registerPasskey(options)`

Igual a [`NativePasskeyClient.registerPasskey`](/core/client#registerpasskey-options).

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `externalUserId` | `string` | ✅ | ID do usuário no seu sistema |
| `userDisplayName` | `string` | ✅ | Nome exibido na UI biométrica |
| `deviceName` | `string` | ✅ | Rótulo do dispositivo |

**Retorno:** `Promise<RegisterResult>`

**Mensagem para o Flutter:** `passkey_registered` (com `credentialId` e
`deviceName`) ou `passkey_error` (com `error`).

## `registerWithRecoveryAssertion(options)`

Igual a [`NativePasskeyClient.registerWithRecoveryAssertion`](/core/client#registerwithrecoveryassertion-options).

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `assertion` | `string` | ✅ | Asserção de recuperação do Native Biometrics SDK |
| `deviceName` | `string` | ✅ | Rótulo do novo dispositivo |

**Retorno:** `Promise<RegisterResult>`

**Mensagem para o Flutter:** igual a `registerPasskey`.

## `authenticateWithPasskey(options?)`

Igual a [`NativePasskeyClient.authenticateWithPasskey`](/core/client#authenticatewithpasskey-options).

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `externalUserId` | `string` | ❌ | Omita para o fluxo *discoverable* |

**Retorno:** `Promise<AuthenticateResult>`

**Mensagem para o Flutter:** `passkey_authenticated` (com `assertionJwt` e
`externalUserId`) ou `passkey_error` (com `error`).

## `listCredentials(externalUserId, apiKey)`

Igual a [`NativePasskeyClient.listCredentials`](/core/client#listcredentials-externaluserid-apikey).

**Retorno:** `Promise<PasskeyCredential[]>`

## `revokeCredential(externalUserId, credentialId, apiKey)`

Igual a [`NativePasskeyClient.revokeCredential`](/core/client#revokecredential-externaluserid-credentialid-apikey).

**Retorno:** `Promise<void>`

::: danger API key no navegador
`listCredentials` e `revokeCredential` exigem a API key do projeto. Chamados no
navegador, expõem a chave a qualquer usuário.
:::

## Tratamento de erros

O serviço **não** captura exceções. Ele se comporta como o core:

- Cancelamento (`user_cancelled`) **resolve** com `{ success: false, error }`.
- Erros do backend **rejeitam** com `PasskeyError`.
- Falhas de rede e outras exceções do navegador **rejeitam** com a exceção
  original.

Quando o método rejeita, nenhuma mensagem é enviada ao Flutter. Envolva as
chamadas em `try/catch`:

```typescript
import { Component, inject, signal } from '@angular/core';
import { NativePasskeyService, PasskeyError } from '@swepay/native-passly-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <button type="button" [disabled]="loading()" (click)="login()">Entrar com passkey</button>
    @if (errorCode()) {
      <p role="alert">Não foi possível entrar ({{ errorCode() }}).</p>
    }
  `,
})
export class LoginComponent {
  private readonly passkey = inject(NativePasskeyService);
  readonly loading = signal(false);
  readonly errorCode = signal<string | null>(null);

  async login(): Promise<void> {
    this.loading.set(true);
    this.errorCode.set(null);
    try {
      const result = await this.passkey.authenticateWithPasskey();
      if (!result.success) {
        if (result.error?.code !== 'user_cancelled') {
          this.errorCode.set(result.error?.code ?? 'unknown_error');
        }
        return;
      }
      await fetch('/api/auth/passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assertionJwt: result.assertionJwt }),
      });
    } catch (error) {
      this.errorCode.set(error instanceof PasskeyError ? error.code : 'unknown_error');
    } finally {
      this.loading.set(false);
    }
  }
}
```

::: info Signals e RxJS
O serviço expõe apenas `Promise`s. Os componentes da biblioteca usam signals
internamente, mas o serviço não expõe signals nem Observables. Para eventos do
Flutter em RxJS, use [`FlutterBridgeService.on()`](/angular/flutter-bridge#on-type).
:::

# Componentes

Componentes **standalone**, com `ChangeDetectionStrategy.OnPush`. Importe-os
direto no `imports` do seu componente.

## `PasskeyButtonComponent`

Seletor: `npk-passkey-button`

Botão de autenticação ou registro, com spinner e estilos próprios. Só aparece
quando o dispositivo suporta passkeys.

```typescript
import { PasskeyButtonComponent } from '@swepay/native-passly-angular';
```

**Inputs**

| Input | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| `projectId` | `string` | ✅ | — | ID do projeto |
| `apiBaseUrl` | `string` | ❌ | `https://api-passkey.swepay.com.br` | URL base da API |
| `mode` | `PasskeyButtonMode` (`'authenticate' \| 'register'`) | ❌ | `'authenticate'` | Operação executada no clique |
| `label` | `string` | ❌ | `'Entrar com biometria'` | Texto do botão |
| `externalUserId` | `string` | ❌ (✅ em `register`) | — | ID do usuário |
| `userDisplayName` | `string` | ❌ (✅ em `register`) | — | Nome exibido na UI biométrica |
| `deviceName` | `string` | ❌ (✅ em `register`) | — | Rótulo do dispositivo |

**Outputs**

| Output | Payload | Quando |
|--------|---------|--------|
| `authSuccess` | `AuthenticateResult` | Autenticação com sucesso |
| `registerSuccess` | `RegisterResult` | Registro com sucesso |
| `passkeyError` | `string` | Resultado com `success: false` — emite `error.code` (ou `'error'`) |

**Comportamento**

- No `ngOnInit`, chama `NativePasskeyService.configure({ projectId, apiBaseUrl })`
  e detecta o suporte. O botão só é renderizado se `support.available` for `true`.
- Enquanto a operação roda, o botão fica desabilitado, com `aria-busy` e o texto
  `Aguardando biometria...`.
- Classes CSS: `.npk-btn`, `.npk-btn--loading`, `.npk-spinner`.

::: warning
- No modo `register`, os três inputs de usuário são obrigatórios na prática:
  o componente os repassa sem validar.
- Exceções (erro do backend, falha de rede) **não** são emitidas em
  `passkeyError`. Elas rejeitam o handler de clique e aparecem no console.
- `configure()` altera o serviço singleton — veja
  [Setup](/angular/setup#componentes-e-o-servico-compartilhado).
:::

**Exemplo — autenticação**

```typescript
import { Component } from '@angular/core';
import { PasskeyButtonComponent, type AuthenticateResult } from '@swepay/native-passly-angular';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [PasskeyButtonComponent],
  template: `
    <npk-passkey-button
      projectId="proj_xxx"
      label="Entrar com Face ID"
      (authSuccess)="onLogin($event)"
      (passkeyError)="onError($event)" />
  `,
})
export class LoginPageComponent {
  async onLogin(result: AuthenticateResult): Promise<void> {
    await fetch('/api/auth/passkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assertionJwt: result.assertionJwt }),
    });
  }

  onError(code: string): void {
    if (code !== 'user_cancelled') console.warn('Falha no login:', code);
  }
}
```

**Exemplo — registro**

```typescript
import { Component, input } from '@angular/core';
import { PasskeyButtonComponent, type RegisterResult } from '@swepay/native-passly-angular';

@Component({
  selector: 'app-enable-passkey',
  standalone: true,
  imports: [PasskeyButtonComponent],
  template: `
    <npk-passkey-button
      projectId="proj_xxx"
      mode="register"
      label="Ativar biometria"
      [externalUserId]="userId()"
      [userDisplayName]="userName()"
      deviceName="Meu celular"
      (registerSuccess)="onRegistered($event)" />
  `,
})
export class EnablePasskeyComponent {
  readonly userId = input.required<string>();
  readonly userName = input.required<string>();

  onRegistered(result: RegisterResult): void {
    console.log('Passkey criada:', result.credentialId);
  }
}
```

## `PasskeyManagerComponent`

Seletor: `npk-passkey-manager`

Lista as passkeys de um usuário (nome, data de registro e último uso), com botão
**Remover** em cada item.

```typescript
import { PasskeyManagerComponent } from '@swepay/native-passly-angular';
```

**Inputs**

| Input | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `externalUserId` | `string` | ✅ | ID do usuário |
| `projectId` | `string` | ✅ | ID do projeto |
| `apiKey` | `string` | ✅ | API key do projeto |
| `apiBaseUrl` | `string` | ❌ | URL base da API |

Não há outputs.

**Comportamento**

- No `ngOnInit`, chama `configure()` e carrega a lista com `listCredentials`.
- Estados: `Carregando...`, `Nenhum dispositivo biométrico registrado.` e a lista.
- Durante a revogação, o botão do item mostra `Removendo...`.
- Classes CSS: `.npk-manager`, `.npk-state`, `.npk-list`, `.npk-item`,
  `.npk-info`, `.npk-revoke`.

::: danger
O componente envia a API key do projeto a partir do navegador. Qualquer usuário
consegue lê-la. Avalie se a gestão de credenciais deve ficar no seu backend.
:::

**Exemplo**

```typescript
import { Component } from '@angular/core';
import { PasskeyManagerComponent } from '@swepay/native-passly-angular';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [PasskeyManagerComponent],
  template: `
    <npk-passkey-manager
      projectId="proj_xxx"
      externalUserId="user-123"
      [apiKey]="apiKey" />
  `,
})
export class DevicesComponent {
  readonly apiKey = 'obtenha-do-seu-backend';
}
```

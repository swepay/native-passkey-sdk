# passkeySupportedGuard

Guard funcional (`CanActivateFn`) que só libera a rota quando o dispositivo
suporta passkeys.

```typescript
import { passkeySupportedGuard } from '@swepay/native-passly-angular';
```

## Comportamento

1. Chama `NativePasskeyService.checkBiometricSupport()`.
2. Se `support.available` for `true`, libera a navegação.
3. Caso contrário, redireciona para **`/unsupported`**.

A rota de redirecionamento é fixa. Sua aplicação precisa declarar uma rota
`unsupported`, senão o roteador falha com "Cannot match any routes".

O guard não depende de `configure()`.

## Exemplo

```typescript
// src/app/app.routes.ts
import type { Routes } from '@angular/router';
import { passkeySupportedGuard } from '@swepay/native-passly-angular';
import { PasskeyLoginComponent } from './passkey-login.component';
import { UnsupportedComponent } from './unsupported.component';

export const routes: Routes = [
  {
    path: 'login/passkey',
    component: PasskeyLoginComponent,
    canActivate: [passkeySupportedGuard],
  },
  // Destino fixo do guard quando não há suporte a passkey.
  { path: 'unsupported', component: UnsupportedComponent },
];
```

```typescript
// src/app/unsupported.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unsupported',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Biometria indisponível</h1>
    <p>Este dispositivo ou navegador não suporta passkeys.</p>
    <a routerLink="/login">Entrar com senha</a>
  `,
})
export class UnsupportedComponent {}
```

# Quick start

Este guia mostra o código mínimo para autenticar um usuário com passkey e
enviar o JWT resultante ao seu backend. Escolha o seu framework.

Em todos os exemplos, substitua `proj_xxx` pelo `projectId` do seu projeto.

## React / Next.js

**1. Envolva a aplicação com o `PasskeyProvider`.**

```tsx
// app/providers.tsx
'use client';
import type { ReactNode } from 'react';
import { PasskeyProvider } from '@swepay/native-passly-react';

export function Providers({ children }: { children: ReactNode }) {
  return <PasskeyProvider config={{ projectId: 'proj_xxx' }}>{children}</PasskeyProvider>;
}
```

**2. Autentique com o hook `usePasskey`.**

```tsx
// app/login-button.tsx
'use client';
import { usePasskey } from '@swepay/native-passly-react';

export function LoginButton() {
  const { authenticate, isLoading, error } = usePasskey();

  async function handleLogin() {
    const result = await authenticate();
    if (!result.success) return;

    await fetch('/api/auth/passkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assertionJwt: result.assertionJwt }),
    });
  }

  return (
    <>
      <button type="button" disabled={isLoading} onClick={handleLogin}>
        Entrar com passkey
      </button>
      {error && <p role="alert">Erro: {error.code}</p>}
    </>
  );
}
```

**3. Valide o JWT no servidor** com o
[`PasskeyVerifier`](/react/server). O tutorial
[Next.js App Router](/examples/nextjs-app-router) mostra o fluxo completo.

## Angular

**1. Configure o serviço na inicialização da aplicação.**

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

**2. Autentique a partir de um componente.**

```typescript
// src/app/login.component.ts
import { Component, inject, signal } from '@angular/core';
import { NativePasskeyService } from '@swepay/native-passly-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <button type="button" (click)="login()">Entrar com passkey</button>
    @if (errorCode()) {
      <p role="alert">Erro: {{ errorCode() }}</p>
    }
  `,
})
export class LoginComponent {
  private readonly passkey = inject(NativePasskeyService);
  readonly errorCode = signal<string | null>(null);

  async login(): Promise<void> {
    const result = await this.passkey.authenticateWithPasskey();
    if (!result.success) {
      this.errorCode.set(result.error?.code ?? 'unknown_error');
      return;
    }
    await fetch('/api/auth/passkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assertionJwt: result.assertionJwt }),
    });
  }
}
```

Veja [Angular — Setup](/angular/setup) para entender por que `configure()` é
obrigatório.

## Core (JavaScript puro)

```typescript
import { NativePasskeyClient } from '@swepay/native-passly-sdk';

const client = new NativePasskeyClient({ projectId: 'proj_xxx' });

const support = await NativePasskeyClient.isAvailable();
if (support.available) {
  const result = await client.authenticateWithPasskey();
  if (result.success) {
    console.log('JWT para o seu backend:', result.assertionJwt);
  } else {
    console.warn('Falhou:', result.error?.code);
  }
}
```

## Flutter

```dart
import 'package:flutter/material.dart';
import 'package:native_passkey_flutter/native_passkey_flutter.dart';

final passkey = NativePasskey(
  const NativePasskeyConfig(projectId: 'proj_xxx'),
);

Future<void> login(BuildContext context) async {
  final result = await passkey.authenticate(context: context);
  if (result.success) {
    // Envie result.assertionJwt ao seu backend.
  } else {
    debugPrint('Falhou: ${result.error?.code.wireValue}');
  }
}
```

Antes de rodar no dispositivo, configure o
[Android e o iOS](/flutter/setup).

## Antes do login: o registro

O usuário só consegue autenticar depois de **registrar** uma passkey. O registro
exige que você já saiba quem é o usuário (por exemplo, logo após um login por
senha ou um cadastro):

```typescript
import { NativePasskeyClient } from '@swepay/native-passly-sdk';

const client = new NativePasskeyClient({ projectId: 'proj_xxx' });

const result = await client.registerPasskey({
  externalUserId: 'user-123',      // ID do usuário no seu sistema
  userDisplayName: 'João Silva',   // exibido na UI biométrica
  deviceName: 'iPhone 16 Pro',     // rótulo do dispositivo
});
```

## Próximos passos

- [Referência do `NativePasskeyClient`](/core/client)
- [Tutorial Next.js App Router](/examples/nextjs-app-router)
- [Referência de erros](/reference/errors)

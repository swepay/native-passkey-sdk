# native-passkey-sdk

Monorepo do **NativePasskey SDK** — autenticacao WebAuthn/FIDO2 (Passkey) do ecossistema **Swepay / NativeGuard**, publicado sob o escopo `@nativeguard`.

## Visao Geral

O SDK expoe quatro pacotes publicaveis que compartilham a mesma logica WebAuthn via camada de core, sem duplicacao de codigo entre frameworks.

```
packages/core      → @nativeguard/passkey          (zero deps, TypeScript puro)     → npm
packages/angular   → @nativeguard/passkey-angular   (Angular 21, ng-packagr)         → npm
packages/react     → @nativeguard/passkey-react     (React 19 + Next.js 15, tsup)    → npm
packages/flutter   → native_passkey_flutter         (Flutter hibrido nativo+WebView) → pub.dev
apps/demo-nextjs                                    (Next.js 15, nao publicado)
```

## Estrutura do Repositorio

```
native-passkey-sdk/
├── packages/
│   ├── core/                           ← @nativeguard/passkey
│   │   └── src/
│   │       ├── client.ts               ← NativePasskeyClient
│   │       ├── types.ts                ← Tipos publicos e DTOs
│   │       ├── utils/base64url.ts      ← bufferToBase64Url, base64UrlToBuffer
│   │       ├── utils/detection.ts      ← detectPasskeySupport (SSR-safe)
│   │       └── index.ts
│   ├── angular/                        ← @nativeguard/passkey-angular
│   │   └── projects/passkey-angular/
│   │       └── src/lib/
│   │           ├── services/
│   │           ├── components/
│   │           ├── guards/
│   │           └── native-passkey.module.ts
│   └── react/                          ← @nativeguard/passkey-react
│       └── src/
│           ├── providers/PasskeyProvider.tsx
│           ├── hooks/
│           ├── components/
│           └── server/PasskeyVerifier.ts
├── apps/
│   └── demo-nextjs/                    ← Demo Next.js 15
└── docs/
    └── NATIVEPASSKEY_SDK.md            ← Especificacao completa
```

## Instalacao

### React / Next.js

```bash
pnpm add @nativeguard/passkey-react
```

### Angular

```bash
pnpm add @nativeguard/passkey-angular
```

> Os pacotes `@nativeguard/passkey-react` e `@nativeguard/passkey-angular` reexportam todos os tipos do core. Nao e necessario instalar `@nativeguard/passkey` separadamente.

### Flutter

```bash
flutter pub add native_passkey_flutter
```

> SDK **hibrido**: usa passkey nativo (Android Credential Manager / iOS ASAuthorization) e cai para WebView quando o autenticador de plataforma nao esta disponivel. Detalhes em [`packages/flutter/README.md`](packages/flutter/README.md).

## Uso

### React — PasskeyProvider

Envolva sua aplicacao com `PasskeyProvider` no layout raiz:

```tsx
// app/layout.tsx
import { PasskeyProvider } from '@nativeguard/passkey-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <PasskeyProvider config={{
          projectId: process.env.NEXT_PUBLIC_NPK_PROJECT_ID!,
          apiBaseUrl: process.env.NEXT_PUBLIC_NPK_API_URL
        }}>
          {children}
        </PasskeyProvider>
      </body>
    </html>
  );
}
```

### React — Autenticacao

```tsx
'use client';
import { PasskeyButton } from '@nativeguard/passkey-react';

export function LoginPage() {
  return (
    <PasskeyButton
      onSuccess={(result) => {
        // result.assertionJwt — enviar ao backend para validar
        fetch('/api/auth/passkey', {
          method: 'POST',
          body: JSON.stringify({ assertionJwt: result.assertionJwt })
        });
      }}
      onError={(code) => console.error('Erro:', code)}
    />
  );
}
```

### React — Registro

```tsx
'use client';
import { PasskeyRegisterButton } from '@nativeguard/passkey-react';

export function RegisterPage() {
  return (
    <PasskeyRegisterButton
      registerOptions={{
        externalUserId: 'user-123',
        userDisplayName: 'Joao Silva',
        deviceName: 'iPhone 16 Pro'
      }}
      onSuccess={(result) => console.log('Registrado:', result.credentialId)}
      onError={(code) => console.error('Erro:', code)}
    />
  );
}
```

### React — Hook usePasskey

```tsx
'use client';
import { usePasskey } from '@nativeguard/passkey-react';

export function CustomButton() {
  const { authenticate, register, isLoading, error } = usePasskey();

  return (
    <button onClick={() => authenticate({ externalUserId: 'user-123' })} disabled={isLoading}>
      {isLoading ? 'Aguardando...' : 'Entrar com biometria'}
    </button>
  );
}
```

### React — Verificacao server-side (Next.js API Route)

```typescript
// app/api/auth/passkey/route.ts
import { PasskeyVerifier } from '@nativeguard/passkey-react/server';

const verifier = new PasskeyVerifier({
  projectId: process.env.NPK_PROJECT_ID!,
  audience: process.env.NEXT_PUBLIC_APP_URL!
});

export async function POST(request: Request) {
  const { assertionJwt } = await request.json();
  const result = await verifier.verify(assertionJwt);
  if (!result.valid) return Response.json({ error: result.error }, { status: 401 });
  // Criar sessao...
  return Response.json({ success: true, userId: result.externalUserId });
}
```

### Angular — NativePasskeyModule

```typescript
// app.module.ts
import { NativePasskeyModule } from '@nativeguard/passkey-angular';

@NgModule({
  imports: [
    NativePasskeyModule.forRoot({
      projectId: 'proj_abc123',
      apiBaseUrl: 'https://api-passkey.swepay.com.br'
    })
  ]
})
export class AppModule {}
```

### Angular — Componente standalone

```typescript
import { PasskeyButtonComponent } from '@nativeguard/passkey-angular';

@Component({
  standalone: true,
  imports: [PasskeyButtonComponent],
  template: `
    <npk-passkey-button
      projectId="proj_abc123"
      mode="authenticate"
      label="Entrar com biometria"
      (authSuccess)="onAuth($event)"
      (passkeyError)="onError($event)"
    />
  `
})
export class LoginComponent {
  onAuth(result: AuthenticateResult) { /* ... */ }
  onError(code: string) { /* ... */ }
}
```

### Angular — Servico NativePasskeyService

```typescript
import { NativePasskeyService } from '@nativeguard/passkey-angular';
import { inject } from '@angular/core';

export class MyComponent {
  private readonly passkey = inject(NativePasskeyService);

  async login() {
    const result = await this.passkey.authenticateWithPasskey();
    if (result.success) {
      // Usar result.assertionJwt
    }
  }
}
```

### Angular — Guard de suporte

```typescript
import { Routes } from '@angular/router';
import { passkeySupportedGuard } from '@nativeguard/passkey-angular';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [passkeySupportedGuard]
  }
];
```

### Flutter — NativePasskey

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
await passkey.register(
  const RegisterPasskeyOptions(
    externalUserId: 'user_123',
    userDisplayName: 'Joao Silva',
    deviceName: 'iPhone 16 Pro',
  ),
  context: context, // necessario apenas para o fallback WebView
);

// Autenticacao
final auth = await passkey.authenticate(context: context);
if (auth.success) {
  // auth.assertionJwt — enviar ao backend para validar via JWKS
}
```

## API de Referencia

### Core — `@nativeguard/passkey`

| Export | Descricao |
|--------|-----------|
| `NativePasskeyClient` | Cliente principal WebAuthn/FIDO2 |
| `PasskeyError` | Classe de erro discriminada por `code` |
| `NativePasskeyConfig` | Configuracao do cliente |
| `RegisterPasskeyOptions` | Opcoes de registro |
| `RegisterResult` | Resultado do registro |
| `AuthenticateOptions` | Opcoes de autenticacao |
| `AuthenticateResult` | Resultado da autenticacao |
| `PasskeyCredential` | Credencial armazenada |
| `PasskeySupport` | Suporte do dispositivo |
| `PasskeyErrorCode` | Codigos de erro |

### `NativePasskeyClient`

```typescript
class NativePasskeyClient {
  static isAvailable(): Promise<PasskeySupport>
  registerPasskey(options: RegisterPasskeyOptions): Promise<RegisterResult>
  authenticateWithPasskey(options?: AuthenticateOptions): Promise<AuthenticateResult>
  listCredentials(externalUserId: string, apiKey: string): Promise<PasskeyCredential[]>
  revokeCredential(externalUserId: string, credentialId: string, apiKey: string): Promise<void>
}
```

### `PasskeyErrorCode`

| Codigo | Descricao |
|--------|-----------|
| `user_cancelled` | Usuario cancelou o prompt biometrico |
| `challenge_expired` | Challenge expirou (> 5 minutos) |
| `challenge_mismatch` | Challenge nao corresponde |
| `origin_not_allowed` | Origin nao autorizada para o projeto |
| `rp_id_hash_mismatch` | RP ID hash invalido |
| `user_not_verified` | Verificacao biometrica nao concluida |
| `signature_verification_failed` | Assinatura ECDSA invalida |
| `sign_count_replay_attack_detected` | Possivel replay attack |
| `credential_not_found_or_revoked` | Credencial inexistente ou revogada |
| `credential_already_registered` | Credencial ja registrada |
| `project_not_found` | projectId invalido |
| `network_error` | Erro de rede |
| `unknown_error` | Erro desconhecido |

## Variaveis de Ambiente

```env
# Cliente (public)
NEXT_PUBLIC_NPK_PROJECT_ID=proj_abc123
NEXT_PUBLIC_NPK_API_URL=https://api-passkey.swepay.com.br
NEXT_PUBLIC_APP_URL=https://meuapp.com

# Servidor (privado)
NPK_PROJECT_ID=proj_abc123
NPK_API_URL=https://api-passkey.swepay.com.br
SESSION_SECRET=<chave-secreta-32-bytes>
```

## Comandos

```bash
# Instalar dependencias
pnpm install

# Build de todos os pacotes (respeita ordem de dependencia via Turborepo)
pnpm build

# Build de pacote especifico
pnpm --filter @nativeguard/passkey build
pnpm --filter @nativeguard/passkey-angular build
pnpm --filter @nativeguard/passkey-react build

# Watch mode para desenvolvimento
pnpm --filter @nativeguard/passkey dev
pnpm --filter @nativeguard/passkey-react dev

# Rodar demo Next.js
pnpm --filter demo-nextjs dev

# Testes
pnpm test
pnpm --filter @nativeguard/passkey test --coverage

# Typecheck
pnpm typecheck

# Lint
pnpm lint

# Versionamento (Changesets)
pnpm changeset          # Descrever mudanca
pnpm changeset version  # Aplicar versoes
pnpm changeset publish  # Publicar no npm
```

## Toolchain

| Ferramenta | Versao | Funcao |
|-----------|--------|--------|
| Node.js | 20 LTS | Runtime |
| pnpm | 9.x | Package manager + workspaces |
| Turborepo | 2.x | Orquestracao de build |
| tsup | 8.x | Build ESM + CJS + `.d.ts` (core/react) |
| ng-packagr | 21.x | Build da biblioteca Angular |
| TypeScript | 5.5+ | Tipagem estatica |
| Vitest | 2.x | Testes unitarios |
| Changesets | 2.x | Versionamento coordenado |

## Hierarquia de Build

```
packages/core
   ├── packages/angular   (dependsOn: core)
   └── packages/react     (dependsOn: core)
          └── apps/demo-nextjs
```

Turborepo gerencia a ordem automaticamente via `dependsOn: ["^build"]` no `turbo.json`.

## Publicacao

### npm — os 3 pacotes TypeScript (Changesets)

Os tres pacotes npm sao versionados em conjunto via Changesets `fixed`:

```bash
pnpm changeset   # Selecionar os 3 pacotes, descrever mudanca
pnpm changeset version
pnpm changeset publish
```

O workflow `.github/workflows/release.yml` automatiza esse processo via GitHub Actions ao mergear em `main`.

### pub.dev — native_passkey_flutter (OIDC)

O pacote Flutter e versionado **separadamente** (nao entra no fluxo Changesets) e publicado no pub.dev via **GitHub Actions OIDC**, sem tokens de longa duracao:

```bash
# 1. bump em packages/flutter/pubspec.yaml + entrada no CHANGELOG.md
# 2. tag git no formato esperado pelo pub.dev
git tag native_passkey_flutter-v0.1.0
git push origin native_passkey_flutter-v0.1.0
```

A tag dispara `.github/workflows/publish-flutter.yml`. Pre-requisito (uma vez): habilitar **Automated publishing** na pagina do package no pub.dev apontando para `swepay/native-passkey-sdk` + tag pattern `native_passkey_flutter-v{{version}}`. Detalhes em [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licenca

MIT — Swepay / NativeGuard

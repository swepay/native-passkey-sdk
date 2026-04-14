# NativePasskey SDK — Monorepo (Claude Code Agent Spec)

> **Agente:** Implemente o monorepo `native-passkey-sdk` completo.
> Repositório único, três pacotes publicáveis, toolchain `pnpm` + `turbo`.
> Este documento é a especificação completa e autoritativa — implemente exatamente como descrito,
> na ordem das seções. Não interprete, não improvise.

---

## 0. Decisões de Arquitetura

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Package manager | `pnpm` | workspaces nativos, symlinks eficientes, sem hoisting problemático |
| Build orchestrator | `turbo` (Turborepo) | pipeline de dependência entre pacotes, cache incremental |
| Core + React build | `tsup` | zero-config, ESM + CJS + `.d.ts` em uma passagem |
| Angular build | `ng-packagr` | único toolchain suportado para bibliotecas Angular |
| Versionamento | `changesets` | changelog + bump coordenado entre os 3 pacotes |
| Node mínimo | 20 LTS | `fetch` nativo, `crypto.getRandomValues` sem polyfill |

### Hierarquia de dependência (build order)

```
packages/core          → @nativeguard/passkey
   ├── packages/angular → @nativeguard/passkey-angular  (depende de core)
   └── packages/react   → @nativeguard/passkey-react    (depende de core)
          └── apps/demo-nextjs                           (depende de react)
```

`turbo` resolve essa ordem automaticamente via `dependsOn` no `turbo.json`.

---

## 1. Estrutura Completa do Repositório

```
native-passkey-sdk/
├── packages/
│   ├── core/                               ← @nativeguard/passkey
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   ├── utils/
│   │   │   │   ├── base64url.ts
│   │   │   │   └── detection.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   │   └── client.test.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── angular/                            ← @nativeguard/passkey-angular
│   │   ├── projects/
│   │   │   └── passkey-angular/            ← biblioteca publicável (ng-packagr)
│   │   │       ├── src/
│   │   │       │   ├── lib/
│   │   │       │   │   ├── services/
│   │   │       │   │   │   ├── native-passkey.service.ts
│   │   │       │   │   │   └── flutter-bridge.service.ts
│   │   │       │   │   ├── components/
│   │   │       │   │   │   ├── passkey-button/
│   │   │       │   │   │   │   └── passkey-button.component.ts
│   │   │       │   │   │   └── passkey-manager/
│   │   │       │   │   │       └── passkey-manager.component.ts
│   │   │       │   │   ├── guards/
│   │   │       │   │   │   └── passkey-supported.guard.ts
│   │   │       │   │   └── native-passkey.module.ts
│   │   │       │   └── public-api.ts
│   │   │       ├── package.json            ← name: "@nativeguard/passkey-angular"
│   │   │       └── ng-package.json
│   │   ├── src/                            ← Angular demo app (não publicada)
│   │   │   └── app/
│   │   ├── angular.json
│   │   ├── package.json                    ← workspace root do Angular CLI
│   │   └── tsconfig.json
│   │
│   └── react/                              ← @nativeguard/passkey-react
│       ├── src/
│       │   ├── components/
│       │   │   ├── PasskeyButton.tsx
│       │   │   ├── PasskeyRegisterButton.tsx
│       │   │   └── PasskeyManager.tsx
│       │   ├── hooks/
│       │   │   ├── usePasskey.ts
│       │   │   ├── usePasskeySupport.ts
│       │   │   └── usePasskeyCredentials.ts
│       │   ├── providers/
│       │   │   └── PasskeyProvider.tsx
│       │   ├── server/
│       │   │   ├── PasskeyVerifier.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── tsup.config.ts
│
├── apps/
│   └── demo-nextjs/                        ← Next.js 15 demo (não publicado)
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── api/auth/passkey/route.ts
│       └── package.json
│
├── .changeset/
│   └── config.json
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                            ← root (private, scripts globais)
├── .npmrc
└── README.md
```

---

## 2. Raiz do Monorepo

### `pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

### `.npmrc`

```ini
# Evita hoisting que quebra peerDependencies do Angular
shamefully-hoist=false
strict-peer-dependencies=false
auto-install-peers=true
```

### `package.json` (root — private)

```json
{
  "name": "native-passkey-sdk",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rm -rf node_modules",
    "changeset": "changeset",
    "version": "changeset version",
    "publish": "turbo run build --filter=!./apps/* && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "turbo": "^2.3.0",
    "typescript": "~5.6.0"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  },
  "packageManager": "pnpm@9.15.0"
}
```

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "projects/**", "package.json", "tsconfig*.json", "tsup.config.ts", "ng-package.json"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tests/**"]
    },
    "lint": {
      "inputs": ["src/**", "projects/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [
    ["@nativeguard/passkey", "@nativeguard/passkey-angular", "@nativeguard/passkey-react"]
  ],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

> `fixed` garante que os 3 pacotes sempre versione juntos (ex: todos vão para 1.2.0 ao mesmo tempo).

---

## 3. `packages/core` — `@nativeguard/passkey`

### `package.json`

```json
{
  "name": "@nativeguard/passkey",
  "version": "1.0.0",
  "description": "NativePasskey core client — WebAuthn/FIDO2 framework-agnostic",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "node --experimental-vm-modules node_modules/.bin/jest",
    "lint": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "tsup": "^8.3.0",
    "typescript": "~5.6.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  },
  "sideEffects": false
}
```

### `tsup.config.ts`

```typescript
// packages/core/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: 'es2022',
  // Sem externals — core é zero-dependency em produção
});
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["dist", "tests"]
}
```

### `src/types.ts`

```typescript
// packages/core/src/types.ts

export interface NativePasskeyConfig {
  /** projectId do NativePasskey (ex: "proj_abc123") */
  projectId: string;
  /** URL base da API. Default: "https://passkey.nativeguard.io" */
  apiBaseUrl?: string;
}

// ── Registro ──────────────────────────────────────────────────────────────────

export interface RegisterPasskeyOptions {
  externalUserId: string;
  userDisplayName: string;
  /** Label do dispositivo (ex: "iPhone 16 Pro") */
  deviceName: string;
}

export interface RegisterResult {
  success: boolean;
  credentialId?: string;
  deviceName?: string;
  registeredAt?: string;
  error?: PasskeyError;
}

// ── Autenticação ──────────────────────────────────────────────────────────────

export interface AuthenticateOptions {
  /** Omitir = discoverable credential flow (passkey puro, sem digitar usuário) */
  externalUserId?: string;
}

export interface AuthenticateResult {
  success: boolean;
  /**
   * JWT ES256 assinado com a chave do projeto.
   * Enviar ao backend do cliente para validar via JWKS e criar sessão.
   */
  assertionJwt?: string;
  externalUserId?: string;
  error?: PasskeyError;
}

// ── Credenciais ───────────────────────────────────────────────────────────────

export interface PasskeyCredential {
  credentialId: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt?: string;
  aaguid: string;
  transports: string[];
  isActive: boolean;
}

// ── Suporte de dispositivo ────────────────────────────────────────────────────

export interface PasskeySupport {
  /** false = não renderizar botão de biometria */
  available: boolean;
  /** Chrome 108+ / Safari 16.4+: autofill passkey (Conditional UI) */
  conditionalMediationAvailable: boolean;
  /** Tipo de biometria predominante no dispositivo */
  biometricType: 'face' | 'fingerprint' | 'platform' | 'none';
}

// ── Erros ─────────────────────────────────────────────────────────────────────

export type PasskeyErrorCode =
  | 'user_cancelled'
  | 'challenge_expired'
  | 'challenge_mismatch'
  | 'origin_not_allowed'
  | 'rp_id_hash_mismatch'
  | 'user_not_verified'
  | 'signature_verification_failed'
  | 'sign_count_replay_attack_detected'
  | 'credential_not_found_or_revoked'
  | 'credential_already_registered'
  | 'project_not_found'
  | 'network_error'
  | 'unknown_error';

export class PasskeyError extends Error {
  constructor(
    public readonly code: PasskeyErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'PasskeyError';
  }
}

// ── DTOs internos da API (não exportados na public API) ───────────────────────

export interface BeginRegistrationResponse {
  challengeId: string;
  challengeBase64Url: string;
  rpId: string;
  rpName: string;
  userIdBase64Url: string;
  userDisplayName: string;
  pubKeyCredParams: number[];
  excludeCredentials: Array<{ credentialIdBase64Url: string; transports: string[] }>;
}

export interface BeginAuthResponse {
  challengeId: string;
  challengeBase64Url: string;
  rpId: string;
  allowCredentials?: Array<{ credentialIdBase64Url: string; transports: string[] }>;
}
```

### `src/utils/base64url.ts`

```typescript
// packages/core/src/utils/base64url.ts

/** Converte ArrayBuffer → Base64Url sem padding (RFC 4648 §5) */
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/** Converte Base64Url → Uint8Array */
export function base64UrlToBuffer(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
```

### `src/utils/detection.ts`

```typescript
// packages/core/src/utils/detection.ts
import type { PasskeySupport } from '../types';

/**
 * Detecta suporte WebAuthn + platform authenticator.
 * SSR-safe: retorna { available: false } se window não existir.
 */
export async function detectPasskeySupport(): Promise<PasskeySupport> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { available: false, conditionalMediationAvailable: false, biometricType: 'none' };
  }

  const [platformAvailable, conditionalAvailable] = await Promise.all([
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
    // Conditional UI (autofill passkey) — Chrome 108+, Safari 16.4+
    (PublicKeyCredential as any).isConditionalMediationAvailable?.() ?? Promise.resolve(false)
  ]);

  if (!platformAvailable) {
    return { available: false, conditionalMediationAvailable: false, biometricType: 'none' };
  }

  return {
    available: true,
    conditionalMediationAvailable: conditionalAvailable as boolean,
    biometricType: detectBiometricType()
  };
}

function detectBiometricType(): PasskeySupport['biometricType'] {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'face';        // Face ID
  if (/Android/.test(ua)) return 'fingerprint';           // Android Biometric
  return 'platform';                                       // Windows Hello / macOS Touch ID
}
```

### `src/client.ts`

```typescript
// packages/core/src/client.ts
import { base64UrlToBuffer, bufferToBase64Url } from './utils/base64url';
import { detectPasskeySupport } from './utils/detection';
import type {
  AuthenticateOptions, AuthenticateResult, BeginAuthResponse,
  BeginRegistrationResponse, NativePasskeyConfig,
  PasskeyCredential, PasskeySupport,
  RegisterPasskeyOptions, RegisterResult
} from './types';
import { PasskeyError } from './types';

export class NativePasskeyClient {
  readonly projectId: string;
  private readonly baseUrl: string;

  constructor(config: NativePasskeyConfig) {
    this.projectId = config.projectId;
    this.baseUrl = `${config.apiBaseUrl ?? 'https://passkey.nativeguard.io'}/v1/projects/${config.projectId}`;
  }

  /** Detecta suporte biométrico no dispositivo atual. SSR-safe. */
  static isAvailable(): Promise<PasskeySupport> {
    return detectPasskeySupport();
  }

  // ── Registro ─────────────────────────────────────────────────────────────

  async registerPasskey(options: RegisterPasskeyOptions): Promise<RegisterResult> {
    const begin = await this.post<BeginRegistrationResponse>(
      '/passkey/register/begin',
      { externalUserId: options.externalUserId, userDisplayName: options.userDisplayName, deviceName: options.deviceName }
    );

    let credential: PublicKeyCredential;
    try {
      const raw = await navigator.credentials.create({
        publicKey: {
          challenge: base64UrlToBuffer(begin.challengeBase64Url),
          rp: { id: begin.rpId, name: begin.rpName },
          user: {
            id: base64UrlToBuffer(begin.userIdBase64Url),
            name: options.externalUserId,
            displayName: begin.userDisplayName
          },
          pubKeyCredParams: begin.pubKeyCredParams.map(alg => ({ type: 'public-key' as const, alg })),
          authenticatorSelection: {
            authenticatorAttachment: 'platform',  // biometria nativa — NUNCA cross-platform
            userVerification: 'required',          // obrigatório para Face ID / fingerprint
            residentKey: 'preferred'
          },
          attestation: 'none',
          timeout: 60_000,
          excludeCredentials: begin.excludeCredentials?.map(c => ({
            type: 'public-key' as const,
            id: base64UrlToBuffer(c.credentialIdBase64Url),
            transports: c.transports as AuthenticatorTransport[]
          })) ?? []
        }
      });
      credential = raw as PublicKeyCredential;
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') {
        return { success: false, error: new PasskeyError('user_cancelled') };
      }
      throw err;
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    return this.post<RegisterResult>('/passkey/register/finish', {
      externalUserId: options.externalUserId,
      challengeId: begin.challengeId,
      clientDataJsonBase64Url: bufferToBase64Url(response.clientDataJSON),
      attestationObjectBase64Url: bufferToBase64Url(response.attestationObject),
      deviceName: options.deviceName,
      transports: response.getTransports?.() ?? ['internal']
    });
  }

  // ── Autenticação ─────────────────────────────────────────────────────────

  async authenticateWithPasskey(options?: AuthenticateOptions): Promise<AuthenticateResult> {
    const begin = await this.post<BeginAuthResponse>(
      '/passkey/authenticate/begin',
      { externalUserId: options?.externalUserId ?? null }
    );

    let assertion: PublicKeyCredential;
    try {
      const raw = await navigator.credentials.get({
        publicKey: {
          challenge: base64UrlToBuffer(begin.challengeBase64Url),
          rpId: begin.rpId,
          userVerification: 'required',
          timeout: 60_000,
          allowCredentials: begin.allowCredentials?.map(c => ({
            type: 'public-key' as const,
            id: base64UrlToBuffer(c.credentialIdBase64Url),
            transports: c.transports as AuthenticatorTransport[]
          })) ?? []
        }
      });
      assertion = raw as PublicKeyCredential;
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') {
        return { success: false, error: new PasskeyError('user_cancelled') };
      }
      throw err;
    }

    const response = assertion.response as AuthenticatorAssertionResponse;
    return this.post<AuthenticateResult>('/passkey/authenticate/finish', {
      challengeId: begin.challengeId,
      credentialIdBase64Url: bufferToBase64Url(assertion.rawId),
      clientDataJsonBase64Url: bufferToBase64Url(response.clientDataJSON),
      authenticatorDataBase64Url: bufferToBase64Url(response.authenticatorData),
      signatureBase64Url: bufferToBase64Url(response.signature),
      userHandleBase64Url: response.userHandle ? bufferToBase64Url(response.userHandle) : undefined
    });
  }

  // ── Gestão de credenciais (requer X-NativePasskey-ApiKey) ─────────────────

  async listCredentials(externalUserId: string, apiKey: string): Promise<PasskeyCredential[]> {
    return this.get(`/passkey/users/${externalUserId}/credentials`, apiKey);
  }

  async revokeCredential(externalUserId: string, credentialId: string, apiKey: string): Promise<void> {
    await this.delete(`/passkey/users/${externalUserId}/credentials/${credentialId}`, apiKey);
  }

  // ── HTTP helpers ─────────────────────────────────────────────────────────

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new PasskeyError((err.error as any) ?? 'unknown_error', `HTTP ${res.status}: ${err.error}`);
    }
    return res.json() as Promise<T>;
  }

  private async get<T>(path: string, apiKey: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'X-NativePasskey-ApiKey': apiKey }
    });
    if (!res.ok) throw new PasskeyError('unknown_error', `HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  private async delete(path: string, apiKey: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: { 'X-NativePasskey-ApiKey': apiKey }
    });
    if (!res.ok) throw new PasskeyError('unknown_error', `HTTP ${res.status}`);
  }
}
```

### `src/index.ts`

```typescript
// packages/core/src/index.ts
export { NativePasskeyClient } from './client';
export { PasskeyError } from './types';
export type {
  NativePasskeyConfig,
  RegisterPasskeyOptions,
  RegisterResult,
  AuthenticateOptions,
  AuthenticateResult,
  PasskeyCredential,
  PasskeySupport,
  PasskeyErrorCode
} from './types';
```

---

## 4. `packages/angular` — `@nativeguard/passkey-angular`

> O Angular CLI exige que a biblioteca viva dentro de um workspace Angular (`angular.json`).
> O diretório `packages/angular/` É o workspace Angular. A biblioteca publicável fica em
> `packages/angular/projects/passkey-angular/`.

### `packages/angular/package.json` (workspace root — não publicado)

```json
{
  "name": "passkey-angular-workspace",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "build": "ng build passkey-angular --configuration production",
    "dev": "ng serve",
    "lint": "ng lint",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@angular/common": "^21.0.0",
    "@angular/core": "^21.0.0",
    "@angular/forms": "^21.0.0",
    "@angular/platform-browser": "^21.0.0",
    "@angular/router": "^21.0.0",
    "@angular/service-worker": "^21.0.0",
    "@nativeguard/passkey": "workspace:*",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^21.0.0",
    "@angular/cli": "^21.0.0",
    "@angular/compiler": "^21.0.0",
    "@angular/compiler-cli": "^21.0.0",
    "ng-packagr": "^21.0.0",
    "typescript": "~5.6.0"
  }
}
```

> `"@nativeguard/passkey": "workspace:*"` — pnpm resolve para o pacote local em
> `packages/core`. Sem `npm link`, sem `file:`. Turbo garante que core buildi antes.

### `packages/angular/projects/passkey-angular/package.json` (publicado no npm)

```json
{
  "name": "@nativeguard/passkey-angular",
  "version": "1.0.0",
  "peerDependencies": {
    "@angular/common": "^21.0.0",
    "@angular/core": "^21.0.0",
    "@angular/router": "^21.0.0",
    "@nativeguard/passkey": "^1.0.0",
    "rxjs": "~7.8.0"
  },
  "dependencies": {
    "tslib": "^2.3.0"
  },
  "sideEffects": false
}
```

### `packages/angular/projects/passkey-angular/ng-package.json`

```json
{
  "$schema": "../../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "../../dist/passkey-angular",
  "lib": {
    "entryFile": "src/public-api.ts"
  }
}
```

### `packages/angular/angular.json` (trecho relevante)

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "projects": {
    "passkey-angular": {
      "projectType": "library",
      "root": "projects/passkey-angular",
      "sourceRoot": "projects/passkey-angular/src",
      "prefix": "npk",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:ng-packagr",
          "options": {
            "project": "projects/passkey-angular/ng-package.json"
          },
          "configurations": {
            "production": { "tsConfig": "projects/passkey-angular/tsconfig.lib.prod.json" },
            "development": { "tsConfig": "projects/passkey-angular/tsconfig.lib.json" }
          },
          "defaultConfiguration": "production"
        }
      }
    },
    "demo": {
      "projectType": "application",
      "root": "src",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/demo",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "serviceWorker": "ngsw-config.json",
            "assets": ["src/favicon.ico", "src/assets", { "glob": "manifest.webmanifest", "input": "src", "output": "/" }],
            "styles": ["src/styles.css"],
            "scripts": []
          }
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": { "buildTarget": "demo:build:production" },
            "development": { "buildTarget": "demo:build:development" }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  }
}
```

### `packages/angular/projects/passkey-angular/src/lib/services/flutter-bridge.service.ts`

```typescript
// packages/angular/projects/passkey-angular/src/lib/services/flutter-bridge.service.ts
import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';

export interface FlutterBridgeMessage {
  type: 'biometric_result' | 'device_info' | 'ready';
  payload?: unknown;
}

export interface FlutterChannelMessage {
  type: 'passkey_registered' | 'passkey_authenticated' | 'passkey_error';
  payload?: unknown;
}

/**
 * Bridge bidirecional Angular ↔ Flutter via flutter_inappwebview.
 *
 * Flutter side (Dart) — configuração mínima:
 * ```dart
 * controller.addJavaScriptHandler(
 *   handlerName: 'FlutterChannel',
 *   callback: (args) { handleAngularMessage(args[0]); }
 * );
 * ```
 *
 * Angular → Flutter: window.flutter_inappwebview.callHandler('FlutterChannel', json)
 * Flutter → Angular: window.AngularChannel.postMessage(json)
 */
@Injectable({ providedIn: 'root' })
export class FlutterBridgeService implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly messages$ = new Subject<FlutterBridgeMessage>();

  readonly isFlutterContext: boolean = this.detectFlutterContext();

  constructor() {
    if (this.isFlutterContext) {
      (window as any).AngularChannel = {
        postMessage: (jsonStr: string) => {
          this.ngZone.run(() => {
            try {
              this.messages$.next(JSON.parse(jsonStr) as FlutterBridgeMessage);
            } catch {
              console.error('[NPK] Invalid Flutter message:', jsonStr);
            }
          });
        }
      };
    }
  }

  detectFlutterContext(): boolean {
    return typeof (window as any).flutter_inappwebview !== 'undefined'
      || navigator.userAgent.includes('FlutterWebView');
  }

  sendToFlutter(message: FlutterChannelMessage): void {
    if (!this.isFlutterContext) return;
    (window as any).flutter_inappwebview?.callHandler?.('FlutterChannel', JSON.stringify(message));
  }

  on<T = unknown>(type: FlutterBridgeMessage['type']): Observable<T> {
    return this.messages$.pipe(
      filter(msg => msg.type === type),
      map(msg => msg.payload as T)
    );
  }

  ngOnDestroy(): void {
    this.messages$.complete();
  }
}
```

### `packages/angular/projects/passkey-angular/src/lib/services/native-passkey.service.ts`

```typescript
// packages/angular/projects/passkey-angular/src/lib/services/native-passkey.service.ts
import { Injectable, inject } from '@angular/core';
import {
  NativePasskeyClient,
  type NativePasskeyConfig,
  type PasskeySupport,
  type RegisterPasskeyOptions,
  type RegisterResult,
  type AuthenticateOptions,
  type AuthenticateResult,
  type PasskeyCredential
} from '@nativeguard/passkey';
import { FlutterBridgeService } from './flutter-bridge.service';

@Injectable({ providedIn: 'root' })
export class NativePasskeyService {
  private client!: NativePasskeyClient;
  private readonly flutter = inject(FlutterBridgeService);

  configure(config: NativePasskeyConfig): void {
    this.client = new NativePasskeyClient(config);
  }

  checkBiometricSupport(): Promise<PasskeySupport> {
    return NativePasskeyClient.isAvailable();
  }

  async registerPasskey(options: RegisterPasskeyOptions): Promise<RegisterResult> {
    const result = await this.client.registerPasskey(options);
    this.flutter.sendToFlutter(
      result.success
        ? { type: 'passkey_registered', payload: { credentialId: result.credentialId, deviceName: result.deviceName } }
        : { type: 'passkey_error', payload: { error: result.error?.code } }
    );
    return result;
  }

  async authenticateWithPasskey(options?: AuthenticateOptions): Promise<AuthenticateResult> {
    const result = await this.client.authenticateWithPasskey(options);
    this.flutter.sendToFlutter(
      result.success
        ? { type: 'passkey_authenticated', payload: { assertionJwt: result.assertionJwt, externalUserId: result.externalUserId } }
        : { type: 'passkey_error', payload: { error: result.error?.code } }
    );
    return result;
  }

  listCredentials(externalUserId: string, apiKey: string): Promise<PasskeyCredential[]> {
    return this.client.listCredentials(externalUserId, apiKey);
  }

  revokeCredential(externalUserId: string, credentialId: string, apiKey: string): Promise<void> {
    return this.client.revokeCredential(externalUserId, credentialId, apiKey);
  }
}
```

### `packages/angular/projects/passkey-angular/src/lib/components/passkey-button/passkey-button.component.ts`

```typescript
// packages/angular/projects/passkey-angular/src/lib/components/passkey-button/passkey-button.component.ts
import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal
} from '@angular/core';
import { NgIf } from '@angular/common';
import type { AuthenticateOptions, AuthenticateResult, PasskeySupport, RegisterPasskeyOptions, RegisterResult } from '@nativeguard/passkey';
import { NativePasskeyService } from '../../services/native-passkey.service';

export type PasskeyButtonMode = 'authenticate' | 'register';

@Component({
  selector: 'npk-passkey-button',
  standalone: true,
  imports: [NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button *ngIf="support()?.available"
      class="npk-btn"
      [class.npk-btn--loading]="loading()"
      [disabled]="loading()"
      (click)="handleClick()"
      [attr.aria-busy]="loading()">
      <span *ngIf="loading()" class="npk-spinner" role="status"></span>
      <span>{{ loading() ? 'Aguardando biometria...' : label }}</span>
    </button>
  `,
  styles: [`
    .npk-btn { display:inline-flex; align-items:center; gap:8px; padding:12px 24px;
      border-radius:12px; border:none; background:#1a1a2e; color:#fff;
      font-size:16px; font-weight:500; cursor:pointer; min-width:220px; justify-content:center;
      transition:opacity .2s,transform .15s; }
    .npk-btn:disabled { opacity:.6; cursor:not-allowed; }
    .npk-btn:not(:disabled):hover { opacity:.9; transform:translateY(-1px); }
    .npk-spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.3);
      border-top-color:#fff; border-radius:50%; animation:npk-spin .75s linear infinite; }
    @keyframes npk-spin { to { transform:rotate(360deg); } }
  `]
})
export class PasskeyButtonComponent implements OnInit {
  @Input({ required: true }) projectId!: string;
  @Input() apiBaseUrl?: string;
  @Input() mode: PasskeyButtonMode = 'authenticate';
  @Input() label = 'Entrar com biometria';
  @Input() externalUserId?: string;
  @Input() userDisplayName?: string;
  @Input() deviceName?: string;

  @Output() authSuccess = new EventEmitter<AuthenticateResult>();
  @Output() registerSuccess = new EventEmitter<RegisterResult>();
  @Output() passkeyError = new EventEmitter<string>();

  private readonly svc = inject(NativePasskeyService);
  readonly support = signal<PasskeySupport | null>(null);
  readonly loading = signal(false);

  async ngOnInit(): Promise<void> {
    this.svc.configure({ projectId: this.projectId, apiBaseUrl: this.apiBaseUrl });
    this.support.set(await this.svc.checkBiometricSupport());
  }

  async handleClick(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      if (this.mode === 'authenticate') {
        const r = await this.svc.authenticateWithPasskey({ externalUserId: this.externalUserId });
        r.success ? this.authSuccess.emit(r) : this.passkeyError.emit(r.error?.code ?? 'error');
      } else {
        const r = await this.svc.registerPasskey({
          externalUserId: this.externalUserId!,
          userDisplayName: this.userDisplayName!,
          deviceName: this.deviceName!
        });
        r.success ? this.registerSuccess.emit(r) : this.passkeyError.emit(r.error?.code ?? 'error');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
```

### `packages/angular/projects/passkey-angular/src/lib/components/passkey-manager/passkey-manager.component.ts`

```typescript
// packages/angular/projects/passkey-angular/src/lib/components/passkey-manager/passkey-manager.component.ts
import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import type { PasskeyCredential } from '@nativeguard/passkey';
import { NativePasskeyService } from '../../services/native-passkey.service';

@Component({
  selector: 'npk-passkey-manager',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="npk-manager">
      <div *ngIf="loading()" class="npk-state">Carregando...</div>
      <div *ngIf="!loading() && credentials().length === 0" class="npk-state">
        Nenhum dispositivo biométrico registrado.
      </div>
      <ul *ngIf="credentials().length > 0" class="npk-list">
        <li *ngFor="let cred of credentials()" class="npk-item">
          <div class="npk-info">
            <strong>{{ cred.deviceName }}</strong>
            <span>Registrado {{ cred.createdAt | date:'dd/MM/yyyy' }}</span>
            <span *ngIf="cred.lastUsedAt">Último uso {{ cred.lastUsedAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <button class="npk-revoke" (click)="revoke(cred)"
            [disabled]="revokingId() === cred.credentialId">
            {{ revokingId() === cred.credentialId ? 'Removendo...' : 'Remover' }}
          </button>
        </li>
      </ul>
    </div>
  `
})
export class PasskeyManagerComponent implements OnInit {
  @Input({ required: true }) externalUserId!: string;
  @Input({ required: true }) projectId!: string;
  @Input({ required: true }) apiKey!: string;
  @Input() apiBaseUrl?: string;

  private readonly svc = inject(NativePasskeyService);
  readonly credentials = signal<PasskeyCredential[]>([]);
  readonly loading = signal(false);
  readonly revokingId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.svc.configure({ projectId: this.projectId, apiBaseUrl: this.apiBaseUrl });
    this.loading.set(true);
    try {
      this.credentials.set(await this.svc.listCredentials(this.externalUserId, this.apiKey));
    } finally {
      this.loading.set(false);
    }
  }

  async revoke(cred: PasskeyCredential): Promise<void> {
    this.revokingId.set(cred.credentialId);
    try {
      await this.svc.revokeCredential(this.externalUserId, cred.credentialId, this.apiKey);
      this.credentials.update(list => list.filter(c => c.credentialId !== cred.credentialId));
    } finally {
      this.revokingId.set(null);
    }
  }
}
```

### `packages/angular/projects/passkey-angular/src/lib/native-passkey.module.ts`

```typescript
// packages/angular/projects/passkey-angular/src/lib/native-passkey.module.ts
import { ModuleWithProviders, NgModule } from '@angular/core';
import type { NativePasskeyConfig } from '@nativeguard/passkey';
import { NativePasskeyService } from './services/native-passkey.service';
import { FlutterBridgeService } from './services/flutter-bridge.service';

export const NATIVE_PASSKEY_CONFIG = 'NATIVE_PASSKEY_CONFIG';

@NgModule({})
export class NativePasskeyModule {
  static forRoot(config: NativePasskeyConfig): ModuleWithProviders<NativePasskeyModule> {
    return {
      ngModule: NativePasskeyModule,
      providers: [
        NativePasskeyService,
        FlutterBridgeService,
        { provide: NATIVE_PASSKEY_CONFIG, useValue: config }
      ]
    };
  }
}
```

### `packages/angular/projects/passkey-angular/src/public-api.ts`

```typescript
// packages/angular/projects/passkey-angular/src/public-api.ts

// Angular-specific
export { NativePasskeyModule, NATIVE_PASSKEY_CONFIG } from './lib/native-passkey.module';
export { NativePasskeyService } from './lib/services/native-passkey.service';
export { FlutterBridgeService } from './lib/services/flutter-bridge.service';
export { PasskeyButtonComponent } from './lib/components/passkey-button/passkey-button.component';
export { PasskeyManagerComponent } from './lib/components/passkey-manager/passkey-manager.component';
export type { FlutterBridgeMessage, FlutterChannelMessage } from './lib/services/flutter-bridge.service';
export type { PasskeyButtonMode } from './lib/components/passkey-button/passkey-button.component';

// Re-export do core — consumer instala apenas @nativeguard/passkey-angular
export { NativePasskeyClient, PasskeyError } from '@nativeguard/passkey';
export type {
  NativePasskeyConfig, RegisterPasskeyOptions, AuthenticateOptions,
  RegisterResult, AuthenticateResult, PasskeyCredential, PasskeySupport, PasskeyErrorCode
} from '@nativeguard/passkey';
```

### Flutter — `packages/angular/flutter/lib/passkey_webview.dart`

```dart
// packages/angular/flutter/lib/passkey_webview.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class PasskeyWebView extends StatefulWidget {
  final String angularUrl;
  final void Function(String jwt, String userId) onAuthenticated;
  final void Function(String credentialId) onRegistered;
  final void Function(String error) onError;

  const PasskeyWebView({
    super.key,
    required this.angularUrl,
    required this.onAuthenticated,
    required this.onRegistered,
    required this.onError,
  });

  @override
  State<PasskeyWebView> createState() => _PasskeyWebViewState();
}

class _PasskeyWebViewState extends State<PasskeyWebView> {
  InAppWebViewController? _ctrl;

  @override
  Widget build(BuildContext context) {
    return InAppWebView(
      initialUrlRequest: URLRequest(url: WebUri(widget.angularUrl)),
      initialSettings: InAppWebViewSettings(
        javaScriptEnabled: true,
        allowsInlineMediaPlayback: true,
        javaScriptCanOpenWindowsAutomatically: true,
        // CRÍTICO: identifica o contexto Flutter no Angular
        userAgent: 'Mozilla/5.0 FlutterWebView/1.0',
      ),
      onWebViewCreated: (ctrl) {
        _ctrl = ctrl;
        ctrl.addJavaScriptHandler(
          handlerName: 'FlutterChannel',
          callback: (args) {
            if (args.isEmpty) return;
            final msg = jsonDecode(args[0] as String) as Map<String, dynamic>;
            final type = msg['type'] as String?;
            final payload = msg['payload'] as Map<String, dynamic>?;
            switch (type) {
              case 'passkey_authenticated':
                widget.onAuthenticated(
                  payload?['assertionJwt'] as String? ?? '',
                  payload?['externalUserId'] as String? ?? '',
                );
              case 'passkey_registered':
                widget.onRegistered(payload?['credentialId'] as String? ?? '');
              case 'passkey_error':
                widget.onError(payload?['error'] as String? ?? 'unknown_error');
            }
          },
        );
      },
    );
  }
}
```

### `packages/angular/flutter/pubspec.yaml`

```yaml
name: native_passkey_flutter
description: Flutter WebView wrapper for @nativeguard/passkey-angular

environment:
  sdk: '>=3.3.0 <4.0.0'
  flutter: '>=3.19.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_inappwebview: ^6.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
```

---

## 5. `packages/react` — `@nativeguard/passkey-react`

### `package.json`

```json
{
  "name": "@nativeguard/passkey-react",
  "version": "1.0.0",
  "description": "NativePasskey React components, hooks and Next.js App Router integration",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./server": {
      "import": { "types": "./dist/server/index.d.ts", "default": "./dist/server/index.js" },
      "require": { "types": "./dist/server/index.d.cts", "default": "./dist/server/index.cjs" }
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "dependencies": {
    "@nativeguard/passkey": "workspace:*",
    "jose": "^5.9.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tsup": "^8.3.0",
    "typescript": "~5.6.0"
  },
  "sideEffects": false
}
```

### `tsup.config.ts`

```typescript
// packages/react/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig([
  // Client bundle — marcado com 'use client' para Next.js App Router
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['react', 'react-dom', '@nativeguard/passkey'],
    esbuildOptions(opts) {
      opts.banner = { js: "'use client';" };
    }
  },
  // Server bundle — sem 'use client', para Server Components e API Routes
  {
    entry: { 'server/index': 'src/server/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['jose', '@nativeguard/passkey']
  }
]);
```

### `src/providers/PasskeyProvider.tsx`

```tsx
// packages/react/src/providers/PasskeyProvider.tsx
'use client';
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { NativePasskeyClient, type NativePasskeyConfig, type PasskeySupport } from '@nativeguard/passkey';

interface PasskeyContextValue {
  client: NativePasskeyClient;
  support: PasskeySupport | null;
  isLoading: boolean;
}

const PasskeyContext = createContext<PasskeyContextValue | null>(null);

export function PasskeyProvider({ children, config }: { children: ReactNode; config: NativePasskeyConfig }) {
  const [support, setSupport] = useState<PasskeySupport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const client = useMemo(() => new NativePasskeyClient(config), [config.projectId, config.apiBaseUrl]);

  useEffect(() => {
    NativePasskeyClient.isAvailable().then(setSupport).finally(() => setIsLoading(false));
  }, []);

  return (
    <PasskeyContext.Provider value={{ client, support, isLoading }}>
      {children}
    </PasskeyContext.Provider>
  );
}

export function usePasskeyContext(): PasskeyContextValue {
  const ctx = useContext(PasskeyContext);
  if (!ctx) throw new Error('usePasskeyContext must be inside <PasskeyProvider>');
  return ctx;
}
```

### `src/hooks/usePasskey.ts`

```typescript
// packages/react/src/hooks/usePasskey.ts
'use client';
import { useCallback, useState } from 'react';
import {
  PasskeyError,
  type AuthenticateOptions, type AuthenticateResult,
  type RegisterPasskeyOptions, type RegisterResult
} from '@nativeguard/passkey';
import { usePasskeyContext } from '../providers/PasskeyProvider';

export function usePasskey() {
  const { client } = usePasskeyContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PasskeyError | null>(null);

  const authenticate = useCallback(async (options?: AuthenticateOptions): Promise<AuthenticateResult> => {
    setIsLoading(true); setError(null);
    try {
      const result = await client.authenticateWithPasskey(options);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const e = err instanceof PasskeyError ? err : new PasskeyError('unknown_error', String(err));
      setError(e);
      return { success: false, error: e };
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const register = useCallback(async (options: RegisterPasskeyOptions): Promise<RegisterResult> => {
    setIsLoading(true); setError(null);
    try {
      const result = await client.registerPasskey(options);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const e = err instanceof PasskeyError ? err : new PasskeyError('unknown_error', String(err));
      setError(e);
      return { success: false, error: e };
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return { isLoading, error, authenticate, register, clearError: () => setError(null) };
}
```

### `src/hooks/usePasskeySupport.ts`

```typescript
// packages/react/src/hooks/usePasskeySupport.ts
'use client';
import { useEffect, useState } from 'react';
import { NativePasskeyClient, type PasskeySupport } from '@nativeguard/passkey';

/** SSR-safe: retorna null durante hidratação */
export function usePasskeySupport(): { support: PasskeySupport | null; isLoading: boolean } {
  const [support, setSupport] = useState<PasskeySupport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    NativePasskeyClient.isAvailable().then(setSupport).finally(() => setIsLoading(false));
  }, []);

  return { support, isLoading };
}
```

### `src/hooks/usePasskeyCredentials.ts`

```typescript
// packages/react/src/hooks/usePasskeyCredentials.ts
'use client';
import { useCallback, useEffect, useState } from 'react';
import type { PasskeyCredential } from '@nativeguard/passkey';
import { usePasskeyContext } from '../providers/PasskeyProvider';

export function usePasskeyCredentials(externalUserId: string, apiKey: string) {
  const { client } = usePasskeyContext();
  const [credentials, setCredentials] = useState<PasskeyCredential[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try { setCredentials(await client.listCredentials(externalUserId, apiKey)); }
    finally { setIsLoading(false); }
  }, [client, externalUserId, apiKey]);

  const revoke = useCallback(async (credentialId: string) => {
    await client.revokeCredential(externalUserId, credentialId, apiKey);
    setCredentials(prev => prev.filter(c => c.credentialId !== credentialId));
  }, [client, externalUserId, apiKey]);

  useEffect(() => { load(); }, [load]);

  return { credentials, isLoading, reload: load, revoke };
}
```

### `src/components/PasskeyButton.tsx`

```tsx
// packages/react/src/components/PasskeyButton.tsx
'use client';
import type { ComponentPropsWithoutRef } from 'react';
import type { AuthenticateOptions, AuthenticateResult } from '@nativeguard/passkey';
import { usePasskey } from '../hooks/usePasskey';
import { usePasskeyContext } from '../providers/PasskeyProvider';

interface PasskeyButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick'> {
  options?: AuthenticateOptions;
  onSuccess?: (result: AuthenticateResult) => void;
  onError?: (code: string) => void;
  /** Render prop para design systems customizados */
  renderButton?: (props: { onClick: () => void; isLoading: boolean; biometricType: string }) => React.ReactNode;
}

export function PasskeyButton({ options, onSuccess, onError, renderButton, children, ...props }: PasskeyButtonProps) {
  const { support, isLoading: supportLoading } = usePasskeyContext();
  const { authenticate, isLoading } = usePasskey();

  if (supportLoading || !support?.available) return null;

  const handleClick = async () => {
    const result = await authenticate(options);
    result.success ? onSuccess?.(result) : onError?.(result.error?.code ?? 'error');
  };

  if (renderButton) return renderButton({ onClick: handleClick, isLoading, biometricType: support.biometricType }) as React.ReactElement;

  const label = support.biometricType === 'face' ? 'Entrar com Face ID' : 'Entrar com Digital';

  return (
    <button type="button" onClick={handleClick} disabled={isLoading} aria-busy={isLoading} {...props}>
      {isLoading ? 'Aguardando biometria...' : (children ?? label)}
    </button>
  );
}
```

### `src/components/PasskeyRegisterButton.tsx`

```tsx
// packages/react/src/components/PasskeyRegisterButton.tsx
'use client';
import type { ComponentPropsWithoutRef } from 'react';
import type { RegisterPasskeyOptions, RegisterResult } from '@nativeguard/passkey';
import { usePasskey } from '../hooks/usePasskey';
import { usePasskeyContext } from '../providers/PasskeyProvider';

interface PasskeyRegisterButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick'> {
  registerOptions: RegisterPasskeyOptions;
  onSuccess?: (result: RegisterResult) => void;
  onError?: (code: string) => void;
}

export function PasskeyRegisterButton({ registerOptions, onSuccess, onError, children, disabled, ...props }: PasskeyRegisterButtonProps) {
  const { support } = usePasskeyContext();
  const { register, isLoading } = usePasskey();

  if (!support?.available) return null;

  const handleClick = async () => {
    const result = await register(registerOptions);
    result.success ? onSuccess?.(result) : onError?.(result.error?.code ?? 'error');
  };

  return (
    <button type="button" onClick={handleClick} disabled={isLoading || disabled} aria-busy={isLoading} {...props}>
      {isLoading ? 'Registrando...' : (children ?? 'Registrar biometria')}
    </button>
  );
}
```

### `src/components/PasskeyManager.tsx`

```tsx
// packages/react/src/components/PasskeyManager.tsx
'use client';
import type { PasskeyCredential } from '@nativeguard/passkey';
import { usePasskeyCredentials } from '../hooks/usePasskeyCredentials';

interface PasskeyManagerProps {
  externalUserId: string;
  apiKey: string;
  onRevoke?: (credentialId: string) => void;
  renderCredential?: (cred: PasskeyCredential, onRevoke: () => void) => React.ReactNode;
}

export function PasskeyManager({ externalUserId, apiKey, onRevoke, renderCredential }: PasskeyManagerProps) {
  const { credentials, isLoading, revoke } = usePasskeyCredentials(externalUserId, apiKey);

  const handleRevoke = async (credentialId: string) => {
    await revoke(credentialId);
    onRevoke?.(credentialId);
  };

  if (isLoading) return <div role="status">Carregando credenciais...</div>;
  if (credentials.length === 0) return <div>Nenhum dispositivo biométrico registrado.</div>;

  return (
    <ul role="list" aria-label="Dispositivos biométricos">
      {credentials.map(cred => (
        <li key={cred.credentialId}>
          {renderCredential
            ? renderCredential(cred, () => handleRevoke(cred.credentialId))
            : (
              <div>
                <div>
                  <strong>{cred.deviceName}</strong>
                  <span> — {new Date(cred.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <button type="button" onClick={() => handleRevoke(cred.credentialId)}>Remover</button>
              </div>
            )
          }
        </li>
      ))}
    </ul>
  );
}
```

### `src/server/PasskeyVerifier.ts` — Next.js Server / Edge Runtime

```typescript
// packages/react/src/server/PasskeyVerifier.ts
// Compatível com Edge Runtime (Vercel, Cloudflare Workers) — usa apenas `jose`

import { createRemoteJWKSet, jwtVerify } from 'jose';

interface AssertionClaims {
  sub: string;
  npk_cred_id: string;
  npk_project: string;
  npk_auth_method: 'webauthn';
  npk_user_verified: boolean;
  npk_aaguid: string;
}

export interface PasskeyVerifyResult {
  valid: boolean;
  externalUserId?: string;
  claims?: AssertionClaims;
  error?: string;
}

export class PasskeyVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(config: { projectId: string; apiBaseUrl?: string; audience: string }) {
    const base = config.apiBaseUrl ?? 'https://passkey.nativeguard.io';
    this.jwks = createRemoteJWKSet(
      new URL(`${base}/v1/projects/${config.projectId}/.well-known/jwks.json`),
      { cooldownDuration: 300_000 }  // cache JWKS por 5 minutos
    );
    this.issuer = `${base}/projects/${config.projectId}`;
    this.audience = config.audience;
  }

  async verify(assertionJwt: string): Promise<PasskeyVerifyResult> {
    try {
      const { payload } = await jwtVerify<AssertionClaims>(assertionJwt, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['ES256'],
        requiredClaims: ['sub', 'npk_cred_id', 'npk_project', 'npk_user_verified']
      });
      if (!payload.npk_user_verified) return { valid: false, error: 'user_not_verified' };
      return { valid: true, externalUserId: payload.sub, claims: payload };
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : 'jwt_verification_failed' };
    }
  }
}
```

### `src/server/index.ts`

```typescript
// packages/react/src/server/index.ts
export { PasskeyVerifier } from './PasskeyVerifier';
export type { PasskeyVerifyResult } from './PasskeyVerifier';
```

### `src/index.ts`

```typescript
// packages/react/src/index.ts
export { PasskeyProvider } from './providers/PasskeyProvider';
export { usePasskey } from './hooks/usePasskey';
export { usePasskeySupport } from './hooks/usePasskeySupport';
export { usePasskeyCredentials } from './hooks/usePasskeyCredentials';
export { PasskeyButton } from './components/PasskeyButton';
export { PasskeyRegisterButton } from './components/PasskeyRegisterButton';
export { PasskeyManager } from './components/PasskeyManager';

// Re-export do core — consumer instala apenas @nativeguard/passkey-react
export { NativePasskeyClient, PasskeyError } from '@nativeguard/passkey';
export type {
  NativePasskeyConfig, RegisterPasskeyOptions, AuthenticateOptions,
  RegisterResult, AuthenticateResult, PasskeyCredential, PasskeySupport, PasskeyErrorCode
} from '@nativeguard/passkey';
```

---

## 6. `apps/demo-nextjs` — Demonstração Next.js 15

### `apps/demo-nextjs/package.json`

```json
{
  "name": "demo-nextjs",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@nativeguard/passkey-react": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "typescript": "~5.6.0"
  }
}
```

### `apps/demo-nextjs/app/layout.tsx`

```tsx
// apps/demo-nextjs/app/layout.tsx
import { PasskeyProvider } from '@nativeguard/passkey-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
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

### `apps/demo-nextjs/app/api/auth/passkey/route.ts`

```typescript
// apps/demo-nextjs/app/api/auth/passkey/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PasskeyVerifier } from '@nativeguard/passkey-react/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

const verifier = new PasskeyVerifier({
  projectId: process.env.NPK_PROJECT_ID!,
  apiBaseUrl: process.env.NPK_API_URL,
  audience: process.env.NEXT_PUBLIC_APP_URL!
});

export async function POST(request: NextRequest) {
  const { assertionJwt } = await request.json() as { assertionJwt?: string };
  if (!assertionJwt) return NextResponse.json({ error: 'missing_assertion_jwt' }, { status: 400 });

  const result = await verifier.verify(assertionJwt);
  if (!result.valid || !result.externalUserId) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  // Criar session token local (adaptar ao seu sistema de auth)
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
  const sessionToken = await new SignJWT({ sub: result.externalUserId })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);

  const store = await cookies();
  store.set('session', sessionToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 604_800 });

  return NextResponse.json({ success: true, userId: result.externalUserId });
}
```

---

## 7. CI/CD — GitHub Actions

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      # Turbo respeita a ordem: core → angular + react → demo-nextjs
      - run: pnpm build

      - run: pnpm test

      - run: pnpm lint
```

### `.github/workflows/publish.yml`

```yaml
name: Publish

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          registry-url: https://registry.npmjs.org

      - run: pnpm install --frozen-lockfile

      - name: Build all publishable packages
        run: pnpm turbo run build --filter=!./apps/*

      - name: Publish via changesets
        run: pnpm changeset publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 8. Comandos de Setup Inicial

```bash
# 1. Clonar o novo repo (já criado no GitHub como native-passkey-sdk)
git clone https://github.com/swepay/native-passkey-sdk.git
cd native-passkey-sdk

# 2. Criar estrutura de diretórios
mkdir -p packages/core/src/utils
mkdir -p packages/angular/projects/passkey-angular/src/lib/{services,components/passkey-button,components/passkey-manager,guards}
mkdir -p packages/angular/src/app
mkdir -p packages/angular/flutter/lib
mkdir -p packages/react/src/{components,hooks,providers,server}
mkdir -p apps/demo-nextjs/app/api/auth/passkey
mkdir -p .changeset
mkdir -p .github/workflows

# 3. Instalar dependências (pnpm resolve workspace:* automaticamente)
pnpm install

# 4. Build na ordem correta (turbo gerencia)
pnpm build

# 5. Verificar que os 3 pacotes buildaram
ls packages/core/dist/
ls packages/angular/dist/passkey-angular/
ls packages/react/dist/

# 6. Criar primeiro changeset
pnpm changeset
# → Selecionar os 3 pacotes, bump: minor, descrição: "Initial release"

# 7. Aplicar versão
pnpm changeset version

# 8. Publicar (requer NPM_TOKEN no GitHub Secrets)
pnpm publish
```

---

## 9. Regras Críticas de Implementação

1. **`workspace:*`** — referenciar pacotes locais sempre com `workspace:*`, nunca com `file:` ou caminhos absolutos. pnpm resolve em tempo de install.

2. **Build order** — `turbo` garante `core` builda antes de `angular` e `react` via `"dependsOn": ["^build"]`. Nunca rodar `ng build` ou `tsup` manualmente nos pacotes dependentes.

3. **Angular workspace isolado** — `packages/angular/` tem seu próprio `angular.json` e `tsconfig.json`. O `ng-packagr` não usa `tsup`. Os dois toolchains convivem no monorepo sem conflito.

4. **`'use client'` no bundle React** — o `tsup.config.ts` injeta `'use client';` como banner do bundle client. O bundle `server/` não tem esse banner. Nunca misturar os dois entry points.

5. **`jose` no server bundle** — `jose` é a única dependência com suporte nativo a Edge Runtime. Não usar `jsonwebtoken` — quebra na Vercel Edge e Cloudflare Workers.

6. **`fixed` no changeset** — os 3 pacotes versiona juntos. Nunca publicar `@nativeguard/passkey@1.1.0` com `@nativeguard/passkey-react@1.0.0`. O config `fixed` previne isso.

7. **Re-exports no barrel** — `@nativeguard/passkey-angular` e `@nativeguard/passkey-react` reexportam todos os tipos do core no `public-api.ts` / `src/index.ts`. Consumers não precisam instalar `@nativeguard/passkey` separadamente.

8. **`authenticatorAttachment: 'platform'`** — NUNCA omitir. Sem isso, o browser pode acionar chaves de segurança USB em vez de Face ID / fingerprint.

9. **`userVerification: 'required'`** — NUNCA usar `'preferred'`. Em dispositivos Android, `'preferred'` pode cair para PIN do dispositivo, não acionando o autenticador biométrico.

10. **pnpm `strict-peer-dependencies=false`** — necessário no `.npmrc` porque `ng-packagr` tem peer deps transitivos que entram em conflito com as versões exatas do Angular 21. Sem isso, `pnpm install` falha.

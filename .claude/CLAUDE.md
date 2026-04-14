# native-passkey-sdk — Contexto do Projeto

## Visão Geral

Monorepo do **NativePasskey SDK** — biblioteca de autenticação WebAuthn/FIDO2 (Passkey)
do ecossistema **Swepay / NativeGuard**, publicada sob o escopo `@nativeguard`.

O SDK expõe três pacotes publicáveis que compartilham a mesma lógica WebAuthn via
camada de core, sem duplicação de código entre frameworks.

## Estrutura do Repositório

```
native-passkey-sdk/
├── packages/
│   ├── core/      → @nativeguard/passkey          (zero deps, TypeScript puro)
│   ├── angular/   → @nativeguard/passkey-angular   (Angular 21, ng-packagr)
│   └── react/     → @nativeguard/passkey-react     (React 19 + Next.js 15, tsup)
├── apps/
│   └── demo-nextjs/                                (Next.js 15, não publicado)
└── docs/
    └── NATIVEPASSKEY_SDK.md                        ← especificação completa do projeto
```

## Especificação Técnica

A especificação completa e autoritativa está em **`docs/NATIVEPASSKEY_SDK.md`**.
Este arquivo define todas as interfaces, implementações, toolchain e decisões de
arquitetura. Consulte-o antes de qualquer modificação estrutural.

## Toolchain

| Ferramenta       | Versão mínima | Função                                  |
|-----------------|---------------|-----------------------------------------|
| Node.js          | 20 LTS        | Runtime — `fetch` e `crypto` nativos    |
| pnpm             | 9.x           | Package manager + workspaces            |
| Turborepo        | 2.x           | Orquestração de build entre pacotes     |
| tsup             | 8.x           | Build ESM + CJS + `.d.ts` (core/react)  |
| ng-packagr       | 21.x          | Build da biblioteca Angular             |
| TypeScript       | 5.5+          | Tipagem estática em todos os pacotes    |
| Vitest           | 2.x           | Testes unitários (core + react)         |
| Changesets       | 2.x           | Versionamento coordenado dos 3 pacotes  |

## Hierarquia de Dependências (Build Order)

```
packages/core
   ├── packages/angular   (workspace:*)
   └── packages/react     (workspace:*)
          └── apps/demo-nextjs
```

Turborepo gerencia a ordem via `dependsOn: ["^build"]` no `turbo.json`.

## Pacotes Publicados

### `@nativeguard/passkey` (core)

- **Zero dependências** em runtime
- `NativePasskeyClient` — cliente principal WebAuthn/FIDO2
- `PasskeySupport` — detecção de biometria (FaceID, Touch ID, Windows Hello)
- Utilities: `bufferToBase64Url`, `base64UrlToBuffer`
- Tipos: `RegisterResult`, `AuthenticateResult`, `PasskeyCredential`, `PasskeyError`
- Entry points: `dist/index.js` (ESM) + `dist/index.cjs` (CJS)

### `@nativeguard/passkey-angular` (Angular 21)

- Reexporta todos os tipos do core — consumidores instalam apenas este pacote
- `NativePasskeyService` — wraps `NativePasskeyClient` com RxJS e Signals
- `FlutterBridgeService` — bridge bidirecional para `flutter_inappwebview`
- `PasskeyButtonComponent` — componente standalone com biometric icon
- `PasskeyManagerComponent` — listagem e revogação de credenciais
- `NativePasskeyModule.forRoot(config)` — módulo de configuração
- Build via `ng-packagr` em `packages/angular/`

### `@nativeguard/passkey-react` (React 19 / Next.js 15)

- Reexporta todos os tipos do core — consumidores instalam apenas este pacote
- `PasskeyProvider` — Context Provider com estado global
- `usePasskey` — hook principal (register + authenticate)
- `usePasskeySupport` — detecção SSR-safe de biometria
- `usePasskeyCredentials` — listagem e revogação
- `PasskeyButton`, `PasskeyRegisterButton`, `PasskeyManager` — componentes Client
- `PasskeyVerifier` — **server-only**, verifica JWT assertion via `jose` (Edge Runtime)
- Bundle separado: `dist/client` (banner `'use client'`) + `dist/server`

## Backend

O backend `.NET 10 Native AOT` reside no repositório separado **`native-passkey-backend`**.
Documentação em `native-passkey-backend/docs/NATIVEPASSKEY_BACKEND.md`.

A integração com NativeGuard está documentada em
`native-passkey-backend/NATIVEPASSKEY_NATIVEGUARD_INTEGRATION.md`.

## Convenções de Código

### TypeScript

- `strict: true` em todos os `tsconfig.json`
- Sem `any` implícito — use `unknown` e narrowing
- Exportações públicas sempre tipadas explicitamente
- Sem barrel files circulares — `index.ts` apenas re-exporta

### Commits

Seguir **Conventional Commits**:

```
feat(core): add credential listing endpoint
fix(angular): correct base64url padding
docs(react): update PasskeyVerifier usage example
chore(deps): bump @nativeguard/passkey to 1.2.0
```

### Versionamento

Usar **Changesets** para qualquer mudança publicável:

```bash
pnpm changeset        # descreve a mudança
pnpm changeset version # bump coordenado (os 3 pacotes têm versão fixa/sincronizada)
pnpm changeset publish # publica no npm
```

Os 3 pacotes são versionados em conjunto via `"fixed"` no `.changeset/config.json`.

## Comandos Principais

```bash
# Instalar dependências
pnpm install

# Build de todos os pacotes (respeita ordem de dependência)
pnpm build

# Testes
pnpm test

# Build de um pacote específico
pnpm --filter @nativeguard/passkey build
pnpm --filter @nativeguard/passkey-angular build
pnpm --filter @nativeguard/passkey-react build

# Dev mode (watch)
pnpm --filter @nativeguard/passkey dev
pnpm --filter @nativeguard/passkey-react dev

# Rodar demo Next.js
pnpm --filter demo-nextjs dev

# Lint + type check
pnpm lint
pnpm typecheck

# Changeset
pnpm changeset
pnpm changeset version
pnpm changeset publish
```

## Variáveis de Ambiente

```env
# Necessário para apps/demo-nextjs e testes de integração
NATIVEPASSKEY_API_URL=https://api.nativepasskey.com
NATIVEPASSKEY_PROJECT_ID=<project-id>
NATIVEPASSKEY_SIGNING_SECRET=<signing-secret>
```

Nunca comitar `.env` — usar `.env.local` localmente.

## CI/CD

### Workflows GitHub Actions

| Arquivo | Trigger | Responsabilidade |
|---------|---------|-----------------|
| `.github/workflows/ci.yml` | PR → `main` e push → `main` | Build, typecheck, testes, lint, validação de changeset |
| `.github/workflows/release.yml` | Push → `main` | Abre PR "Version Packages" (changesets) ou publica no npm |
| `.github/workflows/docs.yml` | Push → `main` (paths: docs/ ou packages/) | Build VitePress + deploy GitHub Pages |

### Secrets necessários no GitHub

| Secret | Onde configurar | Para que serve |
|--------|----------------|----------------|
| `NPM_TOKEN` | Settings → Secrets → Actions | Publicar no npm com permissão de escrita no escopo `@nativeguard` |
| `GITHUB_TOKEN` | Gerado automaticamente | Criar PRs e releases — já disponível |

### Fluxo de publicação (release.yml + Changesets)

1. Desenvolvedor cria changeset: `pnpm changeset` → comita `.changeset/*.md`
2. PR é mergeado em `main` → `release.yml` roda
3. Changesets Action detecta changesets pendentes → abre PR "Version Packages"
4. PR "Version Packages" é mergeado → `release.yml` roda novamente
5. Changesets Action executa `pnpm changeset publish --provenance`
6. Os 3 pacotes são publicados no npm com a mesma versão (config `fixed`)
7. Tags git criadas: `@nativeguard/passkey@x.y.z`, etc.
8. GitHub Releases criadas automaticamente

### Documentação — GitHub Pages

URL pública: `https://swepay.github.io/native-passkey-sdk/`

O site VitePress em `apps/docs/` é gerenciado pelo **agente Documentador**.
O conteúdo das páginas deve ser criado/atualizado por ele — não edite manualmente.

Para habilitar GitHub Pages no repositório:
- Settings → Pages → Source: **GitHub Actions**

## Agentes Disponíveis

| Agente        | Arquivo                       | Responsabilidade                              |
|---------------|-------------------------------|-----------------------------------------------|
| Arquiteto     | `.claude/agents/architect.md` | Decisões estruturais e revisão de design      |
| Product Owner | `.claude/agents/po.md`        | Requisitos, priorização e aceitação           |
| Desenvolvedor | `.claude/agents/developer.md` | Implementação e scaffolding de código         |
| QA            | `.claude/agents/qa.md`        | Testes, cobertura e validação de contrato     |
| Documentador  | `.claude/agents/docs.md`      | Documentação GitHub Pages (VitePress) ponta a ponta |

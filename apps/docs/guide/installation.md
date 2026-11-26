# Instalação

## Requisitos

- **Node.js 20+** para projetos web.
- Um **`projectId`** do NativePasskey (formato `proj_...`).
- A origem da sua aplicação cadastrada na allowlist do projeto no backend
  NativePasskey. Sem isso, o finish falha com
  [`origin_not_allowed`](/reference/errors#origin-not-allowed).
- Um contexto seguro: WebAuthn só funciona em **HTTPS** (ou `http://localhost`).

## React / Next.js

```bash
pnpm add @swepay/native-passly-react
# ou
npm install @swepay/native-passly-react
# ou
yarn add @swepay/native-passly-react
```

Peer dependencies: `react` e `react-dom` `^18.0.0 || ^19.0.0`.

O pacote traz `@swepay/native-passly-sdk` e `jose` como dependências diretas.
Você não precisa instalá-los.

## Angular

```bash
pnpm add @swepay/native-passly-angular @swepay/native-passly-sdk
# ou
npm install @swepay/native-passly-angular @swepay/native-passly-sdk
```

Peer dependencies declaradas pelo pacote:

| Pacote | Versão |
|--------|--------|
| `@angular/common` | `^21.2.25` |
| `@angular/core` | `^21.2.25` |
| `@angular/router` | `^21.2.25` |
| `@swepay/native-passly-sdk` | `^1.0.2` |
| `rxjs` | `~7.8.0` |

::: tip
Os gerenciadores npm 7+ e pnpm instalam peer dependencies automaticamente. O
comando acima as lista explicitamente para funcionar também com yarn.
:::

## Core (sem framework)

```bash
pnpm add @swepay/native-passly-sdk
```

O core não tem dependências em runtime e é distribuído em ESM e CJS.

## Flutter

```yaml
# pubspec.yaml
dependencies:
  native_passkey_flutter: ^0.1.2
```

```bash
flutter pub get
```

Requisitos: Dart `>=3.3.0 <4.0.0` e Flutter `>=3.19.0`. A configuração de
Android e iOS (Digital Asset Links e Associated Domains) está em
[Flutter — Setup Android/iOS](/flutter/setup).

## Host da API

Todos os pacotes usam por padrão `https://api-passkey.swepay.com.br`. Só informe
`apiBaseUrl` se a Swepay indicar outro ambiente para o seu projeto.

## Próximo passo

[Quick start](/guide/quick-start)

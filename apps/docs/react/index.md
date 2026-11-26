# @swepay/native-passly-react

Provider, hooks, componentes e verificação no servidor (Next.js App Router /
Edge Runtime) sobre o cliente `@swepay/native-passly-sdk`.

- npm: [`@swepay/native-passly-react`](https://www.npmjs.com/package/@swepay/native-passly-react)
- Código-fonte: [`packages/react`](https://github.com/swepay/native-passkey-sdk/tree/main/packages/react)

## Instalação

```bash
pnpm add @swepay/native-passly-react
```

Instale apenas este pacote — o `@swepay/native-passly-sdk` é reexportado
automaticamente (`NativePasskeyClient`, `PasskeyError` e os tipos públicos).

## Dois entry points

| Import | Ambiente | Conteúdo |
|--------|----------|----------|
| `@swepay/native-passly-react` | Client Components (bundle com banner `'use client'`) | Provider, hooks, componentes, reexports do core |
| `@swepay/native-passly-react/server` | Route Handlers, Server Actions, Edge Runtime | `PasskeyVerifier`, `PasskeyVerifyResult` |

## API pública

| Export | Documentação |
|--------|--------------|
| `PasskeyProvider` | [Setup](/react/setup) |
| `usePasskey` | [Hooks](/react/hooks#usepasskey) |
| `usePasskeySupport` | [Hooks](/react/hooks#usepasskeysupport) |
| `usePasskeyCredentials` | [Hooks](/react/hooks#usepasskeycredentials) |
| `PasskeyButton` | [Componentes](/react/components#passkeybutton) |
| `PasskeyRegisterButton` | [Componentes](/react/components#passkeyregisterbutton) |
| `PasskeyManager` | [Componentes](/react/components#passkeymanager) |
| `PasskeyVerifier` (`/server`) | [Servidor](/react/server) |
| `NativePasskeyClient`, `PasskeyError` e tipos | [Core](/core/client) |

## Exemplo mínimo

```tsx
'use client';
import { PasskeyProvider, usePasskey } from '@swepay/native-passly-react';

function LoginButton() {
  const { authenticate, isLoading } = usePasskey();
  return (
    <button type="button" disabled={isLoading} onClick={() => authenticate()}>
      Entrar com Passkey
    </button>
  );
}

export function App() {
  return (
    <PasskeyProvider config={{ projectId: 'proj_xxx' }}>
      <LoginButton />
    </PasskeyProvider>
  );
}
```

Tutorial completo: [Next.js App Router](/examples/nextjs-app-router).

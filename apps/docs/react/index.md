# @nativeguard/passkey-react

Componentes, hooks e integração com o Next.js App Router sobre o cliente
`@nativeguard/passkey`.

- npm: [`@nativeguard/passkey-react`](https://www.npmjs.com/package/@nativeguard/passkey-react)
- Código-fonte: [`packages/react`](https://github.com/swepay/native-passkey-sdk/tree/main/packages/react)

## Instalação

```bash
pnpm add @nativeguard/passkey-react
```

Instale apenas este pacote — o `@nativeguard/passkey` é reexportado
automaticamente (`NativePasskeyClient`, `PasskeyError` e os tipos públicos).

## API pública

Exportado por `src/index.ts`:

- `PasskeyProvider` — provider de contexto que instancia o `NativePasskeyClient`.
- `usePasskey` — hook com `authenticate`, `register`, `registerWithRecoveryAssertion`,
  `isLoading`, `error` e `clearError`.
- `usePasskeySupport` — detecção de suporte à plataforma.
- `usePasskeyCredentials` — listagem/gestão de credenciais registradas.
- `PasskeyButton`, `PasskeyRegisterButton`, `PasskeyManager` — componentes prontos.

Exportado por `src/server/index.ts` (uso em Route Handlers / Server Actions):

- `PasskeyVerifier` e o tipo `PasskeyVerifyResult`.

## Exemplo mínimo

```tsx
import { PasskeyProvider, usePasskey } from '@nativeguard/passkey-react';

function LoginButton() {
  const { authenticate, isLoading, error } = usePasskey();
  return (
    <button disabled={isLoading} onClick={() => authenticate()}>
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

# PasskeyProvider

O `PasskeyProvider` cria um `NativePasskeyClient` e o disponibiliza para os
hooks e componentes do pacote. Ele também detecta, uma única vez, se o
dispositivo suporta passkeys.

```tsx
import { PasskeyProvider } from '@swepay/native-passly-react';
```

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `config` | [`NativePasskeyConfig`](/core/types#nativepasskeyconfig) | ✅ | `projectId` e, opcionalmente, `apiBaseUrl` |
| `children` | `ReactNode` | ✅ | Sua aplicação |

## Comportamento

- O cliente é recriado apenas quando `config.projectId` ou `config.apiBaseUrl`
  mudam.
- Na montagem, o provider chama `NativePasskeyClient.isAvailable()` e guarda o
  resultado. `PasskeyButton` e `PasskeyRegisterButton` leem esse valor e não
  renderizam nada se o dispositivo não suportar passkeys.
- `usePasskey`, `usePasskeyCredentials`, `PasskeyButton`,
  `PasskeyRegisterButton` e `PasskeyManager` **precisam** estar dentro do
  provider. Fora dele, lançam
  `Error('usePasskeyContext must be inside <PasskeyProvider>')`.
- `usePasskeySupport` funciona com ou sem provider.

## Next.js App Router

O provider é um Client Component (o bundle do pacote tem o banner
`'use client'`). Você pode usá-lo direto no `layout.tsx`, que é um Server
Component:

```tsx
// app/layout.tsx
import type { ReactNode } from 'react';
import { PasskeyProvider } from '@swepay/native-passly-react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <PasskeyProvider
          config={{
            projectId: process.env.NEXT_PUBLIC_NPK_PROJECT_ID!,
            apiBaseUrl: 'https://api-passkey.swepay.com.br',
          }}
        >
          {children}
        </PasskeyProvider>
      </body>
    </html>
  );
}
```

::: tip
Variáveis usadas no navegador precisam do prefixo `NEXT_PUBLIC_`. O `projectId`
não é segredo; a API key do projeto, sim — nunca a coloque em variável
`NEXT_PUBLIC_` em produção.
:::

## Vite / Create React App

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PasskeyProvider } from '@swepay/native-passly-react';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PasskeyProvider config={{ projectId: 'proj_xxx' }}>
      <App />
    </PasskeyProvider>
  </StrictMode>,
);
```

## Próximos passos

- [Hooks](/react/hooks)
- [Componentes](/react/components)

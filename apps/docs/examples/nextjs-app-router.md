# Next.js App Router — Tutorial Completo

## O que você vai construir

Uma aplicação Next.js 15 (App Router) em que o usuário:

1. registra uma passkey (Face ID, Touch ID, digital ou Windows Hello);
2. entra com a passkey, sem senha;
3. recebe um cookie de sessão **HttpOnly**, criado no servidor só depois que o
   JWT da passkey é validado com o `PasskeyVerifier`.

Quem não tem suporte a passkey vê o formulário de senha.

```
/login  ──▶ usePasskey().authenticate() ──▶ assertionJwt
        ──▶ POST /api/auth/passkey ──▶ PasskeyVerifier.verify() ──▶ cookie "session"
/conta  ──▶ lê o cookie no Server Component ──▶ "Olá, user-123"
```

## Pré-requisitos

- Node.js 20+
- Uma aplicação Next.js 15 com App Router (`npx create-next-app@latest`)
- Um `projectId` do NativePasskey e o valor de `aud` do JWT do projeto
- A origem da aplicação (ex.: `http://localhost:3000`) cadastrada no projeto
- Backend NativePasskey: `https://api-passkey.swepay.com.br`

## Passo 1: Instalação

```bash
pnpm add @swepay/native-passly-react jose
```

O `jose` é usado no **seu** código para assinar o cookie de sessão. (O pacote
React já o usa internamente no `PasskeyVerifier`.)

Crie o `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_NPK_PROJECT_ID=proj_xxx
NPK_PROJECT_ID=proj_xxx
NPK_JWT_AUDIENCE=valor-do-aud-do-seu-projeto
SESSION_SECRET=troque-por-um-segredo-com-pelo-menos-32-caracteres
```

## Passo 2: `PasskeyProvider` no `layout.tsx`

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

O `PasskeyProvider` é um Client Component e pode ficar direto no layout (Server
Component). Veja [PasskeyProvider](/react/setup).

## Passo 3: Primeiro registro

O registro exige um usuário já identificado. Neste tutorial, o componente
recebe o ID e o nome por props — na sua aplicação, eles vêm do usuário logado.

```tsx
// app/components/register-passkey.tsx
'use client';
import { useState } from 'react';
import { usePasskey } from '@swepay/native-passly-react';

interface Props {
  userId: string;
  userName: string;
}

export function RegisterPasskey({ userId, userName }: Props) {
  const { register, isLoading, error } = usePasskey();
  const [done, setDone] = useState(false);

  async function handleClick() {
    const result = await register({
      externalUserId: userId,
      userDisplayName: userName,
      deviceName: 'Navegador de ' + userName,
    });
    setDone(result.success);
  }

  if (done) return <p>Passkey ativada. No próximo login, use a biometria.</p>;

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Aguardando biometria...' : 'Ativar login por biometria'}
      </button>
      {error && error.code !== 'user_cancelled' && (
        <p role="alert">Não foi possível ativar ({error.code}).</p>
      )}
    </div>
  );
}
```

```tsx
// app/setup/page.tsx
import { RegisterPasskey } from '../components/register-passkey';

export default function SetupPage() {
  // Substitua pelo usuário da sua sessão atual.
  return (
    <main>
      <h1>Segurança da conta</h1>
      <RegisterPasskey userId="user-123" userName="João Silva" />
    </main>
  );
}
```

## Passo 4: Autenticação

O botão chama `authenticate()` sem `externalUserId` — fluxo *discoverable*: o
sistema mostra as passkeys do dispositivo e o usuário escolhe. Em seguida,
envia o `assertionJwt` ao Route Handler.

```tsx
// app/components/passkey-login.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePasskey } from '@swepay/native-passly-react';

export function PasskeyLogin() {
  const router = useRouter();
  const { authenticate, isLoading, error } = usePasskey();
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleLogin() {
    setServerError(null);
    const result = await authenticate();
    if (!result.success) return; // `error` do hook já foi preenchido

    const response = await fetch('/api/auth/passkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assertionJwt: result.assertionJwt }),
    });

    if (response.ok) {
      router.push('/conta');
    } else {
      const body = (await response.json()) as { error?: string };
      setServerError(body.error ?? 'Falha ao validar o login.');
    }
  }

  return (
    <div>
      <button type="button" onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Aguardando biometria...' : 'Entrar com passkey'}
      </button>
      {error && error.code !== 'user_cancelled' && (
        <p role="alert">Erro na passkey: {error.code}</p>
      )}
      {serverError && <p role="alert">{serverError}</p>}
    </div>
  );
}
```

### Renderização condicional com `usePasskeySupport`

```tsx
// app/login/page.tsx
'use client';
import { usePasskeySupport } from '@swepay/native-passly-react';
import { PasskeyLogin } from '../components/passkey-login';

export default function LoginPage() {
  const { support, isLoading } = usePasskeySupport();

  return (
    <main>
      <h1>Entrar</h1>
      {isLoading && <p>Verificando suporte a biometria...</p>}
      {!isLoading && support?.available && <PasskeyLogin />}
      {!isLoading && !support?.available && (
        <form action="/api/auth/password" method="post">
          <input name="email" type="email" placeholder="E-mail" required />
          <input name="password" type="password" placeholder="Senha" required />
          <button type="submit">Entrar com senha</button>
        </form>
      )}
    </main>
  );
}
```

O formulário de senha é ilustrativo — `/api/auth/password` é o seu fluxo atual.

## Passo 5: Route Handler com `PasskeyVerifier`

O Route Handler valida o JWT e cria a sessão. O verifier é criado uma vez, fora
do handler, para reaproveitar o cache do JWKS.

```typescript
// app/api/auth/passkey/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { PasskeyVerifier } from '@swepay/native-passly-react/server';

const verifier = new PasskeyVerifier({
  projectId: process.env.NPK_PROJECT_ID!,
  audience: process.env.NPK_JWT_AUDIENCE!,
});

const sessionSecret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function POST(request: NextRequest) {
  const { assertionJwt } = (await request.json()) as { assertionJwt?: string };
  if (!assertionJwt) {
    return NextResponse.json({ error: 'missing_assertion_jwt' }, { status: 400 });
  }

  const result = await verifier.verify(assertionJwt);
  if (!result.valid || !result.externalUserId) {
    return NextResponse.json({ error: result.error ?? 'invalid_assertion' }, { status: 401 });
  }

  const sessionToken = await new SignJWT({ sub: result.externalUserId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(sessionSecret);

  const store = await cookies();
  store.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ userId: result.externalUserId });
}
```

## Passo 6: Lendo a sessão em um Server Component

```tsx
// app/conta/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';

const sessionSecret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export default async function AccountPage() {
  const token = (await cookies()).get('session')?.value;
  if (!token) redirect('/login');

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, sessionSecret);
    userId = String(payload.sub);
  } catch {
    redirect('/login');
  }

  return (
    <main>
      <h1>Olá, {userId}</h1>
      <a href="/setup">Gerenciar passkey</a>
    </main>
  );
}
```

## Passo 7: Tratamento de erros

| Onde | Código | O que fazer |
|------|--------|-------------|
| `usePasskey().error` | `user_cancelled` | Nada — o usuário desistiu |
| `usePasskey().error` | `credential_already_registered` | Sugira entrar com a passkey |
| `usePasskey().error` | `credential_not_found_or_revoked` | Ofereça login por senha e novo registro |
| `usePasskey().error` | `origin_not_allowed` | Cadastre a origem no projeto |
| `usePasskey().error` | `unknown_error` | Falha de rede ou exceção do navegador; veja `error.message` |
| Route Handler (401) | mensagem do `jose` | JWT expirado, `aud`/`iss` incorretos ou assinatura inválida |

Veja a [referência de erros](/reference/errors) completa.

## Resultado final

```
app/
├── layout.tsx                     ← PasskeyProvider
├── login/page.tsx                 ← usePasskeySupport + PasskeyLogin
├── setup/page.tsx                 ← RegisterPasskey
├── conta/page.tsx                 ← lê o cookie de sessão
├── components/
│   ├── passkey-login.tsx          ← usePasskey().authenticate
│   └── register-passkey.tsx       ← usePasskey().register
└── api/auth/passkey/route.ts      ← PasskeyVerifier + cookie HttpOnly
```

O mesmo fluxo roda no app de demonstração do repositório:
[`apps/demo-nextjs`](https://github.com/swepay/native-passkey-sdk/tree/main/apps/demo-nextjs).

## Erros comuns

- **O botão não aparece.** `PasskeyButton` e `PasskeyRegisterButton` retornam
  `null` sem suporte a passkey. Teste em HTTPS ou `localhost`, em navegador com
  autenticador de plataforma.
- **`usePasskeyContext must be inside <PasskeyProvider>`.** O componente está
  fora do provider. Confira o `layout.tsx`.
- **`verify` sempre retorna `valid: false`.** Confira `NPK_JWT_AUDIENCE` — ele
  precisa ser idêntico à claim `aud` do JWT.
- **`origin_not_allowed`.** A origem (incluindo a porta, em desenvolvimento)
  não está cadastrada no projeto.
- **`PasskeyVerifier` importado no cliente.** Importe sempre de
  `@swepay/native-passly-react/server`, e só em código de servidor.

## Próximos passos

- [Componentes React prontos](/react/components)
- [Recuperação de conta com `registerWithRecoveryAssertion`](/core/client#registerwithrecoveryassertion-options)
- [Angular PWA + Flutter WebView](/examples/angular-pwa-flutter)

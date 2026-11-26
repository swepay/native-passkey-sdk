# PasskeyVerifier (servidor)

O `PasskeyVerifier` valida, no **seu** servidor, o `assertionJwt` que o
navegador recebeu ao autenticar. Só depois dessa validação você deve criar a
sessão do usuário.

```typescript
import { PasskeyVerifier, type PasskeyVerifyResult } from '@swepay/native-passly-react/server';
```

- Entry point separado: `@swepay/native-passly-react/server` (sem `'use client'`).
- Depende apenas de [`jose`](https://github.com/panva/jose) — funciona no
  Node.js e no Edge Runtime (Vercel, Cloudflare Workers).

## `new PasskeyVerifier(config)`

**Parâmetros**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `projectId` | `string` | ✅ | ID do projeto NativePasskey |
| `audience` | `string` | ✅ | Valor esperado na claim `aud` do JWT |
| `apiBaseUrl` | `string` | ❌ | Padrão: `https://api-passkey.swepay.com.br` |

A partir da configuração, o verifier usa:

| Item | Valor |
|------|-------|
| JWKS | `{apiBaseUrl}/v1/projects/{projectId}/.well-known/jwks.json` (cache de 5 minutos) |
| `iss` esperado | `{apiBaseUrl}/projects/{projectId}` |
| `aud` esperado | o `audience` informado |
| Algoritmo | `ES256` |

Crie o verifier **uma vez**, fora do handler, para reaproveitar o cache do JWKS.

## `verify(assertionJwt)`

Valida assinatura, emissor, audiência e claims obrigatórias
(`sub`, `npk_cred_id`, `npk_project`, `npk_user_verified`). Também exige
`npk_user_verified === true`.

**Retorno**

`Promise<PasskeyVerifyResult>` — **nunca rejeita**.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `valid` | `boolean` | `true` se o JWT é válido |
| `externalUserId` | `string \| undefined` | Claim `sub` — o ID do usuário no seu sistema |
| `claims` | objeto `\| undefined` | `sub`, `npk_cred_id`, `npk_project`, `npk_auth_method` (`'webauthn'`), `npk_user_verified`, `npk_aaguid` |
| `error` | `string \| undefined` | `'user_not_verified'` ou a mensagem de erro do `jose` (assinatura inválida, JWT expirado, `iss`/`aud` incorretos etc.) |

::: info
`error` aqui é uma string livre, não um [`PasskeyErrorCode`](/reference/errors).
:::

## Exemplo — Route Handler (Next.js App Router)

```typescript
// app/api/auth/passkey/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { PasskeyVerifier } from '@swepay/native-passly-react/server';

const verifier = new PasskeyVerifier({
  projectId: process.env.NPK_PROJECT_ID!,
  audience: process.env.NPK_JWT_AUDIENCE!,
});

export async function POST(request: NextRequest) {
  const { assertionJwt } = (await request.json()) as { assertionJwt?: string };
  if (!assertionJwt) {
    return NextResponse.json({ error: 'missing_assertion_jwt' }, { status: 400 });
  }

  const result = await verifier.verify(assertionJwt);
  if (!result.valid || !result.externalUserId) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  // Crie a sessão do seu sistema a partir de result.externalUserId.
  const store = await cookies();
  store.set('uid', result.externalUserId, { httpOnly: true, secure: true, sameSite: 'lax' });

  return NextResponse.json({ userId: result.externalUserId });
}
```

::: warning
O cookie acima é só ilustrativo. Em produção, grave um token de sessão assinado
— o [tutorial Next.js](/examples/nextjs-app-router#passo-5-route-handler-com-passkeyverifier)
mostra como fazer com `jose`.
:::

## Exemplo — Edge Runtime

```typescript
// app/api/auth/passkey/route.ts
import { PasskeyVerifier } from '@swepay/native-passly-react/server';

export const runtime = 'edge';

const verifier = new PasskeyVerifier({
  projectId: process.env.NPK_PROJECT_ID!,
  audience: process.env.NPK_JWT_AUDIENCE!,
});

export async function POST(request: Request) {
  const { assertionJwt } = (await request.json()) as { assertionJwt: string };
  const result = await verifier.verify(assertionJwt);
  return Response.json(result, { status: result.valid ? 200 : 401 });
}
```

## Qual valor usar em `audience`

`audience` precisa ser igual à claim `aud` que o backend NativePasskey grava no
JWT do seu projeto. Se o valor não bater, `verify` retorna `valid: false` com o
erro de audiência do `jose`. Confirme o valor configurado para o seu projeto
antes de ir para produção.

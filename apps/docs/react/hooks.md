# Hooks

Todos os hooks são Client-only (`'use client'`).

## `usePasskey`

Hook principal: registro, autenticação e recuperação, com estado de loading e
erro. Precisa estar dentro do [`PasskeyProvider`](/react/setup).

```tsx
import { usePasskey } from '@swepay/native-passly-react';
```

**Retorno**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `authenticate` | `(options?: AuthenticateOptions) => Promise<AuthenticateResult>` | Chama `authenticateWithPasskey` |
| `register` | `(options: RegisterPasskeyOptions) => Promise<RegisterResult>` | Chama `registerPasskey` |
| `registerWithRecoveryAssertion` | `(options: RegisterWithRecoveryAssertionOptions) => Promise<RegisterResult>` | Chama `registerWithRecoveryAssertion` |
| `isLoading` | `boolean` | `true` enquanto uma operação está em andamento |
| `error` | `PasskeyError \| null` | Último erro. Zerado no início de cada operação |
| `clearError` | `() => void` | Limpa `error` |

**Tratamento de erros**

As três funções **nunca rejeitam**. Diferente do core, toda exceção vira um
resultado `{ success: false, error }`:

- `PasskeyError` (ex.: código vindo do backend) é repassado como está.
- Qualquer outra exceção (falha de rede, `DOMException`) vira
  `PasskeyError('unknown_error', String(err))`.

O mesmo erro é gravado em `error`.

**Exemplo — autenticação**

```tsx
'use client';
import { usePasskey } from '@swepay/native-passly-react';

export function LoginButton() {
  const { authenticate, isLoading, error, clearError } = usePasskey();

  async function handleClick() {
    const result = await authenticate();
    if (result.success) {
      await fetch('/api/auth/passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assertionJwt: result.assertionJwt }),
      });
    }
  }

  return (
    <div>
      <button type="button" disabled={isLoading} onClick={handleClick}>
        {isLoading ? 'Aguardando biometria...' : 'Entrar com passkey'}
      </button>
      {error && error.code !== 'user_cancelled' && (
        <p role="alert">
          Não foi possível entrar ({error.code}).{' '}
          <button type="button" onClick={clearError}>Fechar</button>
        </p>
      )}
    </div>
  );
}
```

**Exemplo — registro**

```tsx
'use client';
import { usePasskey } from '@swepay/native-passly-react';

export function EnablePasskey({ userId, name }: { userId: string; name: string }) {
  const { register, isLoading, error } = usePasskey();

  async function handleClick() {
    const result = await register({
      externalUserId: userId,
      userDisplayName: name,
      deviceName: navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Este dispositivo',
    });
    if (result.success) {
      console.log('Passkey criada:', result.credentialId);
    }
  }

  return (
    <>
      <button type="button" disabled={isLoading} onClick={handleClick}>
        Ativar login por biometria
      </button>
      {error?.code === 'credential_already_registered' && (
        <p>Este dispositivo já tem uma passkey cadastrada.</p>
      )}
    </>
  );
}
```

## `usePasskeySupport`

Detecta se o dispositivo suporta passkeys. Não depende do provider.

```tsx
import { usePasskeySupport } from '@swepay/native-passly-react';
```

**Retorno**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `support` | [`PasskeySupport`](/core/types#passkeysupport) `\| null` | `null` até a detecção terminar |
| `isLoading` | `boolean` | `true` até a detecção terminar |

A detecção roda em `useEffect`, só no navegador. No SSR e na hidratação,
`support` é `null` — o HTML do servidor e o primeiro render do cliente batem.

::: info
O `PasskeyProvider` já faz a mesma detecção internamente. Cada chamada de
`usePasskeySupport` faz uma nova detecção.
:::

**Exemplo — renderização condicional**

```tsx
'use client';
import { usePasskeySupport } from '@swepay/native-passly-react';
import { LoginButton } from './login-button';
import { PasswordForm } from './password-form';

export function LoginOptions() {
  const { support, isLoading } = usePasskeySupport();

  if (isLoading) return <p>Verificando suporte a biometria...</p>;
  return support?.available ? <LoginButton /> : <PasswordForm />;
}
```

## `usePasskeyCredentials`

Lista e revoga as passkeys de um usuário. Precisa estar dentro do provider.

```tsx
import { usePasskeyCredentials } from '@swepay/native-passly-react';
```

**Parâmetros**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `externalUserId` | `string` | ✅ | ID do usuário |
| `apiKey` | `string` | ✅ | API key do projeto (header `X-NativePasskey-ApiKey`) |

**Retorno**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `credentials` | `PasskeyCredential[]` | Credenciais carregadas |
| `isLoading` | `boolean` | `true` durante o carregamento |
| `reload` | `() => Promise<void>` | Recarrega a lista |
| `revoke` | `(credentialId: string) => Promise<void>` | Revoga e remove da lista local |

A lista é carregada automaticamente na montagem e sempre que
`externalUserId` ou `apiKey` mudam.

::: danger A API key fica exposta no navegador
Este hook roda no cliente e envia a API key do projeto em cada requisição.
Qualquer usuário consegue lê-la nas ferramentas de desenvolvedor. Em produção,
prefira listar e revogar credenciais a partir do seu backend com
[`listCredentials` / `revokeCredential`](/core/client#listcredentials-externaluserid-apikey).
:::

::: warning Erros
`reload` e `revoke` rejeitam com `PasskeyError('unknown_error', 'HTTP <status>')`
quando a API falha. O carregamento automático na montagem não trata essa
rejeição — ela aparece como *unhandled promise rejection*.
:::

**Exemplo**

```tsx
'use client';
import { usePasskeyCredentials } from '@swepay/native-passly-react';

export function DeviceList({ userId, apiKey }: { userId: string; apiKey: string }) {
  const { credentials, isLoading, revoke } = usePasskeyCredentials(userId, apiKey);

  if (isLoading) return <p>Carregando...</p>;

  return (
    <ul>
      {credentials.map((cred) => (
        <li key={cred.credentialId}>
          {cred.deviceName}{' '}
          <button type="button" onClick={() => revoke(cred.credentialId)}>
            Remover
          </button>
        </li>
      ))}
    </ul>
  );
}
```

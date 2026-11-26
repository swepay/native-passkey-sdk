# NativePasskeyClient

Classe principal do core. Executa as cerimônias WebAuthn no navegador e conversa
com o backend NativePasskey.

```typescript
import { NativePasskeyClient } from '@swepay/native-passly-sdk';
```

## `new NativePasskeyClient(config)`

Cria um cliente para um projeto.

**Parâmetros**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `config.projectId` | `string` | ✅ | ID do projeto NativePasskey (ex.: `proj_abc123`) |
| `config.apiBaseUrl` | `string` | ❌ | URL base da API. Padrão: `https://api-passkey.swepay.com.br` |

Todas as chamadas vão para `{apiBaseUrl}/v1/projects/{projectId}/...`.

**Propriedades**

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `projectId` | `readonly string` | O `projectId` informado no construtor |

**Exemplo**

```typescript
import { NativePasskeyClient } from '@swepay/native-passly-sdk';

const client = new NativePasskeyClient({
  projectId: 'proj_abc123',
  apiBaseUrl: 'https://api-passkey.swepay.com.br',
});
```

## `NativePasskeyClient.isAvailable()`

Método **estático**. Detecta se o dispositivo atual tem um autenticador de
plataforma com verificação de usuário (biometria ou PIN).

É SSR-safe: fora do navegador (sem `window`) ou sem `PublicKeyCredential`,
resolve com `{ available: false, conditionalMediationAvailable: false, biometricType: 'none' }`.

**Retorno**

`Promise<PasskeySupport>` — veja [`PasskeySupport`](/core/types#passkeysupport).

O `biometricType` é inferido do user agent:

| User agent | `biometricType` |
|------------|-----------------|
| iPhone, iPad, iPod | `'face'` |
| Android | `'fingerprint'` |
| Outros (Windows Hello, macOS Touch ID) | `'platform'` |
| Sem autenticador de plataforma | `'none'` |

**Exemplo**

```typescript
import { NativePasskeyClient } from '@swepay/native-passly-sdk';

const support = await NativePasskeyClient.isAvailable();
if (!support.available) {
  // Esconda o botão de passkey e ofereça login por senha.
}
```

## `registerPasskey(options)`

Registra uma nova passkey para um usuário que você já identificou.

Fluxo: `POST /passkey/register/begin` → `navigator.credentials.create()` →
`POST /passkey/register/finish`.

A cerimônia sempre usa o autenticador **de plataforma** (biometria do próprio
dispositivo), com `userVerification: 'required'`, `residentKey: 'preferred'`,
`attestation: 'none'` e timeout de 60 segundos.

**Parâmetros**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `externalUserId` | `string` | ✅ | ID único do usuário no seu sistema |
| `userDisplayName` | `string` | ✅ | Nome exibido na UI biométrica |
| `deviceName` | `string` | ✅ | Rótulo do dispositivo (ex.: `iPhone 16 Pro`) |

**Retorno**

`Promise<RegisterResult>` — `success: true` com `credentialId`, `deviceName` e
`registeredAt` em caso de sucesso.

**Erros**

| Situação | Comportamento |
|----------|---------------|
| Usuário cancelou ou o prompt expirou (`NotAllowedError`) | **Resolve** com `{ success: false, error }`, `error.code === 'user_cancelled'` |
| Backend respondeu com erro HTTP (begin ou finish) | **Rejeita** com `PasskeyError` (código vindo do backend, ex.: `credential_already_registered`, `origin_not_allowed`) |
| Outra exceção do navegador (ex.: `InvalidStateError`) | **Rejeita** com a exceção original (`DOMException`) |
| Falha de rede no `fetch` | **Rejeita** com a exceção original do `fetch` (`TypeError`) |

**Exemplo**

```typescript
import { NativePasskeyClient, PasskeyError } from '@swepay/native-passly-sdk';

const client = new NativePasskeyClient({ projectId: 'proj_xxx' });

try {
  const result = await client.registerPasskey({
    externalUserId: 'user-123',
    userDisplayName: 'João Silva',
    deviceName: 'iPhone 16 Pro',
  });
  if (result.success) {
    console.log('Credencial criada:', result.credentialId);
  } else if (result.error?.code === 'user_cancelled') {
    // Usuário fechou o prompt biométrico — permita tentar de novo.
  }
} catch (error) {
  if (error instanceof PasskeyError) {
    console.error('Erro do backend:', error.code, error.message);
  } else {
    console.error('Erro inesperado:', error);
  }
}
```

## `registerWithRecoveryAssertion(options)`

Registra uma passkey nova quando o usuário **perdeu o único dispositivo** e não
tem outra forma de provar quem é.

Você informa uma asserção de recuperação emitida pelo Native Biometrics SDK
(`purpose: 'recovery'`). O SDK nunca decodifica nem armazena essa string — só a
repassa ao backend. O backend verifica a asserção, resolve o `externalUserId`
a partir dela e emite um *recovery grant* de uso único (válido por 5 minutos).

Fluxo: `POST /passkey/recovery/biometric/registration-options` →
`navigator.credentials.create()` → `POST /passkey/register/finish`.

**Parâmetros**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `assertion` | `string` | ✅ | JWS compacto opaco emitido pelo Native Biometrics SDK |
| `deviceName` | `string` | ✅ | Rótulo do novo dispositivo |

**Retorno**

`Promise<RegisterResult>` — mesmo formato de `registerPasskey`.

**Erros**

O comportamento de cancelamento e de exceções é igual ao de `registerPasskey`.
Além disso, o endpoint de recuperação responde em `application/problem+json`
(RFC 9457), e o SDK converte o `type` do problema nos códigos
`biometric_recovery_disabled`, `invalid_biometric_assertion`,
`expired_biometric_assertion`, `replayed_biometric_assertion`,
`biometric_purpose_mismatch`, `unknown_biometric_user` e
`invalid_recovery_grant`. Nesse caso, `error.message` traz o `detail` do problema.
Veja a [referência de erros](/reference/errors#recuperacao-biometrica).

**Exemplo**

```typescript
import { NativePasskeyClient, PasskeyError } from '@swepay/native-passly-sdk';

const client = new NativePasskeyClient({ projectId: 'proj_xxx' });

async function recover(assertion: string): Promise<void> {
  try {
    const result = await client.registerWithRecoveryAssertion({
      assertion,
      deviceName: 'iPhone 16 Pro recuperado',
    });
    if (result.success) {
      console.log('Novo dispositivo registrado:', result.credentialId);
    }
  } catch (error) {
    if (error instanceof PasskeyError && error.code === 'expired_biometric_assertion') {
      // Peça uma nova verificação biométrica ao usuário.
    }
  }
}
```

## `authenticateWithPasskey(options?)`

Autentica o usuário com uma passkey existente.

Fluxo: `POST /passkey/authenticate/begin` → `navigator.credentials.get()` →
`POST /passkey/authenticate/finish`.

**Parâmetros**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `externalUserId` | `string` | ❌ | Restringe às credenciais desse usuário. Omita para o fluxo *discoverable* (o usuário escolhe a passkey sem digitar nada) |

**Retorno**

`Promise<AuthenticateResult>` — em caso de sucesso, `assertionJwt` (JWT ES256
assinado com a chave do projeto) e `externalUserId`.

**Erros**

| Situação | Comportamento |
|----------|---------------|
| Usuário cancelou ou o prompt expirou (`NotAllowedError`) | **Resolve** com `{ success: false, error }`, `error.code === 'user_cancelled'` |
| Backend respondeu com erro HTTP | **Rejeita** com `PasskeyError` (ex.: `credential_not_found_or_revoked`, `challenge_expired`) |
| Outra exceção do navegador ou falha de rede | **Rejeita** com a exceção original |

**Exemplo**

```typescript
import { NativePasskeyClient, PasskeyError } from '@swepay/native-passly-sdk';

const client = new NativePasskeyClient({ projectId: 'proj_xxx' });

try {
  const result = await client.authenticateWithPasskey();
  if (result.success) {
    await fetch('/api/auth/passkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assertionJwt: result.assertionJwt }),
    });
  }
} catch (error) {
  if (error instanceof PasskeyError) {
    console.error(error.code);
  }
}
```

::: warning Valide o JWT no servidor
Nunca trate `success: true` no navegador como prova de login. Envie
`assertionJwt` ao seu backend e valide-o via JWKS — veja
[`PasskeyVerifier`](/react/server).
:::

## `listCredentials(externalUserId, apiKey)`

Lista as passkeys registradas de um usuário.

Chama `GET /passkey/users/{externalUserId}/credentials` com o header
`X-NativePasskey-ApiKey`.

**Parâmetros**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `externalUserId` | `string` | ✅ | ID do usuário no seu sistema |
| `apiKey` | `string` | ✅ | API key do projeto NativePasskey |

**Retorno**

`Promise<PasskeyCredential[]>`

**Erros**

Qualquer resposta HTTP não-2xx rejeita com `PasskeyError('unknown_error', 'HTTP <status>')`.

## `revokeCredential(externalUserId, credentialId, apiKey)`

Revoga uma passkey de um usuário.

Chama `DELETE /passkey/users/{externalUserId}/credentials/{credentialId}` com o
header `X-NativePasskey-ApiKey`.

**Parâmetros**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `externalUserId` | `string` | ✅ | ID do usuário |
| `credentialId` | `string` | ✅ | ID da credencial (de `PasskeyCredential.credentialId`) |
| `apiKey` | `string` | ✅ | API key do projeto NativePasskey |

**Retorno**

`Promise<void>`

**Erros**

Qualquer resposta HTTP não-2xx rejeita com `PasskeyError('unknown_error', 'HTTP <status>')`.

::: danger A API key é uma credencial
`listCredentials` e `revokeCredential` recebem a API key do projeto como
argumento. Se você chamá-los no navegador, a chave fica exposta a qualquer
usuário. Prefira chamá-los a partir do seu backend.
:::

**Exemplo (servidor Node.js 20+)**

```typescript
import { NativePasskeyClient } from '@swepay/native-passly-sdk';

const client = new NativePasskeyClient({ projectId: process.env.NPK_PROJECT_ID! });
const apiKey = process.env.NPK_API_KEY!;

const credentials = await client.listCredentials('user-123', apiKey);
for (const cred of credentials.filter((c) => c.isActive)) {
  console.log(cred.deviceName, cred.lastUsedAt ?? 'nunca usado');
}

await client.revokeCredential('user-123', credentials[0].credentialId, apiKey);
```

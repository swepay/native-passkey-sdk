# Tipos

Interfaces e classes exportadas por `@swepay/native-passly-sdk`. Os pacotes
`@swepay/native-passly-react` e `@swepay/native-passly-angular` reexportam
todos estes tipos.

```typescript
import {
  PasskeyError,
  type NativePasskeyConfig,
  type RegisterPasskeyOptions,
  type RegisterResult,
  type RegisterWithRecoveryAssertionOptions,
  type AuthenticateOptions,
  type AuthenticateResult,
  type PasskeyCredential,
  type PasskeySupport,
  type PasskeyErrorCode,
} from '@swepay/native-passly-sdk';
```

## `NativePasskeyConfig`

Configuração do cliente.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `projectId` | `string` | ✅ | ID do projeto NativePasskey (ex.: `proj_abc123`) |
| `apiBaseUrl` | `string` | ❌ | URL base da API. Padrão: `https://api-passkey.swepay.com.br` |

## `RegisterPasskeyOptions`

Entrada de `registerPasskey`.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `externalUserId` | `string` | ✅ | ID do usuário no seu sistema |
| `userDisplayName` | `string` | ✅ | Nome exibido na UI biométrica |
| `deviceName` | `string` | ✅ | Rótulo do dispositivo (ex.: `iPhone 16 Pro`) |

## `RegisterResult`

Saída de `registerPasskey` e `registerWithRecoveryAssertion`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `success` | `boolean` | `true` quando o backend devolveu um `credentialId` |
| `credentialId` | `string \| undefined` | ID da credencial criada (base64url) |
| `deviceName` | `string \| undefined` | Rótulo do dispositivo registrado |
| `registeredAt` | `string \| undefined` | Data/hora do registro (ISO-8601) |
| `error` | `PasskeyError \| undefined` | Preenchido quando `success` é `false` |

## `RegisterWithRecoveryAssertionOptions`

Entrada de `registerWithRecoveryAssertion`.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `assertion` | `string` | ✅ | JWS compacto opaco emitido pelo Native Biometrics SDK com `purpose: 'recovery'`. O SDK não decodifica nem armazena |
| `deviceName` | `string` | ✅ | Rótulo do novo dispositivo |

## `AuthenticateOptions`

Entrada de `authenticateWithPasskey`.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `externalUserId` | `string` | ❌ | Omitir = fluxo *discoverable credential* (passkey pura, sem digitar o usuário) |

## `AuthenticateResult`

Saída de `authenticateWithPasskey`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `success` | `boolean` | `true` quando o backend devolveu um `assertionJwt` |
| `assertionJwt` | `string \| undefined` | JWT ES256 assinado com a chave do projeto. Envie ao seu backend para validar via JWKS |
| `externalUserId` | `string \| undefined` | ID do usuário autenticado |
| `error` | `PasskeyError \| undefined` | Preenchido quando `success` é `false` |

## `PasskeyCredential`

Item retornado por `listCredentials`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `credentialId` | `string` | ID da credencial |
| `deviceName` | `string` | Rótulo do dispositivo |
| `createdAt` | `string` | Data de criação (ISO-8601) |
| `lastUsedAt` | `string \| undefined` | Último uso (ISO-8601) |
| `aaguid` | `string` | AAGUID — identifica o modelo do autenticador |
| `transports` | `string[]` | Transportes suportados (ex.: `internal`, `hybrid`) |
| `isActive` | `boolean` | `false` se a credencial foi revogada |

## `PasskeySupport`

Saída de `NativePasskeyClient.isAvailable()`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `available` | `boolean` | `false` = não renderize o botão de biometria |
| `conditionalMediationAvailable` | `boolean` | Suporte a *Conditional UI* (autofill de passkey no campo de login) |
| `biometricType` | `'face' \| 'fingerprint' \| 'platform' \| 'none'` | Tipo de biometria predominante, inferido do user agent |

## `PasskeyErrorCode`

União de strings com todos os códigos de erro. A lista completa, com causa e
tratamento de cada código, está na [referência de erros](/reference/errors).

```typescript
type PasskeyErrorCode =
  | 'user_cancelled'
  | 'invalid_request'
  | 'invalid_client_data_json'
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
  | 'biometric_recovery_disabled'
  | 'invalid_biometric_assertion'
  | 'expired_biometric_assertion'
  | 'replayed_biometric_assertion'
  | 'biometric_purpose_mismatch'
  | 'unknown_biometric_user'
  | 'invalid_recovery_grant'
  | 'unknown_error';
```

## `PasskeyError`

Erro tipado do SDK. Estende `Error`.

```typescript
class PasskeyError extends Error {
  constructor(code: PasskeyErrorCode, message?: string);
  readonly code: PasskeyErrorCode;
  // name === 'PasskeyError'
  // message === message ?? code
}
```

**Exemplo**

```typescript
import { PasskeyError } from '@swepay/native-passly-sdk';

function describe(error: unknown): string {
  if (error instanceof PasskeyError) {
    return `${error.code}: ${error.message}`;
  }
  return 'Erro inesperado';
}
```

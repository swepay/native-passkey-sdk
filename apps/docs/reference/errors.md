# Referência de erros

Todos os SDKs usam o mesmo conjunto de códigos, o `PasskeyErrorCode`. No
TypeScript ele é uma união de strings; no Flutter, um enum com `wireValue`.

## Como os erros chegam até você

| Pacote | Cancelamento (`user_cancelled`) | Erro do backend | Falha de rede / exceção do navegador |
|--------|---------------------------------|-----------------|---------------------------------------|
| Core (`NativePasskeyClient`) | Resolve `{ success: false, error }` | Rejeita com `PasskeyError` | Rejeita com a exceção original |
| Angular (`NativePasskeyService`) | Igual ao core | Igual ao core | Igual ao core |
| React (`usePasskey`) | Resolve `{ success: false, error }` | Resolve `{ success: false, error }` | Resolve com `unknown_error` |
| Flutter (`NativePasskey`) | Resolve `success: false` | Resolve `success: false` | Resolve com `networkError` |

Erros do backend chegam em dois formatos:

- **Legado** — `{ "error": "<código>", "details": "..." }`. O SDK usa o valor de
  `error` como código. `message` fica `HTTP <status>: <código>`.
- **Problem Details (RFC 9457)** — só no fluxo de
  [recuperação biométrica](#recuperacao-biometrica). O SDK converte o `type` no
  código e usa o `detail` como `message`.

::: warning Códigos fora da lista
No core TypeScript, o código do formato legado é repassado **sem validação**.
Se o backend devolver um código que não está nesta página, ele chega em
`error.code` mesmo assim. Sempre trate um caso `default`.
:::

## Padrão de tratamento

```typescript
import { PasskeyError, type PasskeyErrorCode } from '@swepay/native-passly-sdk';

function messageFor(code: PasskeyErrorCode): string | null {
  switch (code) {
    case 'user_cancelled':
      return null; // não é falha — não mostre alerta
    case 'credential_already_registered':
      return 'Este dispositivo já tem uma passkey. Tente entrar.';
    case 'credential_not_found_or_revoked':
      return 'Nenhuma passkey válida encontrada. Cadastre a biometria de novo.';
    case 'challenge_expired':
      return 'O tempo acabou. Tente novamente.';
    case 'network_error':
      return 'Sem conexão. Verifique a internet.';
    default:
      return 'Não foi possível concluir. Tente novamente.';
  }
}

export function handle(error: unknown): string | null {
  if (error instanceof PasskeyError) return messageFor(error.code);
  return 'Erro inesperado.';
}
```

## Cliente

### `user_cancelled`

**Quando ocorre:** o usuário fechou o prompt biométrico, ou o prompt expirou
(timeout de 60 s). Na web, é o `NotAllowedError` do navegador. No Flutter,
também ocorre quando o usuário fecha a tela do fallback WebView.

**Como tratar:** não é uma falha. Não mostre alerta. Permita tentar de novo.

### `network_error`

**Quando ocorre:** apenas no **Flutter** — falha de conexão com a API ou erro ao
carregar a página do fallback WebView. O core TypeScript não gera este código:
lá, uma falha de `fetch` rejeita com o `TypeError` original (e o `usePasskey` do
React a converte em `unknown_error`).

**Como tratar:** peça para o usuário verificar a conexão e tentar de novo.

### `unknown_error`

**Quando ocorre:**

- `listCredentials` / `revokeCredential` receberam resposta HTTP não-2xx;
- o backend respondeu erro sem campo `error`;
- o `usePasskey` (React) capturou uma exceção que não era `PasskeyError`;
- a camada nativa do Flutter falhou por motivo não mapeado;
- um `type` de Problem Details desconhecido.

**Como tratar:** registre `error.message` no seu log e mostre uma mensagem
genérica.

## Requisição e cerimônia (backend)

Estes códigos vêm do backend NativePasskey, em `begin` ou `finish`.

### `invalid_request`

**Quando ocorre:** campos ausentes ou malformados na requisição.

**Como tratar:** confira os parâmetros (`externalUserId`, `userDisplayName`,
`deviceName`). É erro de integração, não do usuário.

### `invalid_client_data_json`

**Quando ocorre:** o `clientDataJSON` enviado não é um JSON válido.

**Como tratar:** erro de integração. Reporte com o `message`.

### `challenge_expired`

**Quando ocorre:** o challenge expirou antes do `finish` — o usuário demorou
demais na cerimônia.

**Como tratar:** peça para tentar de novo. Uma nova tentativa gera outro
challenge.

### `challenge_mismatch`

**Quando ocorre:** o challenge assinado não corresponde ao emitido no `begin`.

**Como tratar:** tente de novo. Se persistir, verifique se não há duas
cerimônias simultâneas para o mesmo usuário.

### `origin_not_allowed`

**Quando ocorre:** a origem da página (ou do app Android, no formato
`android:apk-key-hash:...`) não está na allowlist do projeto.

**Como tratar:** erro de configuração. Cadastre a origem no projeto
NativePasskey. Veja [Setup Flutter](/flutter/setup#origem-do-app-android).

### `rp_id_hash_mismatch`

**Quando ocorre:** o hash do RP ID no `authenticatorData` não confere com o RP
ID do projeto — a página roda em um domínio diferente do RP ID.

**Como tratar:** sirva a aplicação no domínio do RP ID (ou num subdomínio dele).

### `user_not_verified`

**Quando ocorre:** o autenticador não fez a verificação do usuário (biometria
ou PIN).

**Como tratar:** peça para o usuário configurar biometria ou bloqueio de tela no
dispositivo.

### `signature_verification_failed`

**Quando ocorre:** a assinatura da asserção não confere com a chave pública
registrada.

**Como tratar:** trate como falha de login. Não revele detalhes ao usuário.

### `sign_count_replay_attack_detected`

**Quando ocorre:** o contador de assinaturas do autenticador não avançou —
possível credencial clonada ou replay.

**Como tratar:** bloqueie o login e considere revogar a credencial
(`revokeCredential`). Registre o evento para análise de segurança.

### `credential_not_found_or_revoked`

**Quando ocorre:** a credencial usada não existe ou foi revogada. No Flutter
Android, também quando o dispositivo não tem nenhuma passkey para o RP ID.

**Como tratar:** ofereça outro método de login e, depois, um novo registro.

### `credential_already_registered`

**Quando ocorre:** o usuário já tem uma passkey registrada neste autenticador.

**Como tratar:** sugira entrar com a passkey existente.

### `project_not_found`

**Quando ocorre:** o `projectId` não existe.

**Como tratar:** erro de configuração. Confira o `projectId`.

## Recuperação biométrica

Códigos de `registerWithRecoveryAssertion`. O backend responde em
`application/problem+json`, com `type` no formato
`https://errors.swepay.com.br/passly/biometric-recovery/<slug>`.

| Código (TypeScript) | Slug do `type` | Quando ocorre | Como tratar |
|---------------------|----------------|---------------|-------------|
| `biometric_recovery_disabled` | `disabled` | O projeto não habilitou a integração com o Native Biometrics | Erro de configuração. Ofereça outro fluxo de recuperação |
| `invalid_biometric_assertion` | `invalid-assertion` | Assinatura ou estrutura da asserção inválida | Peça uma nova verificação biométrica |
| `expired_biometric_assertion` | `expired-assertion` | A asserção expirou ou está fora da janela de idade | Peça uma nova verificação biométrica |
| `replayed_biometric_assertion` | `replayed-assertion` | A asserção já foi usada | Peça uma nova verificação biométrica |
| `biometric_purpose_mismatch` | `purpose-mismatch` | A asserção não tem `purpose=Recovery` | Gere a asserção com `purpose: 'recovery'` |
| `unknown_biometric_user` | `unknown-user` | O usuário da asserção não é um `externalUserId` utilizável | Ofereça outro fluxo de recuperação |
| `invalid_recovery_grant` | `invalid-recovery-grant` | O *recovery grant* está ausente, expirado (5 min), já usado ou não confere com o `finish` | Recomece a recuperação |

## Flutter

O enum `PasskeyErrorCode` do Dart usa nomes camelCase. `wireValue` é o código
textual e `PasskeyErrorCode.fromWire()` faz a conversão inversa (valor
desconhecido vira `unknownError`).

| Enum Dart | `wireValue` |
|-----------|-------------|
| `userCancelled` | `user_cancelled` |
| `invalidRequest` | `invalid_request` |
| `invalidClientDataJson` | `invalid_client_data_json` |
| `challengeExpired` | `challenge_expired` |
| `challengeMismatch` | `challenge_mismatch` |
| `originNotAllowed` | `origin_not_allowed` |
| `rpIdHashMismatch` | `rp_id_hash_mismatch` |
| `userNotVerified` | `user_not_verified` |
| `signatureVerificationFailed` | `signature_verification_failed` |
| `signCountReplayAttackDetected` | `sign_count_replay_attack_detected` |
| `credentialNotFoundOrRevoked` | `credential_not_found_or_revoked` |
| `credentialAlreadyRegistered` | `credential_already_registered` |
| `projectNotFound` | `project_not_found` |
| `networkError` | `network_error` |
| `unsupported` | `unsupported` |
| `biometricRecoveryDisabled` | `disabled` |
| `invalidBiometricAssertion` | `invalid-assertion` |
| `expiredBiometricAssertion` | `expired-assertion` |
| `replayedBiometricAssertion` | `replayed-assertion` |
| `biometricPurposeMismatch` | `purpose-mismatch` |
| `unknownBiometricUser` | `unknown-user` |
| `invalidRecoveryGrant` | `invalid-recovery-grant` |
| `unknownError` | `unknown_error` |

### Só no Flutter: `unsupported`

**Quando ocorre:** não há autenticador de plataforma e não há fallback WebView
utilizável (`webFallbackUrl` nulo ou `context` ausente). No iOS < 16, também é o
código da camada nativa. Em `registerWithRecoveryAssertion`, sempre que o
caminho nativo não está disponível.

**Como tratar:** esconda a opção de passkey e ofereça outro método de login.

::: warning Recuperação: wireValue diferente entre Flutter e TypeScript
Para os códigos de recuperação biométrica, o `wireValue` do Flutter é o **slug**
(`expired-assertion`), enquanto o TypeScript usa o nome completo
(`expired_biometric_assertion`). Na chamada direta à API, os dois SDKs chegam
ao código certo. Mas, se um app web enviar `passkey_error` com o código
TypeScript pela [ponte do fallback WebView](/flutter/webview-fallback),
`fromWire` não o reconhece e o resultado no Flutter é `unknownError`.
:::

## `PasskeyVerifier` (servidor)

O [`PasskeyVerifier`](/react/server) não usa `PasskeyErrorCode`. Seu campo
`error` é uma string: `'user_not_verified'` ou a mensagem de erro da biblioteca
`jose` (assinatura inválida, JWT expirado, `iss` ou `aud` incorretos).

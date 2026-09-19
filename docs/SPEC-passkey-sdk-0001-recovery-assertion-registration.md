---
id: SPEC-passkey-sdk-0001
title: registerWithRecoveryAssertion — recuperação de conta por asserção biométrica
status: approved
workload: support-library
owner: "@swepay/backend-api"
created: 2026-09-19
updated: 2026-09-19
affects_repos: [native-passkey-backend, native-biometrics-backend]
libraries: []
global_standards: [GS-01, GS-04, GS-07, GS-13]
tenant_impact: no
regulated_data: no
fapi_impact: no
adr_refs: [ADR-0003]
---

# SPEC-passkey-sdk-0001: registerWithRecoveryAssertion — recuperação de conta por asserção biométrica

> `native-passkey-sdk` não mantém `specs/` (é uma support-library — três pacotes npm +
> um pacote Flutter). Esta nota vive em `docs/` por decisão explícita (ver task de
> implementação), preenchendo o mesmo template de `spec-standard/TEMPLATE.md` que o backend
> usa, para manter rastreabilidade com `SPEC-passkey-0002` (`native-passkey-backend`), que é a
> fonte de verdade do contrato de API.

## 1. Contexto & Problema · dono: `po`

`native-passkey-backend` (PR `feat/biometric-recovery-registration`, `SPEC-passkey-0002`)
adiciona um jeito de registrar uma passkey nova quando o usuário perdeu o único dispositivo e
não tem mais nenhuma forma de provar quem é para o app cliente: trocar uma asserção biométrica
`purpose=Recovery` (emitida pelo produto standalone Native Biometrics) por um
`PasskeyRecoveryGrant` de uso único, e usá-lo para autorizar `register/finish`. Essa spec
registrou o método que o `native-passkey-sdk` precisaria expor (§10 daquela spec) sem
implementá-lo — esta nota fecha esse gap no SDK.

## 2. Goals & Non-Goals · dono: `po`

**Goals:**
- Expor `registerWithRecoveryAssertion` no core (`@nativeguard/passkey`), no hook React
  (`usePasskey`) e no serviço Angular (`NativePasskeyService`), com o mesmo shape de chamada
  nas três camadas.
- Reusar a cerimônia `navigator.credentials.create(...)` do `registerPasskey` — zero
  duplicação da lógica WebAuthn.
- Mapear os 7 novos tipos RFC 9457 (`https://errors.swepay.com.br/passly/biometric-recovery/*`)
  para `PasskeyErrorCode` tipados, sem vazar `type`/`detail` cru para o chamador além da
  mensagem do erro.
- Nunca persistir a asserção recebida (é uma string opaca de uso único).
- Implementar o equivalente em Flutter (`native_passkey_flutter`), já que o pacote espelha o
  mesmo fluxo HTTP do core.

**Non-Goals:**
- Qualquer mudança em `native-passkey-backend`, `native-biometrics-backend` ou
  `native-identity-core` — contrato de API é dado (ver §4).
- Fallback WebView de recuperação no Flutter — a página hospedada de recuperação é um
  follow-up separado; hoje o Flutter só suporta o caminho nativo para este fluxo específico.
- Decodificar/validar a asserção no client — é opaca de ponta a ponta (ADR-0003).

## 3. Design Proposto · dono: `architect`

- **Core:** `NativePasskeyClient.registerWithRecoveryAssertion({ assertion, deviceName })` —
  `POST .../passkey/recovery/biometric/registration-options` → decodifica `userIdBase64Url`
  (UTF-8) para obter o `externalUserId` resolvido pelo backend → reusa o novo método privado
  `createPasskeyCredential(begin, userName)` (extraído de `registerPasskey`, que passou a
  chamá-lo também) → `POST .../passkey/register/finish` com `recoveryGrantId`.
- **Erros:** `post()` passa a reconhecer dois contratos de erro — o legado `{ error, details }`
  (todo o resto da API) e `application/problem+json` (RFC 9457, só este fluxo novo) — via um
  mapa `slug → PasskeyErrorCode` (`problemTypeToErrorCode`), extraindo o slug do campo `type`.
  Endpoint desconhecido/slug não mapeado cai em `unknown_error` (nunca lança um erro sem
  `code`).
- **React/Angular:** wrappers finos que só delegam ao core (mesma forma de
  `registerPasskey`/`registerWithRecoveryAssertion` em cada camada) — nenhuma lógica de negócio
  duplicada.
- **Flutter:** `NativePasskey.registerWithRecoveryAssertion` reusa
  `_toCreateOptionsMap` (extraído de `_toCreateOptions`, usado também por `_registerNative`) e
  o `PasskeyApiClient` ganha `beginBiometricRecoveryRegistration` +
  `finishRegistration(recoveryGrantId: ...)`. Sem autenticador nativo disponível, o resultado é
  `PasskeyErrorCode.unsupported` (sem fallback WebView — ver Non-Goals).
- **Alternativa descartada:** duplicar a cerimônia `navigator.credentials.create`/
  `createCredential` inteira dentro do novo método — rejeitada por violar DRY
  (`swepay-clean-code`/`swepay-solid`) sem nenhum ganho; a única diferença real entre os dois
  fluxos é de onde vêm as opções e o valor de `userName`.

## 4. Contrato de API / Mudanças · dono: `developer`

Contrato consumido, definido por `native-passkey-backend` (`SPEC-passkey-0002`):

- `POST /v1/projects/{projectId}/passkey/recovery/biometric/registration-options`
  `{ assertion }` → `{ recoveryGrantId, expiresInSeconds, challengeId, challengeBase64Url,
  rpId, rpName, userIdBase64Url, userDisplayName, pubKeyCredParams, excludeCredentials }`.
- `POST /v1/projects/{projectId}/passkey/register/finish` ganha `recoveryGrantId?: string`
  (aditivo, 100% compatível com chamadores atuais).
- Erros novos (`application/problem+json`, GS-04): `passly/biometric-recovery/{disabled,
  invalid-assertion, expired-assertion, replayed-assertion, purpose-mismatch, unknown-user,
  invalid-recovery-grant}`.

**Breaking changes:** não — `registerWithRecoveryAssertion` é um método novo; `RegisterResult`
e `PasskeyErrorCode` só ganharam membros (union type extendida, aditiva em TS/Dart).

## 5. Modelo de Dados · dono: `developer`

N/A — biblioteca cliente, sem persistência própria.

## 6. Segurança & Compliance · dono: `security`

- **Tenant/FAPI/LGPD:** não aplicável no SDK — toda a decisão de tenant, verificação da
  asserção e retenção de dado regulado acontece no backend (`SPEC-passkey-0002` §6). O SDK
  nunca decodifica nem loga a asserção; ela vive só como parâmetro local de função, nunca em
  propriedade de instância (testado em `client.test.ts`, caso "nunca persiste a asserção").
- ADR-0003: este SDK não referencia `@swepay/biometrics-react`/`native-biometrics-sdk` — só
  aceita a string opaca vinda de fora.

## 7. Erros — RFC 9457 · dono: `developer`

| `type` (sob `https://errors.swepay.com.br/`) | `PasskeyErrorCode` |
|---|---|
| `passly/biometric-recovery/disabled` | `biometric_recovery_disabled` |
| `passly/biometric-recovery/invalid-assertion` | `invalid_biometric_assertion` |
| `passly/biometric-recovery/expired-assertion` | `expired_biometric_assertion` |
| `passly/biometric-recovery/replayed-assertion` | `replayed_biometric_assertion` |
| `passly/biometric-recovery/purpose-mismatch` | `biometric_purpose_mismatch` |
| `passly/biometric-recovery/unknown-user` | `unknown_biometric_user` |
| `passly/biometric-recovery/invalid-recovery-grant` | `invalid_recovery_grant` |
| qualquer outro (`common/too-many-requests` incl.) | `unknown_error` |

## 8. Estratégia de Teste · dono: `qa`

- `packages/core/src/client.test.ts` (Vitest + `@faker-js/faker`, `navigator.credentials`
  mockado, zero WebAuthn real): caminho feliz, cancelamento, cada um dos 7 `type` RFC 9457,
  `type` desconhecido, grant passado a `finish`, erro do próprio `finish` (grant inválido),
  "nunca persiste a asserção". Cobertura do pacote: 100% linha/statement, 91.66% branch
  (gate: 85%).
- `packages/flutter/test/api_client_test.dart` +
  `packages/flutter/test/native_passkey_test.dart`: `beginBiometricRecoveryRegistration`,
  `finishRegistration` com/sem `recoveryGrantId`, caminho feliz do orquestrador híbrido, sem
  autenticador nativo → `unsupported`, erro tipado propagado.
- React/Angular: sem teste próprio nesta mudança — os wrappers são delegação pura (mesma forma
  dos métodos existentes, que também não têm teste próprio hoje); a lógica testável vive no
  core.

## 9. Rollout · dono: `sre`

- Biblioteca sem deploy próprio — `pnpm changeset` (minor, os 3 pacotes TS movem-se juntos por
  serem `fixed`) + PR normal. Publicação no npm/pub.dev é decisão separada do maintainer
  (fora desta mudança).
- Depende de `native-passkey-backend` (branch `feat/biometric-recovery-registration`) estar em
  hml/prd antes de qualquer app consumidor chamar o método em produção — sem isso, a chamada
  recebe 404 `passly/biometric-recovery/disabled` de qualquer projeto que não tenha
  `biometrics` configurado (fail-closed, sem quebrar nada).

## 10. Questões em Aberto · dono: autor

- Fallback WebView do Flutter para este fluxo — follow-up separado (ver Non-Goals).
- Se o React/Angular precisarem de um componente pronto (`PasskeyRecoveryButton`, análogo a
  `PasskeyRegisterButton`) é decisão de produto futura; hoje o hook/serviço já cobrem o caso de
  uso com uma UI própria do app cliente.

---
**Checklist de saída:** front-matter válido · todas as seções aplicáveis preenchidas ·
nenhum disparo tenant/regulated/fapi (biblioteca sem I/O de dado de cliente) · sem desvio de
shared kernel.

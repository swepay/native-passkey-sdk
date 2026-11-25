# @nativeguard/passkey

## 1.1.0

### Minor Changes

- e565dc1: Add `registerWithRecoveryAssertion` — registers a new passkey when the user lost their only
  device, by trading a `purpose=Recovery` Native Biometrics assertion (an opaque, never-persisted
  string) for a WebAuthn registration authorised by a short-lived, single-use recovery grant
  (backend `SPEC-passkey-0002`). Exposed identically on the core client, the React `usePasskey`
  hook and the Angular `NativePasskeyService`. Adds seven new `PasskeyErrorCode` values for the
  RFC 9457 problem types this flow can return (`biometric_recovery_disabled`,
  `invalid_biometric_assertion`, `expired_biometric_assertion`, `replayed_biometric_assertion`,
  `biometric_purpose_mismatch`, `unknown_biometric_user`, `invalid_recovery_grant`).

## 1.0.2

### Patch Changes

- f96a8f7: `registerPasskey` e `authenticateWithPasskey` agora derivam `success` da presença
  do campo-chave da resposta (`credentialId` / `assertionJwt`), pois o backend
  responde 2xx sem um campo `success`. Antes, `result.success` ficava `undefined`
  (falsy) mesmo em sucesso. (Pacote Flutter recebe o mesmo fix via pub.dev 0.1.2.)

## 1.0.1

### Patch Changes

- 1b44bf4: fix: corrige o host default da API para `https://api-passkey.swepay.com.br`

  O default de `apiBaseUrl` apontava para um host legado inexistente
  (`https://passkey.nativeguard.io`). Atualizado em `NativePasskeyClient`
  (core) e `PasskeyVerifier` (react) para o host real do backend Passkey
  da Swepay. Quem já passa `apiBaseUrl` explicitamente não é afetado.

- 600eb8c: Adiciona os códigos `invalid_request` e `invalid_client_data_json` ao tipo
  `PasskeyErrorCode`, alinhando o contrato de erro com o backend Passly. (O pacote
  Flutter `native_passkey_flutter` recebe o mesmo alinhamento via pub.dev v0.1.1.)

# @nativeguard/passkey-angular

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

### Patch Changes

- 4dc2854: Bump runtime dependencies as part of the 2026-09 security dependency audit
  (`docs/security/dependency-audit-2026-09.md`): `jose` `^5.9.0` → `^5.10.0` in
  `@nativeguard/passkey-react`, `tslib` `^2.3.0` → `^2.8.1` in `@nativeguard/passkey-angular`.
  No public API changes.

## 1.0.2

### Patch Changes

- Updated dependencies [f96a8f7]
  - @nativeguard/passkey@1.0.2

## 1.0.1

### Patch Changes

- 1b44bf4: fix: corrige o host default da API para `https://api-passkey.swepay.com.br`

  O default de `apiBaseUrl` apontava para um host legado inexistente
  (`https://passkey.nativeguard.io`). Atualizado em `NativePasskeyClient`
  (core) e `PasskeyVerifier` (react) para o host real do backend Passkey
  da Swepay. Quem já passa `apiBaseUrl` explicitamente não é afetado.

- Updated dependencies [1b44bf4]
- Updated dependencies [600eb8c]
  - @nativeguard/passkey@1.0.1

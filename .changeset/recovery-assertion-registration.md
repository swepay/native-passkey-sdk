---
"@nativeguard/passkey": minor
"@nativeguard/passkey-react": minor
"@nativeguard/passkey-angular": minor
---

Add `registerWithRecoveryAssertion` — registers a new passkey when the user lost their only
device, by trading a `purpose=Recovery` Native Biometrics assertion (an opaque, never-persisted
string) for a WebAuthn registration authorised by a short-lived, single-use recovery grant
(backend `SPEC-passkey-0002`). Exposed identically on the core client, the React `usePasskey`
hook and the Angular `NativePasskeyService`. Adds seven new `PasskeyErrorCode` values for the
RFC 9457 problem types this flow can return (`biometric_recovery_disabled`,
`invalid_biometric_assertion`, `expired_biometric_assertion`, `replayed_biometric_assertion`,
`biometric_purpose_mismatch`, `unknown_biometric_user`, `invalid_recovery_grant`).

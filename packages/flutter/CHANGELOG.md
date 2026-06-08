# Changelog

Todas as mudanças notáveis deste pacote são documentadas aqui.
Segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e
[Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.1.0] - 2026-06-08

### Added

- Primeiro release do `native_passkey_flutter`.
- API Dart unificada `NativePasskey` com `register`, `authenticate`, `isAvailable`,
  `listCredentials` e `revokeCredential`, espelhando o contrato do `@nativeguard/passkey`.
- Estratégia **híbrida**: cerimônia WebAuthn nativa via Android Credential Manager
  (API 34+) e iOS ASAuthorization (iOS 16+), com fallback automático para WebView
  (`PasskeyWebView`) quando o autenticador de plataforma não está disponível.
- Modelos tipados (`RegisterResult`, `AuthenticateResult`, `PasskeyCredential`,
  `PasskeySupport`, `PasskeyError`) e `PasskeyErrorCode`.
- App de exemplo em `example/`.
- Publicação automatizada no pub.dev via OIDC (GitHub Actions).

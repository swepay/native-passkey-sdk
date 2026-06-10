# Changelog

Todas as mudanças notáveis deste pacote são documentadas aqui.
Segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e
[Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.1.2] - 2026-06-09

### Fixed
- **Login/registro reportavam falha mesmo em sucesso.** `AuthenticateResult` e
  `RegisterResult` derivavam `success` de um campo `success` que o backend não
  envia (a resposta 2xx traz `assertionJwt`/`credentialId`). Agora o sucesso é
  derivado da presença do campo-chave — corrige o caso do app ficar na tela de
  login sem erro mesmo com a cerimônia bem-sucedida.

## [0.1.1] - 2026-06-09

### Added
- Códigos de erro `invalid_request` e `invalid_client_data_json` no enum
  `PasskeyErrorCode` (alinhamento com o backend Passly).

### Fixed
- Parsing de erro robusto em `PasskeyApiClient`: lê o código de `error`,
  com fallback para `details` e RFC 7807 ProblemDetails (`code` / `type`),
  evitando `unknown_error` quando o corpo de erro varia de formato.

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

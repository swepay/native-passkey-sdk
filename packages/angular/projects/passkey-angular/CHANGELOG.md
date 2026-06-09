# @nativeguard/passkey-angular

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

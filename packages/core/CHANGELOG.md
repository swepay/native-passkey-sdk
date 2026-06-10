# @nativeguard/passkey

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

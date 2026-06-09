---
"@nativeguard/passkey": patch
---

Adiciona os códigos `invalid_request` e `invalid_client_data_json` ao tipo
`PasskeyErrorCode`, alinhando o contrato de erro com o backend Passly. (O pacote
Flutter `native_passkey_flutter` recebe o mesmo alinhamento via pub.dev v0.1.1.)

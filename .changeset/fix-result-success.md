---
"@nativeguard/passkey": patch
---

`registerPasskey` e `authenticateWithPasskey` agora derivam `success` da presença
do campo-chave da resposta (`credentialId` / `assertionJwt`), pois o backend
responde 2xx sem um campo `success`. Antes, `result.success` ficava `undefined`
(falsy) mesmo em sucesso. (Pacote Flutter recebe o mesmo fix via pub.dev 0.1.2.)

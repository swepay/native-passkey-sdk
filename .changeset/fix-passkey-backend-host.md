---
"@nativeguard/passkey": patch
"@nativeguard/passkey-angular": patch
"@nativeguard/passkey-react": patch
---

fix: corrige o host default da API para `https://api-passkey.swepay.com.br`

O default de `apiBaseUrl` apontava para um host legado inexistente
(`https://passkey.nativeguard.io`). Atualizado em `NativePasskeyClient`
(core) e `PasskeyVerifier` (react) para o host real do backend Passkey
da Swepay. Quem já passa `apiBaseUrl` explicitamente não é afetado.

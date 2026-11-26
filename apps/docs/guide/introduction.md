# Introdução

O **NativePasskey SDK** é o conjunto de bibliotecas cliente do serviço de
Passkey da Swepay/NativeGuard. Com ele, sua aplicação registra e autentica
usuários com **passkeys** — credenciais WebAuthn/FIDO2 protegidas pela biometria
do dispositivo (Face ID, Touch ID, impressão digital Android, Windows Hello).

## O que é uma passkey

Uma passkey é um par de chaves criptográficas criado pelo próprio dispositivo:

- A **chave privada** nunca sai do dispositivo. Ela fica protegida pelo
  *autenticador de plataforma* — o componente do sistema operacional que pede a
  biometria ou o PIN.
- A **chave pública** é enviada ao backend NativePasskey no registro.
- No login, o dispositivo assina um **challenge** (um valor aleatório de uso
  único gerado pelo backend) e o backend confere a assinatura com a chave pública.

O usuário não digita senha. Ele só confirma a biometria.

## Como o SDK se encaixa no fluxo

Toda cerimônia (registro ou autenticação) tem três etapas:

1. **begin** — o SDK pede ao backend NativePasskey
   (`https://api-passkey.swepay.com.br`) as opções da cerimônia e o challenge.
2. **cerimônia local** — o SDK chama o autenticador de plataforma
   (`navigator.credentials` na web; Credential Manager / ASAuthorization no Flutter).
3. **finish** — o SDK envia o resultado ao backend, que valida a criptografia.

Na autenticação, o backend devolve um **`assertionJwt`**: um JWT ES256 assinado
com a chave do seu projeto. Sua aplicação envia esse JWT ao **seu** backend, que
o valida via JWKS (por exemplo com o [`PasskeyVerifier`](/react/server)) e cria
a sessão do usuário.

```
Navegador / App                Backend NativePasskey            Seu backend
───────────────                ─────────────────────            ───────────
authenticateWithPasskey() ──▶  /passkey/authenticate/begin
biometria (Face ID etc.)
                          ──▶  /passkey/authenticate/finish
              ◀── assertionJwt
fetch('/api/auth/passkey', { assertionJwt }) ─────────────────▶ PasskeyVerifier.verify()
                                                                cookie de sessão
```

## Pacotes

| Pacote | Para quem | Documentação |
|--------|-----------|--------------|
| `@swepay/native-passly-sdk` | Qualquer app web sem wrapper dedicado | [Core](/core/) |
| `@swepay/native-passly-react` | React 18/19 e Next.js App Router | [React](/react/) |
| `@swepay/native-passly-angular` | Angular 21 | [Angular](/angular/) |
| `native_passkey_flutter` | Apps Flutter Android/iOS | [Flutter](/flutter/) |

Os pacotes React e Angular reexportam o cliente e os tipos do core. Você instala
apenas o pacote do seu framework.

## Quando usar

Use o NativePasskey SDK quando você quer:

- login sem senha com a biometria do dispositivo;
- um único contrato de API entre web (Angular/React) e mobile (Flutter);
- validação do login no seu próprio backend, a partir de um JWT assinado.

## Próximos passos

- [Instalação](/guide/installation)
- [Quick start](/guide/quick-start)

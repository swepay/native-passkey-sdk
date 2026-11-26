# @swepay/native-passly-sdk (core)

Cliente WebAuthn/FIDO2 framework-agnostic. É a base sobre a qual os pacotes
`@swepay/native-passly-react` e `@swepay/native-passly-angular` são construídos —
instale-o diretamente apenas se estiver integrando um framework ainda sem
wrapper dedicado.

- npm: [`@swepay/native-passly-sdk`](https://www.npmjs.com/package/@swepay/native-passly-sdk)
- Código-fonte: [`packages/core`](https://github.com/swepay/native-passkey-sdk/tree/main/packages/core)

## Instalação

```bash
pnpm add @swepay/native-passly-sdk
```

Sem dependências em runtime. Distribuído em ESM (`dist/index.js`) e CJS
(`dist/index.cjs`), com tipos `.d.ts`.

## API pública

Tudo o que `src/index.ts` exporta:

| Export | Tipo | Documentação |
|--------|------|--------------|
| `NativePasskeyClient` | classe | [Cliente](/core/client) |
| `PasskeyError` | classe | [Tipos](/core/types#passkeyerror) |
| `NativePasskeyConfig` | interface | [Tipos](/core/types#nativepasskeyconfig) |
| `RegisterPasskeyOptions` | interface | [Tipos](/core/types#registerpasskeyoptions) |
| `RegisterResult` | interface | [Tipos](/core/types#registerresult) |
| `RegisterWithRecoveryAssertionOptions` | interface | [Tipos](/core/types#registerwithrecoveryassertionoptions) |
| `AuthenticateOptions` | interface | [Tipos](/core/types#authenticateoptions) |
| `AuthenticateResult` | interface | [Tipos](/core/types#authenticateresult) |
| `PasskeyCredential` | interface | [Tipos](/core/types#passkeycredential) |
| `PasskeySupport` | interface | [Tipos](/core/types#passkeysupport) |
| `PasskeyErrorCode` | union de strings | [Referência de erros](/reference/errors) |

::: info Utilitários internos
As funções de base64url e de detecção de suporte existem no código, mas **não**
são exportadas pelo pacote. Para detectar suporte, use
[`NativePasskeyClient.isAvailable()`](/core/client#nativepasskeyclient-isavailable).
:::

## Exemplo mínimo

```typescript
import { NativePasskeyClient } from '@swepay/native-passly-sdk';

const client = new NativePasskeyClient({ projectId: 'proj_xxx' });

const result = await client.authenticateWithPasskey();
if (!result.success) {
  console.error(result.error?.code, result.error?.message);
}
```

Para uso com React ou Angular, prefira os wrappers `@swepay/native-passly-react`
e `@swepay/native-passly-angular`, que já expõem este cliente através de
hooks/serviços idiomáticos.

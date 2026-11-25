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

## API pública

Exportado por `src/index.ts`:

- `NativePasskeyClient` — cliente principal (`registerPasskey`, `authenticateWithPasskey`,
  `registerWithRecoveryAssertion`).
- `PasskeyError` — erro tipado por `PasskeyErrorCode`.
- Tipos: `NativePasskeyConfig`, `RegisterPasskeyOptions`, `RegisterResult`,
  `RegisterWithRecoveryAssertionOptions`, `AuthenticateOptions`, `AuthenticateResult`,
  `PasskeyCredential`, `PasskeySupport`, `PasskeyErrorCode`.

## Exemplo mínimo

```ts
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

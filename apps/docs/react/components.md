# Componentes

Componentes prontos, todos Client Components. Precisam estar dentro do
[`PasskeyProvider`](/react/setup).

## `PasskeyButton`

Botão de **login** com passkey. Chama `authenticate()` do
[`usePasskey`](/react/hooks#usepasskey).

```tsx
import { PasskeyButton } from '@swepay/native-passly-react';
```

**Props**

Aceita todas as props de `<button>`, exceto `onClick` e `onError`, mais:

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `options` | `AuthenticateOptions` | ❌ | Repassado a `authenticate()` |
| `onSuccess` | `(result: AuthenticateResult) => void` | ❌ | Chamado quando `result.success` é `true` |
| `onError` | `(code: string) => void` | ❌ | Chamado com `result.error.code` (ou `'error'`) em caso de falha |
| `renderButton` | `(props: { onClick: () => void; isLoading: boolean; biometricType: string }) => ReactNode` | ❌ | Render prop para usar o botão do seu design system |
| `children` | `ReactNode` | ❌ | Rótulo. Padrão: `Entrar com Face ID` (quando `biometricType` é `'face'`) ou `Entrar com Digital` |

**Comportamento**

- Não renderiza nada (`null`) enquanto o provider detecta o suporte, nem quando
  `support.available` é `false`.
- Durante a operação, o botão fica `disabled`, com `aria-busy` e o texto
  `Aguardando biometria...`.

**Exemplo**

```tsx
'use client';
import { PasskeyButton } from '@swepay/native-passly-react';

export function Login() {
  return (
    <PasskeyButton
      className="btn btn-primary"
      onSuccess={async (result) => {
        await fetch('/api/auth/passkey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assertionJwt: result.assertionJwt }),
        });
      }}
      onError={(code) => {
        if (code !== 'user_cancelled') alert(`Falha no login: ${code}`);
      }}
    />
  );
}
```

**Exemplo — `renderButton`**

```tsx
'use client';
import { PasskeyButton } from '@swepay/native-passly-react';

export function CustomLogin() {
  return (
    <PasskeyButton
      renderButton={({ onClick, isLoading, biometricType }) => (
        <button type="button" className="my-button" onClick={onClick} disabled={isLoading}>
          {biometricType === 'face' ? 'Usar Face ID' : 'Usar biometria'}
        </button>
      )}
    />
  );
}
```

## `PasskeyRegisterButton`

Botão de **registro** de passkey. Chama `register()` do
[`usePasskey`](/react/hooks#usepasskey).

```tsx
import { PasskeyRegisterButton } from '@swepay/native-passly-react';
```

**Props**

Aceita todas as props de `<button>`, exceto `onClick` e `onError`, mais:

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `registerOptions` | `RegisterPasskeyOptions` | ✅ | `externalUserId`, `userDisplayName`, `deviceName` |
| `onSuccess` | `(result: RegisterResult) => void` | ❌ | Chamado quando `result.success` é `true` |
| `onError` | `(code: string) => void` | ❌ | Chamado com o código do erro em caso de falha |
| `children` | `ReactNode` | ❌ | Rótulo. Padrão: `Registrar biometria` |

**Comportamento**

- Não renderiza nada quando o suporte ainda não foi detectado ou quando
  `support.available` é `false`.
- Durante a operação, mostra `Registrando...` e fica desabilitado. A prop
  `disabled` também é respeitada.

**Exemplo**

```tsx
'use client';
import { PasskeyRegisterButton } from '@swepay/native-passly-react';

export function EnableBiometrics({ userId, name }: { userId: string; name: string }) {
  return (
    <PasskeyRegisterButton
      registerOptions={{ externalUserId: userId, userDisplayName: name, deviceName: 'Meu celular' }}
      onSuccess={(result) => console.log('Registrada:', result.credentialId)}
      onError={(code) => console.warn('Falhou:', code)}
    >
      Ativar Face ID / digital
    </PasskeyRegisterButton>
  );
}
```

## `PasskeyManager`

Lista as passkeys de um usuário, com botão para remover cada uma. Usa
[`usePasskeyCredentials`](/react/hooks#usepasskeycredentials).

```tsx
import { PasskeyManager } from '@swepay/native-passly-react';
```

**Props**

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `externalUserId` | `string` | ✅ | ID do usuário |
| `apiKey` | `string` | ✅ | API key do projeto |
| `onRevoke` | `(credentialId: string) => void` | ❌ | Chamado após revogar uma credencial |
| `renderCredential` | `(cred: PasskeyCredential, onRevoke: () => void) => ReactNode` | ❌ | Render customizado de cada item |

**Comportamento**

- Carregando: `<div role="status">Carregando credenciais...</div>`.
- Lista vazia: `Nenhum dispositivo biométrico registrado.`
- Item padrão: nome do dispositivo, data de criação (`pt-BR`) e botão `Remover`.

::: danger
`PasskeyManager` envia a API key do projeto a partir do navegador. Leia o aviso
em [`usePasskeyCredentials`](/react/hooks#usepasskeycredentials) antes de usar
em produção.
:::

**Exemplo**

```tsx
'use client';
import { PasskeyManager } from '@swepay/native-passly-react';

export function Devices({ userId, apiKey }: { userId: string; apiKey: string }) {
  return (
    <PasskeyManager
      externalUserId={userId}
      apiKey={apiKey}
      onRevoke={(id) => console.log('Removida:', id)}
      renderCredential={(cred, onRevoke) => (
        <div>
          <strong>{cred.deviceName}</strong>
          <button type="button" onClick={onRevoke}>Remover</button>
        </div>
      )}
    />
  );
}
```

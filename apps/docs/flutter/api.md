# API Dart

Tudo é exportado por `package:native_passkey_flutter/native_passkey_flutter.dart`.

```dart
import 'package:native_passkey_flutter/native_passkey_flutter.dart';
```

A API espelha o [`NativePasskeyClient`](/core/client) do core TypeScript.

## `NativePasskeyConfig`

```dart
const NativePasskeyConfig({
  required String projectId,
  String apiBaseUrl = NativePasskeyConfig.defaultApiBaseUrl,
  String? webFallbackUrl,
  bool preferNative = true,
});
```

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `projectId` | `String` | — | ID do projeto NativePasskey |
| `apiBaseUrl` | `String` | `https://api-passkey.swepay.com.br` | URL base da API |
| `webFallbackUrl` | `String?` | `null` | URL do app web usado no [fallback WebView](/flutter/webview-fallback) |
| `preferNative` | `bool` | `true` | Tenta a cerimônia nativa antes do WebView. Com `false`, register/authenticate vão direto para o WebView |

| Membro | Descrição |
|--------|-----------|
| `static const defaultApiBaseUrl` | `'https://api-passkey.swepay.com.br'` |
| `projectBaseUrl` (getter) | `{apiBaseUrl}/v1/projects/{projectId}` |

## `NativePasskey`

```dart
NativePasskey(NativePasskeyConfig config, {NativePasskeyPlatform? platform});
```

O construtor também aceita `apiClient`, um ponto de injeção para testes. A
classe `PasskeyApiClient` não é exportada pelo pacote.

`platform` permite trocar a implementação nativa (útil em testes) — veja
[`NativePasskeyPlatform`](#nativepasskeyplatform).

### `isAvailable()`

**Retorno:** `Future<PasskeySupport>`

| Situação | `available` | `platformAuthenticatorAvailable` | `biometricType` |
|----------|-------------|----------------------------------|-----------------|
| Autenticador nativo disponível | `true` | `true` | `BiometricType.platform` |
| Sem nativo, com `webFallbackUrl` | `true` | `false` | `BiometricType.none` |
| Sem nativo, sem `webFallbackUrl` | `false` | `false` | `BiometricType.none` |

```dart
final support = await passkey.isAvailable();
if (!support.available) {
  // Não mostre o botão de biometria.
}
```

### `register(options, {context})`

Registra uma nova passkey.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `options` | `RegisterPasskeyOptions` | ✅ | `externalUserId`, `userDisplayName`, `deviceName` |
| `context` | `BuildContext?` | ❌ | Necessário só para o fallback WebView |

**Retorno:** `Future<RegisterResult>`

### `authenticate({options, context})`

Autentica com uma passkey existente.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `options` | `AuthenticateOptions` | ❌ | Padrão: `const AuthenticateOptions()` (fluxo *discoverable*) |
| `context` | `BuildContext?` | ❌ | Necessário só para o fallback WebView |

**Retorno:** `Future<AuthenticateResult>` — `assertionJwt` em caso de sucesso.

### `registerWithRecoveryAssertion(options)`

Registra uma passkey nova a partir de uma asserção de recuperação do Native
Biometrics SDK (veja o
[equivalente no core](/core/client#registerwithrecoveryassertion-options)).

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `options` | `RegisterWithRecoveryAssertionOptions` | ✅ | `assertion`, `deviceName` |

**Retorno:** `Future<RegisterResult>`

::: warning Somente caminho nativo
Este fluxo não tem fallback WebView. Sem autenticador de plataforma (ou com
`preferNative: false`), o resultado é `PasskeyErrorCode.unsupported`.
:::

### `listCredentials(externalUserId, apiKey)`

**Retorno:** `Future<List<PasskeyCredential>>`. Lança `PasskeyError` em caso de
falha.

### `revokeCredential(externalUserId, credentialId, apiKey)`

**Retorno:** `Future<void>`. Lança `PasskeyError` em caso de falha.

::: danger API key no app
A API key embarcada no app pode ser extraída do binário. Prefira listar e
revogar credenciais pelo seu backend.
:::

### `dispose()`

Fecha o cliente HTTP interno. Chame quando não for mais usar a instância.

### Tratamento de erros

`register`, `authenticate` e `registerWithRecoveryAssertion` capturam todo
`PasskeyError` e retornam `success: false` com `error`. Isso inclui:

- erros HTTP do backend (o código vem do corpo da resposta);
- falhas de rede (`PasskeyErrorCode.networkError`);
- erros da camada nativa (o `code` da `PlatformException` vira o código do erro,
  ex.: `user_cancelled`);
- fechamento da tela do WebView sem resultado (`userCancelled`).

```dart
final result = await passkey.register(
  const RegisterPasskeyOptions(
    externalUserId: 'user_123',
    userDisplayName: 'Ada Lovelace',
    deviceName: 'iPhone 16 Pro',
  ),
  context: context,
);

if (result.success) {
  debugPrint('Credencial: ${result.credentialId}');
} else {
  switch (result.error?.code) {
    case PasskeyErrorCode.userCancelled:
      break; // o usuário desistiu — sem alerta
    case PasskeyErrorCode.credentialAlreadyRegistered:
      debugPrint('Este dispositivo já tem passkey.');
    case PasskeyErrorCode.unsupported:
      debugPrint('Sem suporte a passkey e sem fallback.');
    default:
      debugPrint('Erro: ${result.error?.message}');
  }
}
```

## Modelos

### `RegisterPasskeyOptions`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `externalUserId` | `String` | ID do usuário no seu sistema |
| `userDisplayName` | `String` | Nome exibido na cerimônia |
| `deviceName` | `String` | Rótulo do dispositivo |

### `AuthenticateOptions`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `externalUserId` | `String?` | Omitir = fluxo *discoverable* |

### `RegisterWithRecoveryAssertionOptions`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `assertion` | `String` | JWS opaco do Native Biometrics SDK (`purpose: 'recovery'`) |
| `deviceName` | `String` | Rótulo do novo dispositivo |

### `RegisterResult`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `success` | `bool` | `true` se veio `credentialId` |
| `credentialId` | `String?` | ID da credencial (base64url) |
| `deviceName` | `String?` | Rótulo do dispositivo |
| `registeredAt` | `String?` | ISO-8601 |
| `error` | `PasskeyError?` | Erro, quando `success` é `false` |

### `AuthenticateResult`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `success` | `bool` | `true` se veio `assertionJwt` |
| `assertionJwt` | `String?` | JWT ES256 para validar no seu backend |
| `externalUserId` | `String?` | ID do usuário autenticado |
| `error` | `PasskeyError?` | Erro, quando `success` é `false` |

### `PasskeyCredential`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `credentialId` | `String` | ID da credencial |
| `deviceName` | `String` | Rótulo do dispositivo |
| `createdAt` | `String` | ISO-8601 |
| `lastUsedAt` | `String?` | ISO-8601 |
| `aaguid` | `String` | AAGUID do autenticador |
| `transports` | `List<String>` | Ex.: `internal`, `hybrid` |
| `isActive` | `bool` | `false` se revogada |

### `PasskeySupport`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `available` | `bool` | `false` = não renderize o botão de biometria |
| `platformAuthenticatorAvailable` | `bool` | `true` = o caminho nativo é viável |
| `biometricType` | `BiometricType` | `face`, `fingerprint`, `platform` ou `none` |

`PasskeySupport.none` é uma constante com tudo desabilitado.

### `PasskeyError`

```dart
class PasskeyError implements Exception {
  PasskeyError(PasskeyErrorCode code, [String? message]);
  final PasskeyErrorCode code;
  final String message; // padrão: code.wireValue
}
```

### `PasskeyErrorCode`

Enum com `wireValue` (o código textual da API) e
`PasskeyErrorCode.fromWire(String?)` (valores desconhecidos viram
`unknownError`). A tabela completa está na
[referência de erros](/reference/errors#flutter).

## `PasskeyWebView` e `PasskeyWebViewMode`

Widget do fallback WebView. Veja [Fallback WebView](/flutter/webview-fallback).

## `NativePasskeyPlatform`

Interface de plataforma (`plugin_platform_interface`). A implementação padrão
fala com o código nativo pelo canal `io.nativeguard.passkey/methods`.

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `isPlatformAuthenticatorAvailable()` | `Future<bool>` | Há autenticador nativo utilizável |
| `createCredential(options)` | `Future<Map<String, dynamic>>` | Cerimônia de registro |
| `getCredential(options)` | `Future<Map<String, dynamic>>` | Cerimônia de autenticação |

Use `NativePasskeyPlatform.instance = ...` (ou o parâmetro `platform` do
construtor) para substituir a implementação em testes:

```dart
import 'package:native_passkey_flutter/native_passkey_flutter.dart';

class FakePlatform extends NativePasskeyPlatform {
  @override
  Future<bool> isPlatformAuthenticatorAvailable() async => false;
}

final passkey = NativePasskey(
  const NativePasskeyConfig(projectId: 'proj_test'),
  platform: FakePlatform(),
);
```

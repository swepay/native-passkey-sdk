/// Parâmetros de registro de uma nova Passkey.
///
/// Espelha `RegisterPasskeyOptions` do core TypeScript.
class RegisterPasskeyOptions {
  /// Cria as opções de registro.
  const RegisterPasskeyOptions({
    required this.externalUserId,
    required this.userDisplayName,
    required this.deviceName,
  });

  /// Identificador do usuário no sistema do cliente.
  final String externalUserId;

  /// Nome de exibição do usuário (mostrado na cerimônia de biometria).
  final String userDisplayName;

  /// Label do dispositivo (ex.: `iPhone 16 Pro`).
  final String deviceName;
}

/// Parâmetros de autenticação com Passkey.
///
/// Espelha `AuthenticateOptions` do core TypeScript.
class AuthenticateOptions {
  /// Cria as opções de autenticação.
  const AuthenticateOptions({this.externalUserId});

  /// Omitir = discoverable credential flow (passkey puro, sem digitar usuário).
  final String? externalUserId;
}

/// Parâmetros de registro de uma nova Passkey autorizado por uma asserção de
/// recuperação biométrica (SPEC-passkey-0002).
///
/// Espelha `RegisterWithRecoveryAssertionOptions` do core TypeScript.
class RegisterWithRecoveryAssertionOptions {
  /// Cria as opções de registro por recuperação.
  const RegisterWithRecoveryAssertionOptions({
    required this.assertion,
    required this.deviceName,
  });

  /// JWS compacto opaco emitido pelo Native Biometrics SDK (`purpose: 'recovery'`).
  /// Nunca decodificado nem persistido por este SDK — só repassado ao backend
  /// (ADR-0003: nenhum produto Swepay depende do código de outro).
  final String assertion;

  /// Label do novo dispositivo (ex.: "iPhone 16 Pro recuperado").
  final String deviceName;
}

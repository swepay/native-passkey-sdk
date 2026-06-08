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

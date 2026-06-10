import 'passkey_error.dart';

/// Resultado de uma operação de registro de Passkey.
///
/// Espelha `RegisterResult` do core TypeScript.
class RegisterResult {
  /// Cria um resultado de registro.
  const RegisterResult({
    required this.success,
    this.credentialId,
    this.deviceName,
    this.registeredAt,
    this.error,
  });

  /// `true` se o registro foi concluído com sucesso.
  final bool success;

  /// Identificador da credencial criada (base64url).
  final String? credentialId;

  /// Label do dispositivo registrado.
  final String? deviceName;

  /// Timestamp ISO-8601 do registro.
  final String? registeredAt;

  /// Erro, quando [success] é `false`.
  final PasskeyError? error;

  /// Constrói a partir do JSON de `/passkey/register/finish`.
  factory RegisterResult.fromJson(Map<String, dynamic> json) {
    return RegisterResult(
      // O backend responde 2xx sem campo `success`; sucesso = veio o credentialId.
      success: json['credentialId'] != null || json['success'] == true,
      credentialId: json['credentialId'] as String?,
      deviceName: json['deviceName'] as String?,
      registeredAt: json['registeredAt'] as String?,
      error: json['error'] == null
          ? null
          : PasskeyError(PasskeyErrorCode.fromWire(json['error'] as String?)),
    );
  }

  /// Atalho para um resultado de falha com um [error].
  factory RegisterResult.failure(PasskeyError error) =>
      RegisterResult(success: false, error: error);
}

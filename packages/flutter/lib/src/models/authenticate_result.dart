import 'passkey_error.dart';

/// Resultado de uma operação de autenticação com Passkey.
///
/// Espelha `AuthenticateResult` do core TypeScript.
class AuthenticateResult {
  /// Cria um resultado de autenticação.
  const AuthenticateResult({
    required this.success,
    this.assertionJwt,
    this.externalUserId,
    this.error,
  });

  /// `true` se a autenticação foi concluída com sucesso.
  final bool success;

  /// JWT ES256 assinado com a chave do projeto.
  ///
  /// Envie ao seu backend para validar via JWKS e criar a sessão.
  final String? assertionJwt;

  /// Identificador externo do usuário autenticado.
  final String? externalUserId;

  /// Erro, quando [success] é `false`.
  final PasskeyError? error;

  /// Constrói a partir do JSON de `/passkey/authenticate/finish`.
  factory AuthenticateResult.fromJson(Map<String, dynamic> json) {
    return AuthenticateResult(
      success: json['success'] == true,
      assertionJwt: json['assertionJwt'] as String?,
      externalUserId: json['externalUserId'] as String?,
      error: json['error'] == null
          ? null
          : PasskeyError(PasskeyErrorCode.fromWire(json['error'] as String?)),
    );
  }

  /// Atalho para um resultado de falha com um [error].
  factory AuthenticateResult.failure(PasskeyError error) =>
      AuthenticateResult(success: false, error: error);
}

/// Códigos de erro do fluxo de Passkey.
///
/// Espelha `PasskeyErrorCode` do pacote `@nativeguard/passkey` (core TypeScript),
/// garantindo um contrato de erro idêntico entre web, Angular, React e Flutter.
enum PasskeyErrorCode {
  /// Usuário cancelou a cerimônia de biometria (ou `NotAllowedError` na web).
  userCancelled('user_cancelled'),

  /// O challenge expirou antes da conclusão.
  challengeExpired('challenge_expired'),

  /// O challenge retornado não corresponde ao iniciado.
  challengeMismatch('challenge_mismatch'),

  /// A origem da requisição não está na allowlist do projeto.
  originNotAllowed('origin_not_allowed'),

  /// O hash do RP ID não confere.
  rpIdHashMismatch('rp_id_hash_mismatch'),

  /// O usuário não foi verificado (UV ausente).
  userNotVerified('user_not_verified'),

  /// A verificação da assinatura falhou no backend.
  signatureVerificationFailed('signature_verification_failed'),

  /// Possível replay attack detectado pela contagem de assinaturas.
  signCountReplayAttackDetected('sign_count_replay_attack_detected'),

  /// Credencial inexistente ou revogada.
  credentialNotFoundOrRevoked('credential_not_found_or_revoked'),

  /// Credencial já registrada para o usuário.
  credentialAlreadyRegistered('credential_already_registered'),

  /// Projeto não encontrado.
  projectNotFound('project_not_found'),

  /// Falha de rede ao falar com a API.
  networkError('network_error'),

  /// Plataforma sem suporte a passkey e sem fallback WebView configurado.
  unsupported('unsupported'),

  /// Erro desconhecido / não mapeado.
  unknownError('unknown_error');

  /// Cria o enum a partir do valor textual usado no wire (snake_case).
  const PasskeyErrorCode(this.wireValue);

  /// Valor textual usado pela API e demais SDKs (ex.: `user_cancelled`).
  final String wireValue;

  /// Converte um valor textual da API no enum correspondente.
  ///
  /// Valores desconhecidos caem em [PasskeyErrorCode.unknownError].
  static PasskeyErrorCode fromWire(String? value) {
    for (final code in PasskeyErrorCode.values) {
      if (code.wireValue == value) return code;
    }
    return PasskeyErrorCode.unknownError;
  }
}

/// Erro tipado lançado pelas operações de Passkey.
class PasskeyError implements Exception {
  /// Cria um [PasskeyError] com um [code] e uma [message] opcional.
  PasskeyError(this.code, [String? message])
      : message = message ?? code.wireValue;

  /// Código estruturado do erro.
  final PasskeyErrorCode code;

  /// Mensagem legível (default: o `wireValue` do código).
  final String message;

  @override
  String toString() => 'PasskeyError(${code.wireValue}): $message';
}

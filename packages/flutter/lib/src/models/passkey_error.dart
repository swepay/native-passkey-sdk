/// Códigos de erro do fluxo de Passkey.
///
/// Espelha `PasskeyErrorCode` do pacote `@nativeguard/passkey` (core TypeScript),
/// garantindo um contrato de erro idêntico entre web, Angular, React e Flutter.
enum PasskeyErrorCode {
  /// Usuário cancelou a cerimônia de biometria (ou `NotAllowedError` na web).
  userCancelled('user_cancelled'),

  /// Requisição inválida (campos ausentes/malformados) — validação do backend.
  invalidRequest('invalid_request'),

  /// O `clientDataJSON` recebido não é um JSON válido.
  invalidClientDataJson('invalid_client_data_json'),

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

  // ── SPEC-passkey-0002 — recuperação por asserção biométrica ────────────────
  // O contrato desses erros é `application/problem+json` (RFC 9457, GS-04), não o
  // `{error, details}` legado — o `wireValue` aqui é o último segmento do `type`
  // (`https://errors.swepay.com.br/passly/biometric-recovery/<slug>`), mesma
  // extração que `PasskeyApiClient._ensureOk` já fazia como fallback genérico.

  /// Projeto não configurou (ou desabilitou) a integração com Native Biometrics.
  biometricRecoveryDisabled('disabled'),

  /// Assinatura/estrutura da asserção inválida, ou `tenant_id`/`decision` incorretos.
  invalidBiometricAssertion('invalid-assertion'),

  /// A asserção expirou ou está fora da janela de idade configurada.
  expiredBiometricAssertion('expired-assertion'),

  /// A asserção (`jti`/correlationId) já foi usada uma vez.
  replayedBiometricAssertion('replayed-assertion'),

  /// A asserção não tem `purpose=Recovery`.
  biometricPurposeMismatch('purpose-mismatch'),

  /// O `user_ref` da asserção não é um `externalUserId` utilizável.
  unknownBiometricUser('unknown-user'),

  /// O `PasskeyRecoveryGrant` está ausente, expirado, já usado ou não bate com o `finish`.
  invalidRecoveryGrant('invalid-recovery-grant'),

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

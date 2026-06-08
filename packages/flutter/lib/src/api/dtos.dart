/// DTOs internos das respostas `begin` da API.
///
/// Não fazem parte da API pública; são consumidos pela camada nativa/WebView
/// para montar o WebAuthn-JSON da cerimônia. Espelham as interfaces
/// `BeginRegistrationResponse` / `BeginAuthResponse` do core TypeScript.
library;

/// Referência a uma credencial existente (allow/exclude lists).
class CredentialDescriptorDto {
  /// Cria o descritor.
  const CredentialDescriptorDto({
    required this.credentialIdBase64Url,
    required this.transports,
  });

  /// ID da credencial em base64url.
  final String credentialIdBase64Url;

  /// Transports declarados para a credencial.
  final List<String> transports;

  /// Constrói a partir de JSON.
  factory CredentialDescriptorDto.fromJson(Map<String, dynamic> json) {
    return CredentialDescriptorDto(
      credentialIdBase64Url: json['credentialIdBase64Url'] as String,
      transports: (json['transports'] as List<dynamic>? ?? const [])
          .map((e) => e as String)
          .toList(growable: false),
    );
  }
}

/// Resposta de `/passkey/register/begin`.
class BeginRegistrationResponse {
  /// Cria a resposta.
  const BeginRegistrationResponse({
    required this.challengeId,
    required this.challengeBase64Url,
    required this.rpId,
    required this.rpName,
    required this.userIdBase64Url,
    required this.userDisplayName,
    required this.pubKeyCredParams,
    required this.excludeCredentials,
  });

  /// Identificador do challenge no backend.
  final String challengeId;

  /// Challenge em base64url.
  final String challengeBase64Url;

  /// Relying Party ID (domínio).
  final String rpId;

  /// Nome legível do Relying Party.
  final String rpName;

  /// ID do usuário (handle WebAuthn) em base64url.
  final String userIdBase64Url;

  /// Nome de exibição do usuário.
  final String userDisplayName;

  /// Algoritmos COSE aceitos (ex.: -7 para ES256).
  final List<int> pubKeyCredParams;

  /// Credenciais a excluir (evita registro duplicado no mesmo device).
  final List<CredentialDescriptorDto> excludeCredentials;

  /// Constrói a partir de JSON.
  factory BeginRegistrationResponse.fromJson(Map<String, dynamic> json) {
    return BeginRegistrationResponse(
      challengeId: json['challengeId'] as String,
      challengeBase64Url: json['challengeBase64Url'] as String,
      rpId: json['rpId'] as String,
      rpName: json['rpName'] as String,
      userIdBase64Url: json['userIdBase64Url'] as String,
      userDisplayName: json['userDisplayName'] as String,
      pubKeyCredParams: (json['pubKeyCredParams'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList(growable: false),
      excludeCredentials:
          (json['excludeCredentials'] as List<dynamic>? ?? const [])
              .map((e) =>
                  CredentialDescriptorDto.fromJson(e as Map<String, dynamic>))
              .toList(growable: false),
    );
  }
}

/// Resposta de `/passkey/authenticate/begin`.
class BeginAuthResponse {
  /// Cria a resposta.
  const BeginAuthResponse({
    required this.challengeId,
    required this.challengeBase64Url,
    required this.rpId,
    required this.allowCredentials,
  });

  /// Identificador do challenge no backend.
  final String challengeId;

  /// Challenge em base64url.
  final String challengeBase64Url;

  /// Relying Party ID (domínio).
  final String rpId;

  /// Credenciais permitidas (vazio = discoverable credential flow).
  final List<CredentialDescriptorDto> allowCredentials;

  /// Constrói a partir de JSON.
  factory BeginAuthResponse.fromJson(Map<String, dynamic> json) {
    return BeginAuthResponse(
      challengeId: json['challengeId'] as String,
      challengeBase64Url: json['challengeBase64Url'] as String,
      rpId: json['rpId'] as String,
      allowCredentials: (json['allowCredentials'] as List<dynamic>? ?? const [])
          .map((e) =>
              CredentialDescriptorDto.fromJson(e as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

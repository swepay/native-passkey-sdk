/// Uma credencial Passkey registrada para um usuário.
///
/// Espelha `PasskeyCredential` do core TypeScript.
class PasskeyCredential {
  /// Cria uma credencial.
  const PasskeyCredential({
    required this.credentialId,
    required this.deviceName,
    required this.createdAt,
    required this.aaguid,
    required this.transports,
    required this.isActive,
    this.lastUsedAt,
  });

  /// Identificador da credencial (base64url).
  final String credentialId;

  /// Label do dispositivo.
  final String deviceName;

  /// Timestamp ISO-8601 de criação.
  final String createdAt;

  /// Timestamp ISO-8601 do último uso, se houver.
  final String? lastUsedAt;

  /// AAGUID do autenticador.
  final String aaguid;

  /// Transports suportados (ex.: `internal`, `hybrid`).
  final List<String> transports;

  /// `true` se a credencial está ativa (não revogada).
  final bool isActive;

  /// Constrói a partir do JSON da API.
  factory PasskeyCredential.fromJson(Map<String, dynamic> json) {
    return PasskeyCredential(
      credentialId: json['credentialId'] as String,
      deviceName: json['deviceName'] as String,
      createdAt: json['createdAt'] as String,
      lastUsedAt: json['lastUsedAt'] as String?,
      aaguid: json['aaguid'] as String,
      transports: (json['transports'] as List<dynamic>? ?? const [])
          .map((e) => e as String)
          .toList(growable: false),
      isActive: json['isActive'] == true,
    );
  }
}

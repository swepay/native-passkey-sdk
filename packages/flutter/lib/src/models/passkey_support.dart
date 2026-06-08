/// Tipo de biometria predominante no dispositivo.
enum BiometricType {
  /// Reconhecimento facial (Face ID / Face Unlock).
  face,

  /// Impressão digital (Touch ID / fingerprint).
  fingerprint,

  /// Autenticador de plataforma genérico (ex.: PIN / padrão do dispositivo).
  platform,

  /// Sem biometria disponível.
  none,
}

/// Resultado da detecção de suporte a Passkey no dispositivo atual.
///
/// Espelha `PasskeySupport` do core TypeScript.
class PasskeySupport {
  /// Cria um snapshot de suporte a Passkey.
  const PasskeySupport({
    required this.available,
    required this.platformAuthenticatorAvailable,
    required this.biometricType,
  });

  /// `false` = não renderizar botão de biometria.
  final bool available;

  /// `true` = há autenticador de plataforma (caminho nativo viável).
  ///
  /// Quando `false`, o SDK recorre ao fallback WebView, se configurado.
  final bool platformAuthenticatorAvailable;

  /// Tipo de biometria predominante no dispositivo.
  final BiometricType biometricType;

  /// Snapshot indicando ausência total de suporte.
  static const PasskeySupport none = PasskeySupport(
    available: false,
    platformAuthenticatorAvailable: false,
    biometricType: BiometricType.none,
  );

  /// Constrói a partir do mapa retornado pelo canal de plataforma nativo.
  factory PasskeySupport.fromPlatformMap(Map<dynamic, dynamic> map) {
    final platformAvailable = map['platformAuthenticatorAvailable'] == true;
    final biometric = switch (map['biometricType']) {
      'face' => BiometricType.face,
      'fingerprint' => BiometricType.fingerprint,
      'platform' => BiometricType.platform,
      _ => platformAvailable ? BiometricType.platform : BiometricType.none,
    };
    return PasskeySupport(
      available: platformAvailable,
      platformAuthenticatorAvailable: platformAvailable,
      biometricType: biometric,
    );
  }
}

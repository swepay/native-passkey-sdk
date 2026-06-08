import 'package:plugin_platform_interface/plugin_platform_interface.dart';

import 'native_passkey_method_channel.dart';

/// Interface de plataforma para a cerimônia WebAuthn nativa.
///
/// Implementada por [MethodChannelNativePasskey] (Android/iOS). A camada
/// nativa apenas executa a cerimônia local (Credential Manager / ASAuthorization)
/// — toda a validação criptográfica acontece no backend (`finish`).
abstract class NativePasskeyPlatform extends PlatformInterface {
  /// Constrói a base da plataforma.
  NativePasskeyPlatform() : super(token: _token);

  static final Object _token = Object();

  static NativePasskeyPlatform _instance = MethodChannelNativePasskey();

  /// Instância ativa da plataforma.
  static NativePasskeyPlatform get instance => _instance;

  /// Permite que implementações de plataforma registrem a si mesmas.
  static set instance(NativePasskeyPlatform value) {
    PlatformInterface.verifyToken(value, _token);
    _instance = value;
  }

  /// `true` se o dispositivo tem um autenticador de plataforma utilizável
  /// (Android API 34+ com Credential Manager / iOS 16+).
  Future<bool> isPlatformAuthenticatorAvailable() {
    throw UnimplementedError(
      'isPlatformAuthenticatorAvailable() não implementado.',
    );
  }

  /// Cria uma credencial (registro). [options] é o WebAuthn-JSON de criação.
  ///
  /// Retorna um mapa com `clientDataJsonBase64Url`,
  /// `attestationObjectBase64Url`, `credentialIdBase64Url` e `transports`.
  Future<Map<String, dynamic>> createCredential(Map<String, dynamic> options) {
    throw UnimplementedError('createCredential() não implementado.');
  }

  /// Obtém uma assertion (autenticação). [options] é o WebAuthn-JSON de request.
  ///
  /// Retorna um mapa com `credentialIdBase64Url`, `clientDataJsonBase64Url`,
  /// `authenticatorDataBase64Url`, `signatureBase64Url` e `userHandleBase64Url`.
  Future<Map<String, dynamic>> getCredential(Map<String, dynamic> options) {
    throw UnimplementedError('getCredential() não implementado.');
  }
}

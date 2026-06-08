import 'package:flutter/services.dart';

import '../models/passkey_error.dart';
import 'native_passkey_platform_interface.dart';

/// Implementação de [NativePasskeyPlatform] via [MethodChannel].
///
/// Conversa com o código nativo (`NativePasskeyPlugin` em Kotlin/Swift) pelo
/// canal `io.nativeguard.passkey/methods`.
class MethodChannelNativePasskey extends NativePasskeyPlatform {
  /// Canal de métodos compartilhado com o código nativo.
  static const MethodChannel channel =
      MethodChannel('io.nativeguard.passkey/methods');

  @override
  Future<bool> isPlatformAuthenticatorAvailable() async {
    try {
      final result =
          await channel.invokeMethod<bool>('isPlatformAuthenticatorAvailable');
      return result ?? false;
    } on MissingPluginException {
      return false;
    } on PlatformException {
      return false;
    }
  }

  @override
  Future<Map<String, dynamic>> createCredential(
    Map<String, dynamic> options,
  ) async {
    final result = await _invokeMap('createCredential', options);
    return result;
  }

  @override
  Future<Map<String, dynamic>> getCredential(
    Map<String, dynamic> options,
  ) async {
    final result = await _invokeMap('getCredential', options);
    return result;
  }

  Future<Map<String, dynamic>> _invokeMap(
    String method,
    Map<String, dynamic> args,
  ) async {
    try {
      final raw = await channel.invokeMethod<Map<dynamic, dynamic>>(
        method,
        args,
      );
      if (raw == null) {
        throw PasskeyError(
            PasskeyErrorCode.unknownError, '$method retornou nulo');
      }
      return raw.map((key, value) => MapEntry(key as String, value));
    } on PlatformException catch (err) {
      // O lado nativo usa o `code` da PlatformException como PasskeyErrorCode.
      throw PasskeyError(PasskeyErrorCode.fromWire(err.code), err.message);
    }
  }
}

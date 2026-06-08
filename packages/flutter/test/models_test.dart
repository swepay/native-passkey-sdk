import 'package:flutter_test/flutter_test.dart';
import 'package:native_passkey_flutter/native_passkey_flutter.dart';

void main() {
  group('PasskeyErrorCode', () {
    test('fromWire mapeia valores conhecidos', () {
      expect(PasskeyErrorCode.fromWire('user_cancelled'),
          PasskeyErrorCode.userCancelled);
      expect(PasskeyErrorCode.fromWire('signature_verification_failed'),
          PasskeyErrorCode.signatureVerificationFailed);
    });

    test('fromWire cai em unknownError para valores desconhecidos/nulos', () {
      expect(PasskeyErrorCode.fromWire('xpto'), PasskeyErrorCode.unknownError);
      expect(PasskeyErrorCode.fromWire(null), PasskeyErrorCode.unknownError);
    });
  });

  group('RegisterResult.fromJson', () {
    test('sucesso', () {
      final r = RegisterResult.fromJson({
        'success': true,
        'credentialId': 'cred_1',
        'deviceName': 'iPhone',
        'registeredAt': '2026-06-08T00:00:00Z',
      });
      expect(r.success, isTrue);
      expect(r.credentialId, 'cred_1');
      expect(r.error, isNull);
    });

    test('falha com erro mapeado', () {
      final r = RegisterResult.fromJson({
        'success': false,
        'error': 'credential_already_registered',
      });
      expect(r.success, isFalse);
      expect(r.error?.code, PasskeyErrorCode.credentialAlreadyRegistered);
    });
  });

  group('AuthenticateResult.fromJson', () {
    test('sucesso com JWT', () {
      final r = AuthenticateResult.fromJson({
        'success': true,
        'assertionJwt': 'jwt.value.here',
        'externalUserId': 'user_123',
      });
      expect(r.success, isTrue);
      expect(r.assertionJwt, 'jwt.value.here');
      expect(r.externalUserId, 'user_123');
    });
  });

  group('PasskeySupport.fromPlatformMap', () {
    test('autenticador disponível → biometricType platform', () {
      final s = PasskeySupport.fromPlatformMap({
        'platformAuthenticatorAvailable': true,
      });
      expect(s.available, isTrue);
      expect(s.platformAuthenticatorAvailable, isTrue);
      expect(s.biometricType, BiometricType.platform);
    });

    test('indisponível → none', () {
      final s = PasskeySupport.fromPlatformMap({
        'platformAuthenticatorAvailable': false,
      });
      expect(s.available, isFalse);
      expect(s.biometricType, BiometricType.none);
    });
  });

  group('NativePasskeyConfig', () {
    test('projectBaseUrl usa o host default da Swepay', () {
      const config = NativePasskeyConfig(projectId: 'proj_x');
      expect(
        config.projectBaseUrl,
        'https://api-passkey.swepay.com.br/v1/projects/proj_x',
      );
    });
  });
}

import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:native_passkey_flutter/src/api/passkey_api_client.dart';
import 'package:native_passkey_flutter/src/models/passkey_error.dart';

void main() {
  const base = 'https://api-passkey.swepay.com.br/v1/projects/proj_x';

  group('PasskeyApiClient', () {
    test('beginRegistration envia o body e parseia o DTO', () async {
      late http.Request captured;
      final mock = MockClient((req) async {
        captured = req;
        return http.Response(
          jsonEncode({
            'challengeId': 'ch_1',
            'challengeBase64Url': 'AAAA',
            'rpId': 'swepay.com.br',
            'rpName': 'Swepay',
            'userIdBase64Url': 'BBBB',
            'userDisplayName': 'Ada',
            'pubKeyCredParams': [-7, -257],
            'excludeCredentials': [],
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      final client = PasskeyApiClient(projectBaseUrl: base, httpClient: mock);

      final dto = await client.beginRegistration(
        externalUserId: 'user_1',
        userDisplayName: 'Ada',
        deviceName: 'iPhone',
      );

      expect(captured.url.toString(), '$base/passkey/register/begin');
      final body = jsonDecode(captured.body) as Map<String, dynamic>;
      expect(body['externalUserId'], 'user_1');
      expect(dto.challengeId, 'ch_1');
      expect(dto.pubKeyCredParams, [-7, -257]);
    });

    test('erro HTTP vira PasskeyError com o code do body', () async {
      final mock = MockClient((req) async {
        return http.Response(
          jsonEncode({'error': 'project_not_found'}),
          404,
          headers: {'content-type': 'application/json'},
        );
      });
      final client = PasskeyApiClient(projectBaseUrl: base, httpClient: mock);

      expect(
        () => client.beginAuthentication(),
        throwsA(
          isA<PasskeyError>().having(
            (e) => e.code,
            'code',
            PasskeyErrorCode.projectNotFound,
          ),
        ),
      );
    });

    test('falha de rede vira PasskeyError.networkError', () async {
      final mock = MockClient((req) async => throw Exception('socket'));
      final client = PasskeyApiClient(projectBaseUrl: base, httpClient: mock);

      expect(
        () => client.beginAuthentication(),
        throwsA(
          isA<PasskeyError>().having(
            (e) => e.code,
            'code',
            PasskeyErrorCode.networkError,
          ),
        ),
      );
    });
  });

  group('PasskeyApiClient — recuperação biométrica (SPEC-passkey-0002)', () {
    test('beginBiometricRecoveryRegistration envia o body e parseia o DTO',
        () async {
      late http.Request captured;
      final mock = MockClient((req) async {
        captured = req;
        return http.Response(
          jsonEncode({
            'recoveryGrantId': 'grant_1',
            'expiresInSeconds': 300,
            'challengeId': 'ch_1',
            'challengeBase64Url': 'AAAA',
            'rpId': 'swepay.com.br',
            'rpName': 'Swepay',
            'userIdBase64Url': 'BBBB',
            'userDisplayName': 'user_1',
            'pubKeyCredParams': [-7],
            'excludeCredentials': [],
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      final client = PasskeyApiClient(projectBaseUrl: base, httpClient: mock);

      final dto = await client.beginBiometricRecoveryRegistration(
        assertion: 'jws.compact.assertion',
      );

      expect(captured.url.toString(),
          '$base/passkey/recovery/biometric/registration-options');
      final body = jsonDecode(captured.body) as Map<String, dynamic>;
      expect(body, {'assertion': 'jws.compact.assertion'});
      expect(dto.recoveryGrantId, 'grant_1');
      expect(dto.expiresInSeconds, 300);
    });

    test(
        'erro problem+json (RFC 9457) vira PasskeyError com o slug final do type',
        () async {
      final mock = MockClient((req) async {
        return http.Response(
          jsonEncode({
            'type':
                'https://errors.swepay.com.br/passly/biometric-recovery/expired-assertion',
            'title': 'Expired Biometric Assertion',
            'status': 400,
            'detail': 'The biometric assertion has expired.',
          }),
          400,
          headers: {'content-type': 'application/problem+json'},
        );
      });
      final client = PasskeyApiClient(projectBaseUrl: base, httpClient: mock);

      expect(
        () => client.beginBiometricRecoveryRegistration(assertion: 'x'),
        throwsA(
          isA<PasskeyError>().having(
            (e) => e.code,
            'code',
            PasskeyErrorCode.expiredBiometricAssertion,
          ),
        ),
      );
    });

    test('finishRegistration inclui recoveryGrantId quando informado',
        () async {
      late http.Request captured;
      final mock = MockClient((req) async {
        captured = req;
        return http.Response(
          jsonEncode({'credentialId': 'cred_1', 'deviceName': 'iPhone'}),
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      final client = PasskeyApiClient(projectBaseUrl: base, httpClient: mock);

      await client.finishRegistration(
        externalUserId: 'user_1',
        challengeId: 'ch_1',
        clientDataJsonBase64Url: 'CCCC',
        attestationObjectBase64Url: 'DDDD',
        deviceName: 'iPhone recuperado',
        transports: const ['internal'],
        recoveryGrantId: 'grant_1',
      );

      final body = jsonDecode(captured.body) as Map<String, dynamic>;
      expect(body['recoveryGrantId'], 'grant_1');
    });

    test('finishRegistration omite recoveryGrantId quando ausente (default)',
        () async {
      late http.Request captured;
      final mock = MockClient((req) async {
        captured = req;
        return http.Response(
          jsonEncode({'credentialId': 'cred_1', 'deviceName': 'iPhone'}),
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      final client = PasskeyApiClient(projectBaseUrl: base, httpClient: mock);

      await client.finishRegistration(
        externalUserId: 'user_1',
        challengeId: 'ch_1',
        clientDataJsonBase64Url: 'CCCC',
        attestationObjectBase64Url: 'DDDD',
        deviceName: 'iPhone',
        transports: const ['internal'],
      );

      final body = jsonDecode(captured.body) as Map<String, dynamic>;
      expect(body.containsKey('recoveryGrantId'), isFalse);
    });
  });
}

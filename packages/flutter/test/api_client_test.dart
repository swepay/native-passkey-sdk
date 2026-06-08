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
}

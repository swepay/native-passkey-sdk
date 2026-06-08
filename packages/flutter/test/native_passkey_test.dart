import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:native_passkey_flutter/native_passkey_flutter.dart';
import 'package:native_passkey_flutter/src/api/passkey_api_client.dart';

/// Plataforma fake controlável para os testes do orquestrador híbrido.
class _FakePlatform extends NativePasskeyPlatform {
  _FakePlatform(
      {required this.available, this.createResponse, this.getResponse});

  final bool available;
  final Map<String, dynamic>? createResponse;
  final Map<String, dynamic>? getResponse;

  int createCalls = 0;
  int getCalls = 0;

  @override
  Future<bool> isPlatformAuthenticatorAvailable() async => available;

  @override
  Future<Map<String, dynamic>> createCredential(
      Map<String, dynamic> options) async {
    createCalls++;
    return createResponse!;
  }

  @override
  Future<Map<String, dynamic>> getCredential(
      Map<String, dynamic> options) async {
    getCalls++;
    return getResponse!;
  }
}

PasskeyApiClient _apiWith(Map<String, http.Response> routes) {
  final mock = MockClient((req) async {
    for (final entry in routes.entries) {
      if (req.url.path.endsWith(entry.key)) return entry.value;
    }
    return http.Response('{}', 404);
  });
  return PasskeyApiClient(
    projectBaseUrl: 'https://api-passkey.swepay.com.br/v1/projects/proj_x',
    httpClient: mock,
  );
}

http.Response _json(Object body) => http.Response(jsonEncode(body), 200,
    headers: {'content-type': 'application/json'});

void main() {
  group('NativePasskey híbrido', () {
    test('register usa o caminho nativo quando disponível', () async {
      final platform = _FakePlatform(
        available: true,
        createResponse: {
          'clientDataJsonBase64Url': 'CCCC',
          'attestationObjectBase64Url': 'DDDD',
          'transports': ['internal'],
        },
      );
      final api = _apiWith({
        '/passkey/register/begin': _json({
          'challengeId': 'ch_1',
          'challengeBase64Url': 'AAAA',
          'rpId': 'swepay.com.br',
          'rpName': 'Swepay',
          'userIdBase64Url': 'BBBB',
          'userDisplayName': 'Ada',
          'pubKeyCredParams': [-7],
          'excludeCredentials': [],
        }),
        '/passkey/register/finish': _json({
          'success': true,
          'credentialId': 'cred_1',
        }),
      });

      final passkey = NativePasskey(
        const NativePasskeyConfig(projectId: 'proj_x'),
        apiClient: api,
        platform: platform,
      );

      final result = await passkey.register(
        const RegisterPasskeyOptions(
          externalUserId: 'user_1',
          userDisplayName: 'Ada',
          deviceName: 'iPhone',
        ),
      );

      expect(result.success, isTrue);
      expect(result.credentialId, 'cred_1');
      expect(platform.createCalls, 1);
    });

    test('register sem nativo e sem fallback → unsupported', () async {
      final platform = _FakePlatform(available: false);
      final passkey = NativePasskey(
        const NativePasskeyConfig(projectId: 'proj_x'),
        apiClient: _apiWith({}),
        platform: platform,
      );

      final result = await passkey.register(
        const RegisterPasskeyOptions(
          externalUserId: 'user_1',
          userDisplayName: 'Ada',
          deviceName: 'iPhone',
        ),
      );

      expect(result.success, isFalse);
      expect(result.error?.code, PasskeyErrorCode.unsupported);
    });

    test('authenticate usa o caminho nativo e retorna o JWT', () async {
      final platform = _FakePlatform(
        available: true,
        getResponse: {
          'credentialIdBase64Url': 'cred',
          'clientDataJsonBase64Url': 'CCCC',
          'authenticatorDataBase64Url': 'EEEE',
          'signatureBase64Url': 'FFFF',
          'userHandleBase64Url': 'BBBB',
        },
      );
      final api = _apiWith({
        '/passkey/authenticate/begin': _json({
          'challengeId': 'ch_2',
          'challengeBase64Url': 'AAAA',
          'rpId': 'swepay.com.br',
          'allowCredentials': [],
        }),
        '/passkey/authenticate/finish': _json({
          'success': true,
          'assertionJwt': 'jwt.value',
          'externalUserId': 'user_1',
        }),
      });

      final passkey = NativePasskey(
        const NativePasskeyConfig(projectId: 'proj_x'),
        apiClient: api,
        platform: platform,
      );

      final result = await passkey.authenticate();

      expect(result.success, isTrue);
      expect(result.assertionJwt, 'jwt.value');
      expect(platform.getCalls, 1);
    });

    test('isAvailable reflete o autenticador de plataforma', () async {
      final passkey = NativePasskey(
        const NativePasskeyConfig(projectId: 'proj_x'),
        apiClient: _apiWith({}),
        platform: _FakePlatform(available: true),
      );
      final support = await passkey.isAvailable();
      expect(support.platformAuthenticatorAvailable, isTrue);
    });
  });
}

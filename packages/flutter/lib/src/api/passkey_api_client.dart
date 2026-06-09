import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/passkey_credential.dart';
import '../models/passkey_error.dart';
import 'dtos.dart';

/// Cliente HTTP de baixo nível para a API NativePasskey.
///
/// Espelha os endpoints usados por `NativePasskeyClient` (core TypeScript):
/// `begin`/`finish` de registro e autenticação, listagem e revogação.
class PasskeyApiClient {
  /// Cria o cliente apontando para [projectBaseUrl]
  /// (`{apiBaseUrl}/v1/projects/{projectId}`).
  PasskeyApiClient({required this.projectBaseUrl, http.Client? httpClient})
      : _http = httpClient ?? http.Client();

  /// Base completa dos endpoints do projeto.
  final String projectBaseUrl;

  final http.Client _http;

  /// Header de API key para operações de gestão de credenciais.
  static const String apiKeyHeader = 'X-NativePasskey-ApiKey';

  /// Inicia o registro de uma Passkey.
  Future<BeginRegistrationResponse> beginRegistration({
    required String externalUserId,
    required String userDisplayName,
    required String deviceName,
  }) async {
    final json = await _post('/passkey/register/begin', {
      'externalUserId': externalUserId,
      'userDisplayName': userDisplayName,
      'deviceName': deviceName,
    });
    return BeginRegistrationResponse.fromJson(json);
  }

  /// Finaliza o registro, enviando a attestation produzida pelo autenticador.
  Future<Map<String, dynamic>> finishRegistration({
    required String externalUserId,
    required String challengeId,
    required String clientDataJsonBase64Url,
    required String attestationObjectBase64Url,
    required String deviceName,
    required List<String> transports,
  }) {
    return _post('/passkey/register/finish', {
      'externalUserId': externalUserId,
      'challengeId': challengeId,
      'clientDataJsonBase64Url': clientDataJsonBase64Url,
      'attestationObjectBase64Url': attestationObjectBase64Url,
      'deviceName': deviceName,
      'transports': transports,
    });
  }

  /// Inicia a autenticação. `externalUserId` nulo = discoverable credential.
  Future<BeginAuthResponse> beginAuthentication(
      {String? externalUserId}) async {
    final json = await _post('/passkey/authenticate/begin', {
      'externalUserId': externalUserId,
    });
    return BeginAuthResponse.fromJson(json);
  }

  /// Finaliza a autenticação, enviando a assertion produzida pelo autenticador.
  Future<Map<String, dynamic>> finishAuthentication({
    required String challengeId,
    required String credentialIdBase64Url,
    required String clientDataJsonBase64Url,
    required String authenticatorDataBase64Url,
    required String signatureBase64Url,
    String? userHandleBase64Url,
  }) {
    return _post('/passkey/authenticate/finish', {
      'challengeId': challengeId,
      'credentialIdBase64Url': credentialIdBase64Url,
      'clientDataJsonBase64Url': clientDataJsonBase64Url,
      'authenticatorDataBase64Url': authenticatorDataBase64Url,
      'signatureBase64Url': signatureBase64Url,
      if (userHandleBase64Url != null)
        'userHandleBase64Url': userHandleBase64Url,
    });
  }

  /// Lista as credenciais de um usuário (requer [apiKey]).
  Future<List<PasskeyCredential>> listCredentials(
    String externalUserId,
    String apiKey,
  ) async {
    final uri = Uri.parse(
      '$projectBaseUrl/passkey/users/$externalUserId/credentials',
    );
    final res = await _send(
      () => _http.get(uri, headers: {apiKeyHeader: apiKey}),
    );
    _ensureOk(res);
    final list = jsonDecode(res.body) as List<dynamic>;
    return list
        .map((e) => PasskeyCredential.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  /// Revoga uma credencial específica de um usuário (requer [apiKey]).
  Future<void> revokeCredential(
    String externalUserId,
    String credentialId,
    String apiKey,
  ) async {
    final uri = Uri.parse(
      '$projectBaseUrl/passkey/users/$externalUserId/credentials/$credentialId',
    );
    final res = await _send(
      () => _http.delete(uri, headers: {apiKeyHeader: apiKey}),
    );
    _ensureOk(res);
  }

  /// Libera os recursos do cliente HTTP subjacente.
  void close() => _http.close();

  // ── Helpers ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> _post(String path, Object body) async {
    final res = await _send(
      () => _http.post(
        Uri.parse('$projectBaseUrl$path'),
        headers: const {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ),
    );
    _ensureOk(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<http.Response> _send(Future<http.Response> Function() request) async {
    try {
      return await request();
    } on PasskeyError {
      rethrow;
    } catch (err) {
      throw PasskeyError(PasskeyErrorCode.networkError, err.toString());
    }
  }

  void _ensureOk(http.Response res) {
    if (res.statusCode >= 200 && res.statusCode < 300) return;
    String? code;
    try {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      // Contrato atual: {"error":"<code>","details":"<code>"}.
      // Fallbacks p/ variações: ProblemDetails RFC7807 ({"code":...} ou
      // {"type":".../errors/<code>"}). Escolhe o 1º candidato que mapeia para
      // um código conhecido; senão, o 1º não-nulo (preserva o texto cru).
      final candidates = <String?>[
        body['error'] as String?,
        body['details'] as String?,
        body['code'] as String?,
        (body['type'] is String)
            ? (body['type'] as String).split('/').last
            : null,
      ];
      for (final c in candidates) {
        if (c != null &&
            PasskeyErrorCode.fromWire(c) != PasskeyErrorCode.unknownError) {
          code = c;
          break;
        }
      }
      code ??= candidates.firstWhere((c) => c != null, orElse: () => null);
    } catch (_) {
      // corpo não-JSON; mantém code nulo
    }
    throw PasskeyError(
      PasskeyErrorCode.fromWire(code),
      'HTTP ${res.statusCode}${code == null ? '' : ': $code'}',
    );
  }
}

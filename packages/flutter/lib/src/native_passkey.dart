import 'package:flutter/widgets.dart';

import 'api/dtos.dart';
import 'api/passkey_api_client.dart';
import 'models/authenticate_result.dart';
import 'models/options.dart';
import 'models/passkey_credential.dart';
import 'models/passkey_error.dart';
import 'models/passkey_support.dart';
import 'models/register_result.dart';
import 'native_passkey_config.dart';
import 'platform/native_passkey_platform_interface.dart';
import 'webview/passkey_webview.dart';

/// Cliente híbrido de Passkey (WebAuthn/FIDO2) para Flutter.
///
/// Estratégia: tenta a cerimônia **nativa** (Android Credential Manager /
/// iOS ASAuthorization) e, quando o autenticador de plataforma não está
/// disponível, recorre ao **fallback WebView** (se `webFallbackUrl` foi
/// configurado em [NativePasskeyConfig]).
///
/// A API espelha o `NativePasskeyClient` do pacote `@nativeguard/passkey`.
class NativePasskey {
  /// Cria o cliente a partir de uma [config].
  NativePasskey(this.config,
      {PasskeyApiClient? apiClient, NativePasskeyPlatform? platform})
      : _api = apiClient ??
            PasskeyApiClient(projectBaseUrl: config.projectBaseUrl),
        _platform = platform ?? NativePasskeyPlatform.instance;

  /// Configuração ativa.
  final NativePasskeyConfig config;

  final PasskeyApiClient _api;
  final NativePasskeyPlatform _platform;

  /// Detecta o suporte a Passkey no dispositivo atual.
  Future<PasskeySupport> isAvailable() async {
    final native = await _platform.isPlatformAuthenticatorAvailable();
    if (native) {
      return const PasskeySupport(
        available: true,
        platformAuthenticatorAvailable: true,
        biometricType: BiometricType.platform,
      );
    }
    // Sem autenticador nativo: ainda há suporte se houver fallback WebView.
    final hasFallback = config.webFallbackUrl != null;
    return PasskeySupport(
      available: hasFallback,
      platformAuthenticatorAvailable: false,
      biometricType: BiometricType.none,
    );
  }

  // ── Registro ───────────────────────────────────────────────────────────────

  /// Registra uma nova Passkey para o usuário.
  ///
  /// Fornça [context] para habilitar o fallback WebView quando o caminho nativo
  /// não estiver disponível.
  Future<RegisterResult> register(
    RegisterPasskeyOptions options, {
    BuildContext? context,
  }) async {
    try {
      final useNative = config.preferNative &&
          await _platform.isPlatformAuthenticatorAvailable();

      if (useNative) {
        return await _registerNative(options);
      }
      if (config.webFallbackUrl != null && context != null && context.mounted) {
        return await runRegisterWebViewFlow(
          context,
          url: config.webFallbackUrl!,
          externalUserId: options.externalUserId,
          userDisplayName: options.userDisplayName,
          deviceName: options.deviceName,
        );
      }
      return RegisterResult.failure(
        PasskeyError(PasskeyErrorCode.unsupported),
      );
    } on PasskeyError catch (err) {
      return RegisterResult.failure(err);
    }
  }

  Future<RegisterResult> _registerNative(RegisterPasskeyOptions options) async {
    final begin = await _api.beginRegistration(
      externalUserId: options.externalUserId,
      userDisplayName: options.userDisplayName,
      deviceName: options.deviceName,
    );

    final native = await _platform.createCredential(
      _toCreateOptions(begin, options.externalUserId),
    );

    final json = await _api.finishRegistration(
      externalUserId: options.externalUserId,
      challengeId: begin.challengeId,
      clientDataJsonBase64Url: native['clientDataJsonBase64Url'] as String,
      attestationObjectBase64Url:
          native['attestationObjectBase64Url'] as String,
      deviceName: options.deviceName,
      transports: (native['transports'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList(growable: false) ??
          const ['internal'],
    );
    return RegisterResult.fromJson(json);
  }

  // ── Autenticação ─────────────────────────────────────────────────────────

  /// Autentica o usuário com uma Passkey existente.
  ///
  /// Fornça [context] para habilitar o fallback WebView quando o caminho nativo
  /// não estiver disponível.
  Future<AuthenticateResult> authenticate({
    AuthenticateOptions options = const AuthenticateOptions(),
    BuildContext? context,
  }) async {
    try {
      final useNative = config.preferNative &&
          await _platform.isPlatformAuthenticatorAvailable();

      if (useNative) {
        return await _authenticateNative(options);
      }
      if (config.webFallbackUrl != null && context != null && context.mounted) {
        return await runAuthenticateWebViewFlow(
          context,
          url: config.webFallbackUrl!,
          externalUserId: options.externalUserId,
        );
      }
      return AuthenticateResult.failure(
        PasskeyError(PasskeyErrorCode.unsupported),
      );
    } on PasskeyError catch (err) {
      return AuthenticateResult.failure(err);
    }
  }

  Future<AuthenticateResult> _authenticateNative(
    AuthenticateOptions options,
  ) async {
    final begin = await _api.beginAuthentication(
      externalUserId: options.externalUserId,
    );

    final native = await _platform.getCredential(_toGetOptions(begin));

    final json = await _api.finishAuthentication(
      challengeId: begin.challengeId,
      credentialIdBase64Url: native['credentialIdBase64Url'] as String,
      clientDataJsonBase64Url: native['clientDataJsonBase64Url'] as String,
      authenticatorDataBase64Url:
          native['authenticatorDataBase64Url'] as String,
      signatureBase64Url: native['signatureBase64Url'] as String,
      userHandleBase64Url: native['userHandleBase64Url'] as String?,
    );
    return AuthenticateResult.fromJson(json);
  }

  // ── Gestão de credenciais ──────────────────────────────────────────────────

  /// Lista as credenciais de um usuário (requer [apiKey]).
  Future<List<PasskeyCredential>> listCredentials(
    String externalUserId,
    String apiKey,
  ) {
    return _api.listCredentials(externalUserId, apiKey);
  }

  /// Revoga uma credencial específica de um usuário (requer [apiKey]).
  Future<void> revokeCredential(
    String externalUserId,
    String credentialId,
    String apiKey,
  ) {
    return _api.revokeCredential(externalUserId, credentialId, apiKey);
  }

  /// Libera recursos (cliente HTTP).
  void dispose() => _api.close();

  // ── Mapeamento begin DTO → WebAuthn-JSON para a camada nativa ───────────────

  Map<String, dynamic> _toCreateOptions(
    BeginRegistrationResponse begin,
    String userName,
  ) {
    return <String, dynamic>{
      'challengeBase64Url': begin.challengeBase64Url,
      'rpId': begin.rpId,
      'rpName': begin.rpName,
      'userIdBase64Url': begin.userIdBase64Url,
      'userName': userName,
      'userDisplayName': begin.userDisplayName,
      'pubKeyCredParams': begin.pubKeyCredParams,
      'excludeCredentials': begin.excludeCredentials
          .map((c) => {
                'credentialIdBase64Url': c.credentialIdBase64Url,
                'transports': c.transports,
              })
          .toList(growable: false),
      'userVerification': 'required',
      'authenticatorAttachment': 'platform',
      'residentKey': 'preferred',
      'timeoutMs': 60000,
    };
  }

  Map<String, dynamic> _toGetOptions(BeginAuthResponse begin) {
    return <String, dynamic>{
      'challengeBase64Url': begin.challengeBase64Url,
      'rpId': begin.rpId,
      'allowCredentials': begin.allowCredentials
          .map((c) => {
                'credentialIdBase64Url': c.credentialIdBase64Url,
                'transports': c.transports,
              })
          .toList(growable: false),
      'userVerification': 'required',
      'timeoutMs': 60000,
    };
  }
}

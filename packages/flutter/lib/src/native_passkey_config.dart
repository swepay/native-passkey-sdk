/// Configuração do cliente [NativePasskey].
class NativePasskeyConfig {
  /// Cria a configuração do SDK.
  const NativePasskeyConfig({
    required this.projectId,
    this.apiBaseUrl = defaultApiBaseUrl,
    this.webFallbackUrl,
    this.preferNative = true,
  });

  /// Host padrão da API NativePasskey (Swepay / NativeGuard).
  static const String defaultApiBaseUrl = 'https://api-passkey.swepay.com.br';

  /// `projectId` do NativePasskey (ex.: `proj_abc123`).
  final String projectId;

  /// URL base da API. Default: [defaultApiBaseUrl].
  final String apiBaseUrl;

  /// URL do app web (Angular/React) usado no fallback WebView.
  ///
  /// Quando o autenticador de plataforma não está disponível e este valor é
  /// nulo, as operações falham com [PasskeyErrorCode.unsupported].
  final String? webFallbackUrl;

  /// Quando `true` (default), tenta a cerimônia WebAuthn nativa antes do WebView.
  final bool preferNative;

  /// Base completa dos endpoints do projeto: `{apiBaseUrl}/v1/projects/{projectId}`.
  String get projectBaseUrl => '$apiBaseUrl/v1/projects/$projectId';
}

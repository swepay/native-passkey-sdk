/// SDK Flutter híbrido de autenticação WebAuthn/FIDO2 (Passkey) do ecossistema
/// Swepay / NativeGuard.
///
/// Use [NativePasskey] com uma [NativePasskeyConfig] para registrar e autenticar
/// com Passkeys. O cliente tenta a cerimônia nativa (Android Credential Manager /
/// iOS ASAuthorization) e cai para WebView quando configurado.
library;

export 'src/native_passkey.dart';
export 'src/native_passkey_config.dart';
export 'src/models/authenticate_result.dart';
export 'src/models/options.dart';
export 'src/models/passkey_credential.dart';
export 'src/models/passkey_error.dart';
export 'src/models/passkey_support.dart';
export 'src/models/register_result.dart';
export 'src/webview/passkey_webview.dart'
    show PasskeyWebView, PasskeyWebViewMode;
export 'src/platform/native_passkey_platform_interface.dart'
    show NativePasskeyPlatform;

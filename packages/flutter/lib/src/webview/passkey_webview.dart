import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

import '../models/authenticate_result.dart';
import '../models/passkey_error.dart';
import '../models/register_result.dart';

/// Modo do fluxo executado dentro do WebView.
enum PasskeyWebViewMode {
  /// Registro de uma nova Passkey.
  register,

  /// Autenticação com uma Passkey existente.
  authenticate,
}

/// Widget que carrega o app web (Angular/React) num [InAppWebView] e faz a
/// bridge bidirecional JS ↔ Flutter para o fluxo de Passkey.
///
/// Usado como **fallback** quando o autenticador de plataforma nativo não está
/// disponível. O app web executa a cerimônia WebAuthn (incluindo `begin`/`finish`)
/// e devolve o resultado final pela `FlutterChannel`.
///
/// Protocolo da bridge (idêntico ao `FlutterBridgeService` do Angular):
/// - Web → Flutter: `window.flutter_inappwebview.callHandler('FlutterChannel', json)`
/// - Flutter → Web: `window.AngularChannel.postMessage(json)`
class PasskeyWebView extends StatefulWidget {
  /// Cria o widget de WebView.
  const PasskeyWebView({
    super.key,
    required this.url,
    required this.mode,
    required this.onResult,
    required this.onError,
    this.externalUserId,
    this.userDisplayName,
    this.deviceName,
  });

  /// URL do app web que hospeda a UI de Passkey.
  final String url;

  /// Modo do fluxo (registro ou autenticação).
  final PasskeyWebViewMode mode;

  /// Chamado quando o app web posta `passkey_registered`/`passkey_authenticated`.
  final void Function(Map<String, dynamic> payload) onResult;

  /// Chamado quando o app web posta `passkey_error` ou ocorre erro de carga.
  final void Function(PasskeyError error) onError;

  /// `externalUserId` repassado ao app web no init (opcional).
  final String? externalUserId;

  /// `userDisplayName` repassado ao app web no init (registro).
  final String? userDisplayName;

  /// `deviceName` repassado ao app web no init (registro).
  final String? deviceName;

  @override
  State<PasskeyWebView> createState() => _PasskeyWebViewState();
}

class _PasskeyWebViewState extends State<PasskeyWebView> {
  InAppWebViewController? _ctrl;

  @override
  Widget build(BuildContext context) {
    return InAppWebView(
      initialUrlRequest: URLRequest(url: WebUri(widget.url)),
      initialSettings: InAppWebViewSettings(
        javaScriptEnabled: true,
        allowsInlineMediaPlayback: true,
        javaScriptCanOpenWindowsAutomatically: true,
        // Identifica o contexto Flutter para o app web (detecção de bridge).
        userAgent: 'Mozilla/5.0 FlutterWebView/1.0 NativePasskey',
      ),
      onWebViewCreated: (ctrl) {
        _ctrl = ctrl;
        ctrl.addJavaScriptHandler(
          handlerName: 'FlutterChannel',
          callback: _onChannelMessage,
        );
      },
      onLoadStop: (ctrl, _) => _sendInit(),
      onReceivedError: (ctrl, request, error) {
        if (request.isForMainFrame ?? false) {
          widget.onError(
            PasskeyError(PasskeyErrorCode.networkError, error.description),
          );
        }
      },
    );
  }

  void _onChannelMessage(List<dynamic> args) {
    if (args.isEmpty) return;
    final Map<String, dynamic> msg;
    try {
      msg = jsonDecode(args.first as String) as Map<String, dynamic>;
    } catch (_) {
      return;
    }
    final type = msg['type'] as String?;
    final payload = (msg['payload'] as Map?)?.cast<String, dynamic>() ?? {};
    switch (type) {
      case 'passkey_registered':
      case 'passkey_authenticated':
        widget.onResult(payload);
      case 'passkey_error':
        widget.onError(
          PasskeyError(
            PasskeyErrorCode.fromWire(payload['error'] as String?),
            payload['message'] as String?,
          ),
        );
    }
  }

  /// Posta a mensagem de init para o app web assim que a página carrega.
  Future<void> _sendInit() async {
    final init = jsonEncode({
      'type': 'passkey_init',
      'payload': {
        'mode': widget.mode.name,
        if (widget.externalUserId != null)
          'externalUserId': widget.externalUserId,
        if (widget.userDisplayName != null)
          'userDisplayName': widget.userDisplayName,
        if (widget.deviceName != null) 'deviceName': widget.deviceName,
      },
    });
    // `AngularChannel`/`PasskeyChannel` é instalado pelo SDK web ao detectar Flutter.
    await _ctrl?.evaluateJavascript(
      source:
          "window.AngularChannel && window.AngularChannel.postMessage(${jsonEncode(init)});"
          "window.PasskeyChannel && window.PasskeyChannel.postMessage(${jsonEncode(init)});",
    );
  }
}

/// Apresenta [PasskeyWebView] como rota modal e resolve com o resultado.
///
/// Empacota o fluxo WebView de registro num [RegisterResult].
Future<RegisterResult> runRegisterWebViewFlow(
  BuildContext context, {
  required String url,
  required String externalUserId,
  required String userDisplayName,
  required String deviceName,
}) async {
  final payload = await _presentWebView(
    context,
    url: url,
    mode: PasskeyWebViewMode.register,
    externalUserId: externalUserId,
    userDisplayName: userDisplayName,
    deviceName: deviceName,
  );
  if (payload == null) {
    return RegisterResult.failure(PasskeyError(PasskeyErrorCode.userCancelled));
  }
  if (payload is PasskeyError) return RegisterResult.failure(payload);
  return RegisterResult.fromJson({
    'success': true,
    ...(payload as Map<String, dynamic>),
  });
}

/// Apresenta [PasskeyWebView] como rota modal e resolve com o resultado.
///
/// Empacota o fluxo WebView de autenticação num [AuthenticateResult].
Future<AuthenticateResult> runAuthenticateWebViewFlow(
  BuildContext context, {
  required String url,
  String? externalUserId,
}) async {
  final payload = await _presentWebView(
    context,
    url: url,
    mode: PasskeyWebViewMode.authenticate,
    externalUserId: externalUserId,
  );
  if (payload == null) {
    return AuthenticateResult.failure(
      PasskeyError(PasskeyErrorCode.userCancelled),
    );
  }
  if (payload is PasskeyError) return AuthenticateResult.failure(payload);
  return AuthenticateResult.fromJson({
    'success': true,
    ...(payload as Map<String, dynamic>),
  });
}

/// Empurra a rota do WebView e completa com o payload (Map), um [PasskeyError]
/// ou `null` (usuário fechou a tela).
Future<Object?> _presentWebView(
  BuildContext context, {
  required String url,
  required PasskeyWebViewMode mode,
  String? externalUserId,
  String? userDisplayName,
  String? deviceName,
}) {
  final completer = Completer<Object?>();

  void finish(Object? value) {
    if (!completer.isCompleted) completer.complete(value);
  }

  Navigator.of(context)
      .push<void>(
        MaterialPageRoute(
          fullscreenDialog: true,
          builder: (routeContext) => Scaffold(
            appBar: AppBar(
              title: Text(
                mode == PasskeyWebViewMode.register
                    ? 'Registrar Passkey'
                    : 'Entrar com Passkey',
              ),
              leading: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(routeContext).maybePop(),
              ),
            ),
            body: PasskeyWebView(
              url: url,
              mode: mode,
              externalUserId: externalUserId,
              userDisplayName: userDisplayName,
              deviceName: deviceName,
              onResult: (payload) {
                finish(payload);
                Navigator.of(routeContext).maybePop();
              },
              onError: (error) {
                finish(error);
                Navigator.of(routeContext).maybePop();
              },
            ),
          ),
        ),
      )
      .then((_) => finish(null)); // fechou sem resultado

  return completer.future;
}

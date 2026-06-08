import 'package:flutter/material.dart';
import 'package:native_passkey_flutter/native_passkey_flutter.dart';

void main() => runApp(const ExampleApp());

/// App de demonstração do `native_passkey_flutter`.
class ExampleApp extends StatelessWidget {
  /// Cria o app de exemplo.
  const ExampleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NativePasskey Example',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.indigo),
      home: const HomePage(),
    );
  }
}

/// Tela inicial com botões de registro e autenticação.
class HomePage extends StatefulWidget {
  /// Cria a tela inicial.
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  // Substitua pelos valores reais do seu projeto NativePasskey.
  final NativePasskey _passkey = NativePasskey(
    const NativePasskeyConfig(
      projectId: 'proj_demo',
      // Default: https://api-passkey.swepay.com.br
      webFallbackUrl: 'https://sso.swepay.com.br/passkey',
    ),
  );

  String _status = 'Pronto.';

  @override
  void dispose() {
    _passkey.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    setState(() => _status = 'Registrando…');
    final result = await _passkey.register(
      const RegisterPasskeyOptions(
        externalUserId: 'user_123',
        userDisplayName: 'Ada Lovelace',
        deviceName: 'Meu dispositivo',
      ),
      context: context,
    );
    setState(() {
      _status = result.success
          ? 'Registrado: ${result.credentialId}'
          : 'Falha: ${result.error?.code.wireValue}';
    });
  }

  Future<void> _authenticate() async {
    setState(() => _status = 'Autenticando…');
    final result = await _passkey.authenticate(context: context);
    setState(() {
      _status = result.success
          ? 'JWT: ${result.assertionJwt?.substring(0, 16)}…'
          : 'Falha: ${result.error?.code.wireValue}';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('NativePasskey')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FilledButton.icon(
              onPressed: _register,
              icon: const Icon(Icons.fingerprint),
              label: const Text('Registrar Passkey'),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _authenticate,
              icon: const Icon(Icons.login),
              label: const Text('Entrar com Passkey'),
            ),
            const SizedBox(height: 32),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(_status, textAlign: TextAlign.center),
            ),
          ],
        ),
      ),
    );
  }
}

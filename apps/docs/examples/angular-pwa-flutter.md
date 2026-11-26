# Angular PWA + Flutter WebView — Tutorial Completo

## O que você vai construir

Um app Flutter que autentica o usuário com passkey:

- Em aparelhos com autenticador de plataforma (Android 9+ / iOS 16+), a
  cerimônia é **nativa** (Credential Manager / ASAuthorization).
- Nos demais, o Flutter abre o seu **Angular PWA** num WebView. O Angular
  executa a cerimônia WebAuthn e devolve o resultado ao Flutter pela ponte
  `FlutterChannel`.

Nos dois casos, o Flutter recebe o mesmo `AuthenticateResult` e navega para a
próxima tela.

```
Usuário toca "Entrar"
        │
        ▼
NativePasskey.authenticate(context)
        │
        ├── nativo disponível ──▶ Credential Manager / ASAuthorization ──▶ AuthenticateResult
        │
        └── sem nativo ──▶ PasskeyWebView carrega o Angular PWA (/passkey)
                              │  Flutter → Angular: passkey_init { mode: "authenticate" }
                              │  Angular: NativePasskeyService.authenticateWithPasskey()
                              │  Angular → Flutter: passkey_authenticated { assertionJwt }
                              ▼
                         AuthenticateResult
        │
        ▼
Flutter envia o assertionJwt ao seu backend e abre a tela inicial
```

## Pré-requisitos

- Node.js 20+ e Angular CLI 21
- Flutter `>=3.19.0`
- Um `projectId` do NativePasskey
- O Angular PWA publicado em HTTPS, no domínio do RP ID do projeto, com a
  origem cadastrada no projeto
- Backend NativePasskey: `https://api-passkey.swepay.com.br`
- Android e iOS configurados conforme [Setup Android/iOS](/flutter/setup)

## Passo 1: Instalação

### Angular

```bash
ng new passkey-pwa --routing --style=css
cd passkey-pwa
ng add @angular/pwa
pnpm add @swepay/native-passly-angular @swepay/native-passly-sdk
```

### Flutter

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  native_passkey_flutter: ^0.1.2
  http: ^1.2.0
```

## Passo 2: Configuração do Angular

O `NativePasskeyService` precisa de `configure()`. Aproveite o mesmo
inicializador para começar a ouvir a mensagem `passkey_init` do Flutter — ela
chega logo após o carregamento da página.

```typescript
// src/app/flutter-init.store.ts
import { Injectable, inject, signal } from '@angular/core';
import { FlutterBridgeService, type FlutterBridgeMessage } from '@swepay/native-passly-angular';

export interface PasskeyInitPayload {
  mode: 'register' | 'authenticate';
  externalUserId?: string;
  userDisplayName?: string;
  deviceName?: string;
}

// `passkey_init` não faz parte do tipo FlutterBridgeMessage['type'].
const PASSKEY_INIT = 'passkey_init' as unknown as FlutterBridgeMessage['type'];

@Injectable({ providedIn: 'root' })
export class FlutterInitStore {
  readonly init = signal<PasskeyInitPayload | null>(null);

  constructor() {
    inject(FlutterBridgeService)
      .on<PasskeyInitPayload>(PASSKEY_INIT)
      .subscribe((payload) => this.init.set(payload));
  }
}
```

```typescript
// src/app/app.config.ts
import { ApplicationConfig, inject, isDevMode, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { NativePasskeyService } from '@swepay/native-passly-angular';
import { FlutterInitStore } from './flutter-init.store';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAppInitializer(() => {
      inject(NativePasskeyService).configure({
        projectId: 'proj_xxx',
        apiBaseUrl: 'https://api-passkey.swepay.com.br',
      });
      inject(FlutterInitStore); // começa a ouvir o passkey_init
    }),
  ],
};
```

```typescript
// src/app/app.routes.ts
import type { Routes } from '@angular/router';
import { PasskeyPageComponent } from './passkey-page.component';

export const routes: Routes = [{ path: 'passkey', component: PasskeyPageComponent }];
```

## Passo 3: Primeiro registro e autenticação (Angular)

A página `/passkey` mostra o botão certo para o `mode` pedido pelo Flutter.
Fora do Flutter (PWA no navegador), mostra o botão de login.

O `NativePasskeyService` envia `passkey_registered`, `passkey_authenticated` ou
`passkey_error` ao Flutter **automaticamente** quando a operação resolve. O
componente só precisa tratar as exceções, que o serviço não repassa.

```typescript
// src/app/passkey-page.component.ts
import { Component, computed, inject, signal } from '@angular/core';
import {
  FlutterBridgeService,
  NativePasskeyService,
  PasskeyError,
} from '@swepay/native-passly-angular';
import { FlutterInitStore } from './flutter-init.store';

@Component({
  selector: 'app-passkey-page',
  standalone: true,
  template: `
    @if (mode() === 'register') {
      <button type="button" [disabled]="loading()" (click)="register()">
        Ativar biometria
      </button>
    } @else {
      <button type="button" [disabled]="loading()" (click)="login()">
        Entrar com biometria
      </button>
    }
    @if (errorCode()) {
      <p role="alert">Não foi possível concluir ({{ errorCode() }}).</p>
    }
  `,
})
export class PasskeyPageComponent {
  private readonly passkey = inject(NativePasskeyService);
  private readonly bridge = inject(FlutterBridgeService);
  private readonly initStore = inject(FlutterInitStore);

  readonly mode = computed(() => this.initStore.init()?.mode ?? 'authenticate');
  readonly loading = signal(false);
  readonly errorCode = signal<string | null>(null);

  async login(): Promise<void> {
    await this.run(async () => {
      const init = this.initStore.init();
      const result = await this.passkey.authenticateWithPasskey({
        externalUserId: init?.externalUserId,
      });
      // Dentro do Flutter, o resultado já foi enviado pela ponte.
      if (!this.bridge.isFlutterContext && result.success) {
        await fetch('/api/auth/passkey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assertionJwt: result.assertionJwt }),
        });
      }
      if (!result.success) this.errorCode.set(result.error?.code ?? 'unknown_error');
    });
  }

  async register(): Promise<void> {
    await this.run(async () => {
      const init = this.initStore.init();
      if (!init?.externalUserId || !init.userDisplayName || !init.deviceName) {
        throw new PasskeyError('invalid_request', 'Dados de registro ausentes');
      }
      const result = await this.passkey.registerPasskey({
        externalUserId: init.externalUserId,
        userDisplayName: init.userDisplayName,
        deviceName: init.deviceName,
      });
      if (!result.success) this.errorCode.set(result.error?.code ?? 'unknown_error');
    });
  }

  private async run(operation: () => Promise<void>): Promise<void> {
    this.loading.set(true);
    this.errorCode.set(null);
    try {
      await operation();
    } catch (error) {
      const code = error instanceof PasskeyError ? error.code : 'unknown_error';
      this.errorCode.set(code);
      // Exceções não são enviadas pelo serviço — avise o Flutter.
      this.bridge.sendToFlutter({ type: 'passkey_error', payload: { error: code } });
    } finally {
      this.loading.set(false);
    }
  }
}
```

::: tip Por que um botão, e não uma chamada automática?
Os navegadores exigem um gesto do usuário (toque) para abrir o prompt
biométrico em muitos cenários. Por isso a página espera o toque, mesmo dentro
do WebView.
:::

Publique o build (`ng build`) no domínio do RP ID, por exemplo
`https://app.exemplo.com.br/passkey`.

## Passo 4: Autenticação no Flutter

```dart
// lib/main.dart
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:native_passkey_flutter/native_passkey_flutter.dart';

void main() => runApp(const MaterialApp(home: LoginScreen()));

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final NativePasskey _passkey = NativePasskey(
    const NativePasskeyConfig(
      projectId: 'proj_xxx',
      // Fallback para aparelhos sem autenticador de plataforma.
      webFallbackUrl: 'https://app.exemplo.com.br/passkey',
    ),
  );

  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _passkey.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final result = await _passkey.authenticate(context: context);
    if (!mounted) return;

    if (!result.success) {
      setState(() {
        _loading = false;
        if (result.error?.code != PasskeyErrorCode.userCancelled) {
          _error = result.error?.code.wireValue;
        }
      });
      return;
    }

    // Valide o JWT no seu backend (ex.: Route Handler com PasskeyVerifier).
    final response = await http.post(
      Uri.parse('https://app.exemplo.com.br/api/auth/passkey'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'assertionJwt': result.assertionJwt}),
    );
    if (!mounted) return;

    if (response.statusCode == 200) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else {
      setState(() {
        _loading = false;
        _error = 'Login recusado pelo servidor';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Entrar')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            FilledButton.icon(
              onPressed: _loading ? null : _login,
              icon: const Icon(Icons.fingerprint),
              label: const Text('Entrar com passkey'),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text('Erro: $_error'),
              ),
          ],
        ),
      ),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Bem-vindo!')));
  }
}
```

### Registro a partir do Flutter

O registro segue o mesmo caminho. No fallback, o `passkey_init` leva
`mode: register` e os dados do usuário para a página Angular:

```dart
final result = await _passkey.register(
  const RegisterPasskeyOptions(
    externalUserId: 'user_123',
    userDisplayName: 'Ada Lovelace',
    deviceName: 'Celular da Ada',
  ),
  context: context,
);
```

## Passo 5: Tratamento de erros

| Onde | Sintoma | Causa |
|------|---------|-------|
| Flutter | `PasskeyErrorCode.userCancelled` | Usuário cancelou a biometria ou fechou a tela do WebView |
| Flutter | `PasskeyErrorCode.unsupported` | Sem nativo e sem `webFallbackUrl`/`context` |
| Flutter | `PasskeyErrorCode.networkError` | Sem conexão ou a página do PWA não carregou |
| Angular | `passkey_error` com `invalid_request` | `passkey_init` não chegou com os dados de registro |
| Flutter | `unknownError` vindo do WebView | Código que o Flutter não conhece — veja a [nota de recuperação](/reference/errors#flutter) |

## Resultado final

```
passkey-pwa/ (Angular)
└── src/app/
    ├── app.config.ts             ← configure() + FlutterInitStore
    ├── app.routes.ts             ← rota /passkey
    ├── flutter-init.store.ts     ← ouve passkey_init
    └── passkey-page.component.ts ← register/login + passkey_error em exceções

app_flutter/
└── lib/main.dart                 ← NativePasskey com webFallbackUrl
```

## Erros comuns

- **O WebView abre e fica parado.** O `passkey_init` só é entregue se
  `window.AngularChannel` já existir quando a página termina de carregar. O
  `FlutterBridgeService` instala esse objeto na primeira injeção — por isso o
  tutorial injeta o `FlutterInitStore` no `provideAppInitializer`. Mesmo assim,
  se o bootstrap do Angular terminar depois do evento de carregamento, a
  mensagem se perde; a página continua funcional no modo `authenticate`.
- **Registro falha com `invalid_request` no fallback.** O `passkey_init` não
  chegou (veja acima) e a página não tem os dados do usuário.
- **A tela do WebView não fecha após um erro do backend.** O serviço não envia
  nada quando o método rejeita. Mantenha o `catch` que chama `sendToFlutter`.
- **`TypeError: Cannot read properties of undefined`.** `configure()` não foi
  chamado antes do primeiro uso do serviço.
- **`origin_not_allowed`.** A origem do PWA não está cadastrada no projeto.

## Próximos passos

- [Ponte Flutter em detalhes](/angular/flutter-bridge)
- [Fallback WebView](/flutter/webview-fallback)
- [Setup Android/iOS](/flutter/setup)

# Setup

## Como a configuração funciona

O `NativePasskeyService` cria o seu `NativePasskeyClient` **somente** quando
você chama `configure(config)`. Antes disso, qualquer método que fale com a API
falha com `TypeError` (o cliente interno ainda não existe).

Existem três formas de chamar `configure`:

1. Você chama `configure()` na inicialização da aplicação (recomendado).
2. Os componentes [`npk-passkey-button`](/angular/components#passkeybuttoncomponent)
   e [`npk-passkey-manager`](/angular/components#passkeymanagercomponent) chamam
   `configure()` no `ngOnInit`, com os inputs `projectId` e `apiBaseUrl`.
3. Você chama `configure()` manualmente antes do primeiro uso.

::: warning `NativePasskeyModule.forRoot()` não configura o serviço
`forRoot(config)` registra `NativePasskeyService`, `FlutterBridgeService` e o
token `NATIVE_PASSKEY_CONFIG` com o seu `config`. Porém, na versão atual, o
serviço **não lê** esse token. Você ainda precisa chamar `configure()`.
:::

## Aplicação standalone (Angular 21)

`NativePasskeyService` e `FlutterBridgeService` são `providedIn: 'root'`. Você
não precisa importar o módulo. Basta configurar o serviço com
`provideAppInitializer`:

```typescript
// src/app/app.config.ts
import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NativePasskeyService } from '@swepay/native-passly-angular';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAppInitializer(() => {
      inject(NativePasskeyService).configure({
        projectId: 'proj_xxx',
        apiBaseUrl: 'https://api-passkey.swepay.com.br',
      });
    }),
  ],
};
```

```typescript
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
```

## Aplicação com NgModule

```typescript
// src/app/app.module.ts
import { NgModule, inject, provideAppInitializer } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  NativePasskeyModule,
  NativePasskeyService,
  type NativePasskeyConfig,
} from '@swepay/native-passly-angular';
import { AppComponent } from './app.component';

const passkeyConfig: NativePasskeyConfig = { projectId: 'proj_xxx' };

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, NativePasskeyModule.forRoot(passkeyConfig)],
  providers: [
    provideAppInitializer(() => {
      inject(NativePasskeyService).configure(passkeyConfig);
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

## `NativePasskeyModule.forRoot(config)`

**Parâmetros**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `config` | [`NativePasskeyConfig`](/core/types#nativepasskeyconfig) | ✅ | `projectId` e, opcionalmente, `apiBaseUrl` |

**Retorno**

`ModuleWithProviders<NativePasskeyModule>` com os providers
`NativePasskeyService`, `FlutterBridgeService` e
`{ provide: NATIVE_PASSKEY_CONFIG, useValue: config }`.

## `NATIVE_PASSKEY_CONFIG`

Token de injeção. Na versão atual é a **string** `'NATIVE_PASSKEY_CONFIG'`, não
um `InjectionToken`. Nenhuma classe da biblioteca o consome.

## Componentes e o serviço compartilhado

O serviço é um singleton. Quando um `npk-passkey-button` ou
`npk-passkey-manager` inicializa, ele chama `configure()` com os próprios inputs
e **substitui** a configuração global. Use o mesmo `projectId` em todos os
lugares da aplicação.

## Próximos passos

- [NativePasskeyService](/angular/service)
- [Componentes](/angular/components)

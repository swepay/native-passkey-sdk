// packages/angular/projects/passkey-angular/src/lib/native-passkey.config.ts
import { InjectionToken } from '@angular/core';
import type { NativePasskeyConfig } from '@swepay/native-passly-sdk';

/**
 * Configuração global do SDK, registrada por `NativePasskeyModule.forRoot(config)` e lida pelo
 * `NativePasskeyService` ao ser criado. Fica num arquivo próprio para o serviço poder importá-la
 * sem ciclo com o módulo.
 */
export const NATIVE_PASSKEY_CONFIG = new InjectionToken<NativePasskeyConfig>('NATIVE_PASSKEY_CONFIG');

// packages/angular/projects/passkey-angular/src/lib/native-passkey.module.ts
import { ModuleWithProviders, NgModule } from '@angular/core';
import type { NativePasskeyConfig } from '@nativeguard/passkey';
import { NativePasskeyService } from './services/native-passkey.service';
import { FlutterBridgeService } from './services/flutter-bridge.service';

export const NATIVE_PASSKEY_CONFIG = 'NATIVE_PASSKEY_CONFIG';

@NgModule({})
export class NativePasskeyModule {
  static forRoot(config: NativePasskeyConfig): ModuleWithProviders<NativePasskeyModule> {
    return {
      ngModule: NativePasskeyModule,
      providers: [
        NativePasskeyService,
        FlutterBridgeService,
        { provide: NATIVE_PASSKEY_CONFIG, useValue: config }
      ]
    };
  }
}

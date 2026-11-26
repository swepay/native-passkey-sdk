// packages/angular/projects/passkey-angular/src/lib/native-passkey.module.ts
import { ModuleWithProviders, NgModule } from '@angular/core';
import type { NativePasskeyConfig } from '@swepay/native-passly-sdk';
import { NativePasskeyService } from './services/native-passkey.service';
import { FlutterBridgeService } from './services/flutter-bridge.service';
import { NATIVE_PASSKEY_CONFIG } from './native-passkey.config';

export { NATIVE_PASSKEY_CONFIG };

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

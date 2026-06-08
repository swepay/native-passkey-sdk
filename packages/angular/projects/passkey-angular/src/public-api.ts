// packages/angular/projects/passkey-angular/src/public-api.ts

// Angular-specific
export { NativePasskeyModule, NATIVE_PASSKEY_CONFIG } from './lib/native-passkey.module';
export { NativePasskeyService } from './lib/services/native-passkey.service';
export { FlutterBridgeService } from './lib/services/flutter-bridge.service';
export { PasskeyButtonComponent } from './lib/components/passkey-button/passkey-button.component';
export { PasskeyManagerComponent } from './lib/components/passkey-manager/passkey-manager.component';
export type { FlutterBridgeMessage, FlutterChannelMessage } from './lib/services/flutter-bridge.service';
export type { PasskeyButtonMode } from './lib/components/passkey-button/passkey-button.component';
export { passkeySupportedGuard } from './lib/guards/passkey-supported.guard';

// Re-export do core — consumer instala apenas @nativeguard/passkey-angular
export { NativePasskeyClient, PasskeyError } from '@nativeguard/passkey';
export type {
  NativePasskeyConfig, RegisterPasskeyOptions, AuthenticateOptions,
  RegisterResult, AuthenticateResult, PasskeyCredential, PasskeySupport, PasskeyErrorCode
} from '@nativeguard/passkey';

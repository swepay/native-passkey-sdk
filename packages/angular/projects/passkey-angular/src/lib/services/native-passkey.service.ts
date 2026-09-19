// packages/angular/projects/passkey-angular/src/lib/services/native-passkey.service.ts
import { Injectable, inject } from '@angular/core';
import {
  NativePasskeyClient,
  type NativePasskeyConfig,
  type PasskeySupport,
  type RegisterPasskeyOptions,
  type RegisterResult,
  type RegisterWithRecoveryAssertionOptions,
  type AuthenticateOptions,
  type AuthenticateResult,
  type PasskeyCredential
} from '@nativeguard/passkey';
import { FlutterBridgeService } from './flutter-bridge.service';

@Injectable({ providedIn: 'root' })
export class NativePasskeyService {
  private client!: NativePasskeyClient;
  private readonly flutter = inject(FlutterBridgeService);

  configure(config: NativePasskeyConfig): void {
    this.client = new NativePasskeyClient(config);
  }

  checkBiometricSupport(): Promise<PasskeySupport> {
    return NativePasskeyClient.isAvailable();
  }

  async registerPasskey(options: RegisterPasskeyOptions): Promise<RegisterResult> {
    const result = await this.client.registerPasskey(options);
    this.flutter.sendToFlutter(
      result.success
        ? { type: 'passkey_registered', payload: { credentialId: result.credentialId, deviceName: result.deviceName } }
        : { type: 'passkey_error', payload: { error: result.error?.code } }
    );
    return result;
  }

  /**
   * Registra uma passkey nova a partir de uma asserção de recuperação biométrica
   * (SPEC-passkey-0002) — mesmo fluxo de `registerPasskey`, exposto para o caso em que o
   * usuário perdeu o único dispositivo e não tem outra forma de provar quem é.
   */
  async registerWithRecoveryAssertion(options: RegisterWithRecoveryAssertionOptions): Promise<RegisterResult> {
    const result = await this.client.registerWithRecoveryAssertion(options);
    this.flutter.sendToFlutter(
      result.success
        ? { type: 'passkey_registered', payload: { credentialId: result.credentialId, deviceName: result.deviceName } }
        : { type: 'passkey_error', payload: { error: result.error?.code } }
    );
    return result;
  }

  async authenticateWithPasskey(options?: AuthenticateOptions): Promise<AuthenticateResult> {
    const result = await this.client.authenticateWithPasskey(options);
    this.flutter.sendToFlutter(
      result.success
        ? { type: 'passkey_authenticated', payload: { assertionJwt: result.assertionJwt, externalUserId: result.externalUserId } }
        : { type: 'passkey_error', payload: { error: result.error?.code } }
    );
    return result;
  }

  listCredentials(externalUserId: string, apiKey: string): Promise<PasskeyCredential[]> {
    return this.client.listCredentials(externalUserId, apiKey);
  }

  revokeCredential(externalUserId: string, credentialId: string, apiKey: string): Promise<void> {
    return this.client.revokeCredential(externalUserId, credentialId, apiKey);
  }
}

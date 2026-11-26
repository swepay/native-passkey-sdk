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
} from '@swepay/native-passly-sdk';
import { FlutterBridgeService } from './flutter-bridge.service';
import { NATIVE_PASSKEY_CONFIG } from '../native-passkey.config';

@Injectable({ providedIn: 'root' })
export class NativePasskeyService {
  private clientInstance?: NativePasskeyClient;
  private readonly flutter = inject(FlutterBridgeService);

  constructor() {
    // Config de NativePasskeyModule.forRoot(config). Antes o token era registrado mas nunca lido,
    // e toda chamada falhava com TypeError até alguém chamar configure().
    const config = inject(NATIVE_PASSKEY_CONFIG, { optional: true });
    if (config) {
      this.configure(config);
    }
  }

  configure(config: NativePasskeyConfig): void {
    this.clientInstance = new NativePasskeyClient(config);
  }

  private get client(): NativePasskeyClient {
    if (!this.clientInstance) {
      throw new Error(
        'NativePasskeyService não está configurado: use NativePasskeyModule.forRoot(config) ' +
        'ou chame configure(config) antes de usar o serviço.'
      );
    }
    return this.clientInstance;
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

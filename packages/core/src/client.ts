// packages/core/src/client.ts
import { base64UrlToBuffer, bufferToBase64Url } from './utils/base64url';
import { detectPasskeySupport } from './utils/detection';
import type {
  AuthenticateOptions, AuthenticateResult, BeginAuthResponse,
  BeginRegistrationResponse, NativePasskeyConfig,
  PasskeyCredential, PasskeySupport,
  RegisterPasskeyOptions, RegisterResult
} from './types';
import { PasskeyError } from './types';

export class NativePasskeyClient {
  readonly projectId: string;
  private readonly baseUrl: string;

  constructor(config: NativePasskeyConfig) {
    this.projectId = config.projectId;
    this.baseUrl = `${config.apiBaseUrl ?? 'https://api-passkey.swepay.com.br'}/v1/projects/${config.projectId}`;
  }

  /** Detecta suporte biométrico no dispositivo atual. SSR-safe. */
  static isAvailable(): Promise<PasskeySupport> {
    return detectPasskeySupport();
  }

  // ── Registro ─────────────────────────────────────────────────────────────

  async registerPasskey(options: RegisterPasskeyOptions): Promise<RegisterResult> {
    const begin = await this.post<BeginRegistrationResponse>(
      '/passkey/register/begin',
      { externalUserId: options.externalUserId, userDisplayName: options.userDisplayName, deviceName: options.deviceName }
    );

    let credential: PublicKeyCredential;
    try {
      const raw = await navigator.credentials.create({
        publicKey: {
          challenge: base64UrlToBuffer(begin.challengeBase64Url),
          rp: { id: begin.rpId, name: begin.rpName },
          user: {
            id: base64UrlToBuffer(begin.userIdBase64Url),
            name: options.externalUserId,
            displayName: begin.userDisplayName
          },
          pubKeyCredParams: begin.pubKeyCredParams.map(alg => ({ type: 'public-key' as const, alg })),
          authenticatorSelection: {
            authenticatorAttachment: 'platform',  // biometria nativa — NUNCA cross-platform
            userVerification: 'required',          // obrigatório para Face ID / fingerprint
            residentKey: 'preferred'
          },
          attestation: 'none',
          timeout: 60_000,
          excludeCredentials: begin.excludeCredentials?.map(c => ({
            type: 'public-key' as const,
            id: base64UrlToBuffer(c.credentialIdBase64Url),
            transports: c.transports as AuthenticatorTransport[]
          })) ?? []
        }
      });
      credential = raw as PublicKeyCredential;
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') {
        return { success: false, error: new PasskeyError('user_cancelled') };
      }
      throw err;
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    return this.post<RegisterResult>('/passkey/register/finish', {
      externalUserId: options.externalUserId,
      challengeId: begin.challengeId,
      clientDataJsonBase64Url: bufferToBase64Url(response.clientDataJSON),
      attestationObjectBase64Url: bufferToBase64Url(response.attestationObject),
      deviceName: options.deviceName,
      transports: response.getTransports?.() ?? ['internal']
    });
  }

  // ── Autenticação ─────────────────────────────────────────────────────────

  async authenticateWithPasskey(options?: AuthenticateOptions): Promise<AuthenticateResult> {
    const begin = await this.post<BeginAuthResponse>(
      '/passkey/authenticate/begin',
      { externalUserId: options?.externalUserId ?? null }
    );

    let assertion: PublicKeyCredential;
    try {
      const raw = await navigator.credentials.get({
        publicKey: {
          challenge: base64UrlToBuffer(begin.challengeBase64Url),
          rpId: begin.rpId,
          userVerification: 'required',
          timeout: 60_000,
          allowCredentials: begin.allowCredentials?.map(c => ({
            type: 'public-key' as const,
            id: base64UrlToBuffer(c.credentialIdBase64Url),
            transports: c.transports as AuthenticatorTransport[]
          })) ?? []
        }
      });
      assertion = raw as PublicKeyCredential;
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') {
        return { success: false, error: new PasskeyError('user_cancelled') };
      }
      throw err;
    }

    const response = assertion.response as AuthenticatorAssertionResponse;
    return this.post<AuthenticateResult>('/passkey/authenticate/finish', {
      challengeId: begin.challengeId,
      credentialIdBase64Url: bufferToBase64Url(assertion.rawId),
      clientDataJsonBase64Url: bufferToBase64Url(response.clientDataJSON),
      authenticatorDataBase64Url: bufferToBase64Url(response.authenticatorData),
      signatureBase64Url: bufferToBase64Url(response.signature),
      userHandleBase64Url: response.userHandle ? bufferToBase64Url(response.userHandle) : undefined
    });
  }

  // ── Gestão de credenciais (requer X-NativePasskey-ApiKey) ─────────────────

  async listCredentials(externalUserId: string, apiKey: string): Promise<PasskeyCredential[]> {
    return this.get(`/passkey/users/${externalUserId}/credentials`, apiKey);
  }

  async revokeCredential(externalUserId: string, credentialId: string, apiKey: string): Promise<void> {
    await this.delete(`/passkey/users/${externalUserId}/credentials/${credentialId}`, apiKey);
  }

  // ── HTTP helpers ─────────────────────────────────────────────────────────

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new PasskeyError((err.error as any) ?? 'unknown_error', `HTTP ${res.status}: ${err.error}`);
    }
    return res.json() as Promise<T>;
  }

  private async get<T>(path: string, apiKey: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'X-NativePasskey-ApiKey': apiKey }
    });
    if (!res.ok) throw new PasskeyError('unknown_error', `HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  private async delete(path: string, apiKey: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: { 'X-NativePasskey-ApiKey': apiKey }
    });
    if (!res.ok) throw new PasskeyError('unknown_error', `HTTP ${res.status}`);
  }
}

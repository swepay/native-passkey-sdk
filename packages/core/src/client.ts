// packages/core/src/client.ts
import { base64UrlToBuffer, bufferToBase64Url } from './utils/base64url';
import { detectPasskeySupport } from './utils/detection';
import type {
  AuthenticateOptions, AuthenticateResult, BeginAuthResponse,
  BeginBiometricRecoveryRegistrationResponse, BeginRegistrationResponse,
  NativePasskeyConfig, PasskeyCredential, PasskeySupport,
  ProblemDetailsBody, RegisterPasskeyOptions,
  RegisterResult, RegisterWithRecoveryAssertionOptions
} from './types';
import { PasskeyError, type PasskeyErrorCode } from './types';

/**
 * SPEC-passkey-0002 — mapeia o slug final de um `type` RFC 9457
 * (`https://errors.swepay.com.br/passly/biometric-recovery/<slug>`) para o `PasskeyErrorCode`
 * correspondente. Endpoints legados do Passly continuam usando o contrato `{ error, details }`
 * (ver `post()`); só o fluxo novo de recuperação biométrica fala problem+json.
 */
const RECOVERY_PROBLEM_TYPE_TO_ERROR_CODE: Record<string, PasskeyErrorCode> = {
  'passly/biometric-recovery/disabled': 'biometric_recovery_disabled',
  'passly/biometric-recovery/invalid-assertion': 'invalid_biometric_assertion',
  'passly/biometric-recovery/expired-assertion': 'expired_biometric_assertion',
  'passly/biometric-recovery/replayed-assertion': 'replayed_biometric_assertion',
  'passly/biometric-recovery/purpose-mismatch': 'biometric_purpose_mismatch',
  'passly/biometric-recovery/unknown-user': 'unknown_biometric_user',
  'passly/biometric-recovery/invalid-recovery-grant': 'invalid_recovery_grant'
};

/** Remove o host do catálogo (`https://errors.swepay.com.br/`) e devolve só o slug do erro. */
function problemTypeToErrorCode(type: string): PasskeyErrorCode {
  const slug = type.replace(/^https?:\/\/[^/]+\//, '');
  return RECOVERY_PROBLEM_TYPE_TO_ERROR_CODE[slug] ?? 'unknown_error';
}

/** Parâmetros mínimos compartilhados por `register/begin` e `recovery/biometric/registration-options`. */
interface CreatablePasskeyOptions {
  challengeBase64Url: string;
  rpId: string;
  rpName: string;
  userIdBase64Url: string;
  userDisplayName: string;
  pubKeyCredParams: number[];
  excludeCredentials?: Array<{ credentialIdBase64Url: string; transports: string[] }>;
}

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
      credential = await this.createPasskeyCredential(begin, options.externalUserId);
    } catch (err) {
      if (err instanceof PasskeyError && err.code === 'user_cancelled') {
        return { success: false, error: err };
      }
      throw err;
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    const result = await this.post<RegisterResult>('/passkey/register/finish', {
      externalUserId: options.externalUserId,
      challengeId: begin.challengeId,
      clientDataJsonBase64Url: bufferToBase64Url(response.clientDataJSON),
      attestationObjectBase64Url: bufferToBase64Url(response.attestationObject),
      deviceName: options.deviceName,
      transports: response.getTransports?.() ?? ['internal']
    });
    // O backend responde 2xx sem campo `success`; sucesso = veio o credentialId.
    return { ...result, success: result.success ?? Boolean(result.credentialId) };
  }

  // ── Recuperação de conta por asserção biométrica (SPEC-passkey-0002) ───────

  /**
   * Registra uma passkey nova quando o usuário perdeu o único dispositivo e não tem mais
   * nenhuma forma de provar quem é para o app cliente. Troca uma asserção `purpose=Recovery`
   * do Native Biometrics (opaca — o Passly SDK nunca a decodifica) por um
   * `PasskeyRecoveryGrant` de uso único (5 min); o `externalUserId` é resolvido pelo backend a
   * partir da própria asserção verificada, nunca informado pelo chamador.
   */
  async registerWithRecoveryAssertion(
    options: RegisterWithRecoveryAssertionOptions
  ): Promise<RegisterResult> {
    const begin = await this.post<BeginBiometricRecoveryRegistrationResponse>(
      '/passkey/recovery/biometric/registration-options',
      { assertion: options.assertion }
    );

    // `userIdBase64Url` carrega os bytes UTF-8 do externalUserId que o backend resolveu da
    // asserção (ver BeginBiometricRecoveryRegistrationHandler) — decodificamos de volta em vez
    // de pedir esse dado ao chamador, que não tem como sabê-lo neste fluxo.
    const externalUserId = new TextDecoder().decode(base64UrlToBuffer(begin.userIdBase64Url));

    let credential: PublicKeyCredential;
    try {
      credential = await this.createPasskeyCredential(begin, externalUserId);
    } catch (err) {
      if (err instanceof PasskeyError && err.code === 'user_cancelled') {
        return { success: false, error: err };
      }
      throw err;
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    const result = await this.post<RegisterResult>('/passkey/register/finish', {
      externalUserId,
      challengeId: begin.challengeId,
      clientDataJsonBase64Url: bufferToBase64Url(response.clientDataJSON),
      attestationObjectBase64Url: bufferToBase64Url(response.attestationObject),
      deviceName: options.deviceName,
      transports: response.getTransports?.() ?? ['internal'],
      recoveryGrantId: begin.recoveryGrantId
    });
    return { ...result, success: result.success ?? Boolean(result.credentialId) };
  }

  /**
   * `navigator.credentials.create(...)` compartilhado por `registerPasskey` e
   * `registerWithRecoveryAssertion` — as duas cerimônias WebAuthn são idênticas; o que muda é
   * de onde vêm as opções (`register/begin` vs `recovery/biometric/registration-options`) e o
   * valor de `userName` (informado pelo chamador num caso, resolvido pelo backend no outro).
   */
  private async createPasskeyCredential(
    begin: CreatablePasskeyOptions,
    userName: string
  ): Promise<PublicKeyCredential> {
    try {
      const raw = await navigator.credentials.create({
        publicKey: {
          challenge: base64UrlToBuffer(begin.challengeBase64Url),
          rp: { id: begin.rpId, name: begin.rpName },
          user: {
            id: base64UrlToBuffer(begin.userIdBase64Url),
            name: userName,
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
      return raw as PublicKeyCredential;
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') {
        throw new PasskeyError('user_cancelled');
      }
      throw err;
    }
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
    const result = await this.post<AuthenticateResult>('/passkey/authenticate/finish', {
      challengeId: begin.challengeId,
      credentialIdBase64Url: bufferToBase64Url(assertion.rawId),
      clientDataJsonBase64Url: bufferToBase64Url(response.clientDataJSON),
      authenticatorDataBase64Url: bufferToBase64Url(response.authenticatorData),
      signatureBase64Url: bufferToBase64Url(response.signature),
      userHandleBase64Url: response.userHandle ? bufferToBase64Url(response.userHandle) : undefined
    });
    // O backend responde 2xx sem campo `success`; sucesso = veio o assertionJwt.
    return { ...result, success: result.success ?? Boolean(result.assertionJwt) };
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
      const err = await res.json().catch(() => ({})) as { error?: string } & Partial<ProblemDetailsBody>;
      // GS-04: endpoints novos (recovery biométrico) respondem application/problem+json
      // (`type`), diferente do contrato legado `{ error, details }` do resto da API.
      if (typeof err.type === 'string') {
        throw new PasskeyError(problemTypeToErrorCode(err.type), err.detail ?? `HTTP ${res.status}: ${err.type}`);
      }
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

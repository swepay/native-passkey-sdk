// packages/core/src/types.ts

export interface NativePasskeyConfig {
  /** projectId do NativePasskey (ex: "proj_abc123") */
  projectId: string;
  /** URL base da API. Default: "https://api-passkey.swepay.com.br" */
  apiBaseUrl?: string;
}

// ── Registro ──────────────────────────────────────────────────────────────────

export interface RegisterPasskeyOptions {
  externalUserId: string;
  userDisplayName: string;
  /** Label do dispositivo (ex: "iPhone 16 Pro") */
  deviceName: string;
}

export interface RegisterResult {
  success: boolean;
  credentialId?: string;
  deviceName?: string;
  registeredAt?: string;
  error?: PasskeyError;
}

// ── Autenticação ──────────────────────────────────────────────────────────────

export interface AuthenticateOptions {
  /** Omitir = discoverable credential flow (passkey puro, sem digitar usuário) */
  externalUserId?: string;
}

export interface AuthenticateResult {
  success: boolean;
  /**
   * JWT ES256 assinado com a chave do projeto.
   * Enviar ao backend do cliente para validar via JWKS e criar sessão.
   */
  assertionJwt?: string;
  externalUserId?: string;
  error?: PasskeyError;
}

// ── Credenciais ───────────────────────────────────────────────────────────────

export interface PasskeyCredential {
  credentialId: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt?: string;
  aaguid: string;
  transports: string[];
  isActive: boolean;
}

// ── Suporte de dispositivo ────────────────────────────────────────────────────

export interface PasskeySupport {
  /** false = não renderizar botão de biometria */
  available: boolean;
  /** Chrome 108+ / Safari 16.4+: autofill passkey (Conditional UI) */
  conditionalMediationAvailable: boolean;
  /** Tipo de biometria predominante no dispositivo */
  biometricType: 'face' | 'fingerprint' | 'platform' | 'none';
}

// ── Erros ─────────────────────────────────────────────────────────────────────

export type PasskeyErrorCode =
  | 'user_cancelled'
  | 'invalid_request'
  | 'invalid_client_data_json'
  | 'challenge_expired'
  | 'challenge_mismatch'
  | 'origin_not_allowed'
  | 'rp_id_hash_mismatch'
  | 'user_not_verified'
  | 'signature_verification_failed'
  | 'sign_count_replay_attack_detected'
  | 'credential_not_found_or_revoked'
  | 'credential_already_registered'
  | 'project_not_found'
  | 'network_error'
  | 'unknown_error';

export class PasskeyError extends Error {
  constructor(
    public readonly code: PasskeyErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'PasskeyError';
  }
}

// ── DTOs internos da API (não exportados na public API) ───────────────────────

export interface BeginRegistrationResponse {
  challengeId: string;
  challengeBase64Url: string;
  rpId: string;
  rpName: string;
  userIdBase64Url: string;
  userDisplayName: string;
  pubKeyCredParams: number[];
  excludeCredentials: Array<{ credentialIdBase64Url: string; transports: string[] }>;
}

export interface BeginAuthResponse {
  challengeId: string;
  challengeBase64Url: string;
  rpId: string;
  allowCredentials?: Array<{ credentialIdBase64Url: string; transports: string[] }>;
}

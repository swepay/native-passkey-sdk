// packages/react/src/server/PasskeyVerifier.ts
// Compatível com Edge Runtime (Vercel, Cloudflare Workers) — usa apenas `jose`

import { createRemoteJWKSet, jwtVerify } from 'jose';

interface AssertionClaims {
  sub: string;
  npk_cred_id: string;
  npk_project: string;
  npk_auth_method: 'webauthn';
  npk_user_verified: boolean;
  npk_aaguid: string;
}

export interface PasskeyVerifyResult {
  valid: boolean;
  externalUserId?: string;
  claims?: AssertionClaims;
  error?: string;
}

export class PasskeyVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(config: { projectId: string; apiBaseUrl?: string; audience: string }) {
    const base = config.apiBaseUrl ?? 'https://api-passkey.swepay.com.br';
    this.jwks = createRemoteJWKSet(
      new URL(`${base}/v1/projects/${config.projectId}/.well-known/jwks.json`),
      { cooldownDuration: 300_000 }  // cache JWKS por 5 minutos
    );
    this.issuer = `${base}/projects/${config.projectId}`;
    this.audience = config.audience;
  }

  async verify(assertionJwt: string): Promise<PasskeyVerifyResult> {
    try {
      const { payload } = await jwtVerify<AssertionClaims>(assertionJwt, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['ES256'],
        requiredClaims: ['sub', 'npk_cred_id', 'npk_project', 'npk_user_verified']
      });
      if (!payload.npk_user_verified) return { valid: false, error: 'user_not_verified' };
      return { valid: true, externalUserId: payload.sub, claims: payload };
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : 'jwt_verification_failed' };
    }
  }
}

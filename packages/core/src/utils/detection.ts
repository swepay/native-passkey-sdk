// packages/core/src/utils/detection.ts
import type { PasskeySupport } from '../types';

/**
 * Detecta suporte WebAuthn + platform authenticator.
 * SSR-safe: retorna { available: false } se window não existir.
 */
export async function detectPasskeySupport(): Promise<PasskeySupport> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { available: false, conditionalMediationAvailable: false, biometricType: 'none' };
  }

  const [platformAvailable, conditionalAvailable] = await Promise.all([
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
    // Conditional UI (autofill passkey) — Chrome 108+, Safari 16.4+
    (PublicKeyCredential as any).isConditionalMediationAvailable?.() ?? Promise.resolve(false)
  ]);

  if (!platformAvailable) {
    return { available: false, conditionalMediationAvailable: false, biometricType: 'none' };
  }

  return {
    available: true,
    conditionalMediationAvailable: conditionalAvailable as boolean,
    biometricType: detectBiometricType()
  };
}

function detectBiometricType(): PasskeySupport['biometricType'] {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'face';        // Face ID
  if (/Android/.test(ua)) return 'fingerprint';           // Android Biometric
  return 'platform';                                       // Windows Hello / macOS Touch ID
}

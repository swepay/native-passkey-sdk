// packages/core/src/utils/detection.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectPasskeySupport } from './detection';

describe('detectPasskeySupport', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('SSR (sem window) retorna indisponível', async () => {
    // Arrange
    vi.stubGlobal('window', undefined);

    // Act
    const result = await detectPasskeySupport();

    // Assert
    expect(result).toEqual({ available: false, conditionalMediationAvailable: false, biometricType: 'none' });
  });

  it('window sem PublicKeyCredential retorna indisponível', async () => {
    // Arrange
    vi.stubGlobal('window', {});

    // Act
    const result = await detectPasskeySupport();

    // Assert
    expect(result.available).toBe(false);
  });

  it('sem platform authenticator disponível retorna indisponível', async () => {
    // Arrange
    const publicKeyCredential = {
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(false)
    };
    vi.stubGlobal('window', { PublicKeyCredential: publicKeyCredential });
    vi.stubGlobal('PublicKeyCredential', publicKeyCredential);

    // Act
    const result = await detectPasskeySupport();

    // Assert
    expect(result).toEqual({ available: false, conditionalMediationAvailable: false, biometricType: 'none' });
  });

  it('iPhone com conditional mediation disponível detecta Face ID', async () => {
    // Arrange
    const publicKeyCredential = {
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
      isConditionalMediationAvailable: vi.fn().mockResolvedValue(true)
    };
    vi.stubGlobal('window', { PublicKeyCredential: publicKeyCredential });
    vi.stubGlobal('PublicKeyCredential', publicKeyCredential);
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' });

    // Act
    const result = await detectPasskeySupport();

    // Assert
    expect(result).toEqual({ available: true, conditionalMediationAvailable: true, biometricType: 'face' });
  });

  it('Android sem conditional mediation detecta fingerprint', async () => {
    // Arrange — isConditionalMediationAvailable ausente (navegador mais antigo)
    const publicKeyCredential = {
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true)
    };
    vi.stubGlobal('window', { PublicKeyCredential: publicKeyCredential });
    vi.stubGlobal('PublicKeyCredential', publicKeyCredential);
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 14)' });

    // Act
    const result = await detectPasskeySupport();

    // Assert
    expect(result).toEqual({ available: true, conditionalMediationAvailable: false, biometricType: 'fingerprint' });
  });

  it('desktop (Windows Hello / Touch ID) detecta biometricType platform', async () => {
    // Arrange
    const publicKeyCredential = {
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
      isConditionalMediationAvailable: vi.fn().mockResolvedValue(false)
    };
    vi.stubGlobal('window', { PublicKeyCredential: publicKeyCredential });
    vi.stubGlobal('PublicKeyCredential', publicKeyCredential);
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' });

    // Act
    const result = await detectPasskeySupport();

    // Assert
    expect(result.biometricType).toBe('platform');
  });
});

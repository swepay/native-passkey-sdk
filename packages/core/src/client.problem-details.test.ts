// packages/core/src/client.problem-details.test.ts
// Adversarial: um corpo application/problem+json hostil (HTML em detail/title,
// type/instance com scheme javascript:) tem de virar string inerte no PasskeyError.
// O core é headless (nenhum layer de renderização), então o contrato é: `detail`
// é exposto como texto puro e `type`/`instance` nunca viram navegação/href.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NativePasskeyClient } from './client';
import { PasskeyError } from './types';

const XSS_DETAIL = '<img src=x onerror="window.__xss=1">';
const XSS_TITLE = '<b>bold</b>';

function problemResponse(status = 400): Response {
  return {
    ok: false,
    status,
    json: async () => ({
      type: 'https://errors.swepay.com.br/passly/biometric-recovery/disabled',
      title: XSS_TITLE,
      status,
      detail: XSS_DETAIL,
      instance: 'javascript:alert(1)',
      traceId: 'trace-1'
    })
  } as Response;
}

describe('NativePasskeyClient — problem+json hostil', () => {
  let openSpy: ReturnType<typeof vi.fn>;
  let hrefSetter: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openSpy = vi.fn();
    hrefSetter = vi.fn();
    const location = Object.defineProperty(
      { assign: openSpy, replace: openSpy },
      'href',
      { set: hrefSetter, get: () => '' }
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(problemResponse()));
    vi.stubGlobal('open', openSpy);
    vi.stubGlobal('location', location);
    vi.stubGlobal('window', { open: openSpy, location, __xss: undefined });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detail é exposto como string literal (sem parse de HTML) e type/instance não geram navegação', async () => {
    // Arrange
    const client = new NativePasskeyClient({ projectId: 'proj_xss' });

    // Act
    const err = await client
      .registerWithRecoveryAssertion({ assertion: 'a.b.c', deviceName: 'd' })
      .then(() => null, (e: unknown) => e);

    // Assert — erro tipado, código mapeado do slug do `type`
    expect(err).toBeInstanceOf(PasskeyError);
    const passkeyErr = err as PasskeyError;
    expect(passkeyErr.code).toBe('biometric_recovery_disabled');

    // Assert — detail é texto puro, byte a byte igual ao que veio do servidor
    expect(typeof passkeyErr.message).toBe('string');
    expect(passkeyErr.message).toBe(XSS_DETAIL);

    // Assert — title/type/instance não são expostos como href/URL no objeto de erro
    const exposed = Object.getOwnPropertyNames(passkeyErr);
    expect(exposed).not.toContain('href');
    expect(exposed).not.toContain('instance');
    expect(exposed).not.toContain('type');
    expect(exposed).not.toContain('title');
    expect(JSON.stringify(passkeyErr)).not.toContain('javascript:');
    expect(JSON.stringify(passkeyErr)).not.toContain(XSS_TITLE);

    // Assert — nenhuma navegação/abertura de janela disparada a partir de type/instance
    expect(openSpy).not.toHaveBeenCalled();
    expect(hrefSetter).not.toHaveBeenCalled();
    expect((globalThis as any).window.__xss).toBeUndefined();
  });

  it('corpo legado { error } com HTML também vira string inerte', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 400, json: async () => ({ error: XSS_DETAIL })
    } as Response));
    const client = new NativePasskeyClient({ projectId: 'proj_xss' });

    // Act
    const err = await client.authenticateWithPasskey().then(() => null, (e: unknown) => e);

    // Assert
    expect(err).toBeInstanceOf(PasskeyError);
    expect((err as PasskeyError).message).toBe(`HTTP 400: ${XSS_DETAIL}`);
    expect(openSpy).not.toHaveBeenCalled();
  });
});

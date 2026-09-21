// packages/react/src/hooks/usePasskey.storage.test.tsx
// Adversarial: o fluxo de autenticação (assertion) ponta a ponta não pode persistir
// nada em localStorage / sessionStorage / document.cookie / IndexedDB (CWE-922).
import { act, renderHook } from '@testing-library/react';
import { faker } from '@faker-js/faker';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PasskeyProvider } from '../providers/PasskeyProvider';
import { usePasskey } from './usePasskey';

const config = { projectId: 'proj_storage_test' };

function wrapper({ children }: { children: React.ReactNode }) {
  return <PasskeyProvider config={config}>{children}</PasskeyProvider>;
}

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function b64url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

describe('usePasskey — nenhum segredo persiste no browser', () => {
  const signatureText = `sig-${faker.string.alphanumeric(24)}`;
  const clientDataText = JSON.stringify({ type: 'webauthn.get', challenge: faker.string.alphanumeric(32) });
  const assertionJwt = `${b64url('{"alg":"ES256"}')}.${b64url(`{"sub":"${faker.string.uuid()}"}`)}.${faker.string.alphanumeric(43)}`;
  const secrets = [signatureText, b64url(signatureText), clientDataText, b64url(clientDataText), assertionJwt];

  let setItemSpy: ReturnType<typeof vi.spyOn>;
  let cookieSetter: ReturnType<typeof vi.fn>;
  let idbOpen: ReturnType<typeof vi.fn>;
  let fetchMock: ReturnType<typeof vi.fn>;
  let getCredentialMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    cookieSetter = vi.fn();
    Object.defineProperty(document, 'cookie', { configurable: true, get: () => '', set: cookieSetter });
    idbOpen = vi.fn();
    vi.stubGlobal('indexedDB', { open: idbOpen });

    fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        challengeId: faker.string.uuid(),
        challengeBase64Url: b64url(faker.string.alphanumeric(32)),
        rpId: 'swepay.com.br',
        allowCredentials: []
      }))
      .mockResolvedValueOnce(jsonResponse({ assertionJwt, externalUserId: faker.string.uuid() }));
    vi.stubGlobal('fetch', fetchMock);

    getCredentialMock = vi.fn().mockResolvedValue({
      id: faker.string.uuid(),
      rawId: new TextEncoder().encode(faker.string.uuid()).buffer,
      type: 'public-key',
      response: {
        clientDataJSON: new TextEncoder().encode(clientDataText).buffer,
        authenticatorData: new TextEncoder().encode('authenticator-data').buffer,
        signature: new TextEncoder().encode(signatureText).buffer,
        userHandle: null
      }
    });
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { get: getCredentialMock, create: vi.fn() }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (document as any).cookie;
  });

  it('authenticate ponta a ponta: zero escritas em Storage/cookie/IndexedDB e hook não retém o token', async () => {
    // Arrange
    const { result, unmount } = renderHook(() => usePasskey(), { wrapper });

    // Act
    let outcome: Awaited<ReturnType<typeof result.current.authenticate>> | undefined;
    await act(async () => {
      outcome = await result.current.authenticate();
    });

    // Assert — o fluxo realmente rodou (não é um falso positivo por curto-circuito)
    expect(getCredentialMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(outcome?.success).toBe(true);
    expect(outcome?.assertionJwt).toBe(assertionJwt);

    // Assert — nenhuma persistência no browser
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(cookieSetter).not.toHaveBeenCalled();
    expect(idbOpen).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);

    // Assert — o token/assinatura não aparecem em nenhum argumento de persistência
    const persistedArgs = [...setItemSpy.mock.calls, ...cookieSetter.mock.calls, ...idbOpen.mock.calls].flat().map(String);
    for (const secret of secrets) {
      expect(persistedArgs.some(arg => arg.includes(secret))).toBe(false);
    }

    // Assert — o material só vai para o backend (corpo do POST /finish), nunca para a URL
    const [finishUrl, finishInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(finishUrl).toMatch(/\/passkey\/authenticate\/finish$/);
    expect(finishUrl).not.toContain(b64url(signatureText));
    expect(String(finishInit.body)).toContain(b64url(signatureText));
    expect(String(finishInit.body)).toContain(b64url(clientDataText));

    // Assert — o hook não guarda o assertionJwt em state (só isLoading/error)
    expect(Object.keys(result.current).sort()).toEqual(
      ['authenticate', 'clearError', 'error', 'isLoading', 'register', 'registerWithRecoveryAssertion']
    );
    expect(JSON.stringify(result.current)).not.toContain(assertionJwt);

    unmount();
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(cookieSetter).not.toHaveBeenCalled();
  });
});

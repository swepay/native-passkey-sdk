// packages/react/src/providers/PasskeyProvider.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { NativePasskeyClient } from '@nativeguard/passkey';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { PasskeyProvider, usePasskeyContext } from './PasskeyProvider';

const config = { projectId: 'proj_test123' };

function wrapper({ children }: { children: React.ReactNode }) {
  return <PasskeyProvider config={config}>{children}</PasskeyProvider>;
}

describe('PasskeyProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('expõe um NativePasskeyClient configurado com o projectId recebido', async () => {
    const { result } = renderHook(() => usePasskeyContext(), { wrapper });

    expect(result.current.client).toBeInstanceOf(NativePasskeyClient);
    expect(result.current.client.projectId).toBe(config.projectId);

    // aguarda a detecção assíncrona de suporte para não deixar o efeito pendente
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('inicia com isLoading=true e resolve support após detectar suporte (SSR-safe, sem window.PublicKeyCredential)', async () => {
    const { result } = renderHook(() => usePasskeyContext(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // jsdom não expõe window.PublicKeyCredential — detecção deve degradar graciosamente
    expect(result.current.support).toEqual({
      available: false,
      conditionalMediationAvailable: false,
      biometricType: 'none'
    });
  });

  it('usePasskeyContext lança quando usado fora de <PasskeyProvider>', () => {
    expect(() => renderHook(() => usePasskeyContext())).toThrow(
      'usePasskeyContext must be inside <PasskeyProvider>'
    );
  });
});

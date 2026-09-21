// packages/react/src/hooks/usePasskey.test.tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { faker } from '@faker-js/faker';
import { NativePasskeyClient, PasskeyError } from '@nativeguard/passkey';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PasskeyProvider } from '../providers/PasskeyProvider';
import { usePasskey } from './usePasskey';

const config = { projectId: 'proj_test123' };

function wrapper({ children }: { children: React.ReactNode }) {
  return <PasskeyProvider config={config}>{children}</PasskeyProvider>;
}

describe('usePasskey', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('authenticate: delega ao NativePasskeyClient e devolve o resultado de sucesso', async () => {
    const assertionJwt = faker.string.alphanumeric(64);
    vi.spyOn(NativePasskeyClient.prototype, 'authenticateWithPasskey').mockResolvedValueOnce({
      success: true,
      assertionJwt
    });

    const { result } = renderHook(() => usePasskey(), { wrapper });

    let outcome;
    await act(async () => {
      outcome = await result.current.authenticate();
    });

    expect(outcome).toEqual({ success: true, assertionJwt });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('authenticate: propaga o erro de negócio retornado pelo client sem lançar exceção', async () => {
    const error = new PasskeyError('invalid_biometric_assertion', 'assertion recusada');
    vi.spyOn(NativePasskeyClient.prototype, 'authenticateWithPasskey').mockResolvedValueOnce({
      success: false,
      error
    });

    const { result } = renderHook(() => usePasskey(), { wrapper });

    let outcome;
    await act(async () => {
      outcome = await result.current.authenticate();
    });

    expect(outcome).toEqual({ success: false, error });
    expect(result.current.error).toBe(error);
  });

  it('authenticate: repropaga PasskeyError lançado pelo client sem reembrulhar', async () => {
    const thrown = new PasskeyError('invalid_biometric_assertion', 'biometria inválida');
    vi.spyOn(NativePasskeyClient.prototype, 'authenticateWithPasskey').mockRejectedValueOnce(thrown);

    const { result } = renderHook(() => usePasskey(), { wrapper });

    let outcome;
    await act(async () => {
      outcome = await result.current.authenticate();
    });

    expect(outcome).toEqual({ success: false, error: thrown });
    expect(result.current.error).toBe(thrown);
  });

  it('authenticate: captura exceção inesperada e expõe via error/clearError', async () => {
    vi.spyOn(NativePasskeyClient.prototype, 'authenticateWithPasskey').mockRejectedValueOnce(
      new Error('network down')
    );

    const { result } = renderHook(() => usePasskey(), { wrapper });

    await act(async () => {
      await result.current.authenticate();
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toBeInstanceOf(PasskeyError);
    expect(result.current.error?.code).toBe('unknown_error');

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('register: seta isLoading durante a chamada e limpa ao final', async () => {
    const deviceName = faker.commerce.productName();
    vi.spyOn(NativePasskeyClient.prototype, 'registerPasskey').mockResolvedValueOnce({
      success: true,
      deviceName
    });

    const { result } = renderHook(() => usePasskey(), { wrapper });

    await act(async () => {
      await result.current.register({
        externalUserId: faker.string.uuid(),
        userDisplayName: faker.person.fullName(),
        deviceName
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('register: propaga o erro de negócio retornado pelo client sem lançar exceção', async () => {
    const error = new PasskeyError('invalid_biometric_assertion', 'dispositivo recusado');
    vi.spyOn(NativePasskeyClient.prototype, 'registerPasskey').mockResolvedValueOnce({
      success: false,
      error
    });

    const { result } = renderHook(() => usePasskey(), { wrapper });

    let outcome;
    await act(async () => {
      outcome = await result.current.register({
        externalUserId: faker.string.uuid(),
        userDisplayName: faker.person.fullName(),
        deviceName: faker.commerce.productName()
      });
    });

    expect(outcome).toEqual({ success: false, error });
    expect(result.current.error).toBe(error);
  });

  it('registerWithRecoveryAssertion: propaga o erro de negócio retornado pelo client', async () => {
    const error = new PasskeyError('invalid_biometric_assertion', 'assertion expirada');
    vi.spyOn(NativePasskeyClient.prototype, 'registerWithRecoveryAssertion').mockResolvedValueOnce({
      success: false,
      error
    });

    const { result } = renderHook(() => usePasskey(), { wrapper });

    let outcome;
    await act(async () => {
      outcome = await result.current.registerWithRecoveryAssertion({
        assertion: faker.string.alphanumeric(40),
        deviceName: faker.commerce.productName()
      });
    });

    expect(outcome).toEqual({ success: false, error });
    expect(result.current.error).toBe(error);
  });

  it('register: captura exceção inesperada e devolve unknown_error', async () => {
    vi.spyOn(NativePasskeyClient.prototype, 'registerPasskey').mockRejectedValueOnce(
      new Error('device rejected')
    );

    const { result } = renderHook(() => usePasskey(), { wrapper });

    let outcome;
    await act(async () => {
      outcome = await result.current.register({
        externalUserId: faker.string.uuid(),
        userDisplayName: faker.person.fullName(),
        deviceName: faker.commerce.productName()
      });
    });

    expect(outcome).toEqual({ success: false, error: result.current.error });
    expect(result.current.error).toBeInstanceOf(PasskeyError);
    expect(result.current.error?.code).toBe('unknown_error');
    expect(result.current.isLoading).toBe(false);
  });

  it('register: repropaga PasskeyError lançado pelo client sem reembrulhar', async () => {
    const thrown = new PasskeyError('invalid_biometric_assertion', 'biometria inválida');
    vi.spyOn(NativePasskeyClient.prototype, 'registerPasskey').mockRejectedValueOnce(thrown);

    const { result } = renderHook(() => usePasskey(), { wrapper });

    let outcome;
    await act(async () => {
      outcome = await result.current.register({
        externalUserId: faker.string.uuid(),
        userDisplayName: faker.person.fullName(),
        deviceName: faker.commerce.productName()
      });
    });

    expect(outcome).toEqual({ success: false, error: thrown });
    expect(result.current.error).toBe(thrown);
  });

  it('registerWithRecoveryAssertion: repropaga PasskeyError lançado pelo client sem reembrulhar', async () => {
    const thrown = new PasskeyError('invalid_biometric_assertion', 'assertion de recuperação inválida');
    vi.spyOn(NativePasskeyClient.prototype, 'registerWithRecoveryAssertion').mockRejectedValueOnce(thrown);

    const { result } = renderHook(() => usePasskey(), { wrapper });

    let outcome;
    await act(async () => {
      outcome = await result.current.registerWithRecoveryAssertion({
        assertion: faker.string.alphanumeric(40),
        deviceName: faker.commerce.productName()
      });
    });

    expect(outcome).toEqual({ success: false, error: thrown });
    expect(result.current.error).toBe(thrown);
  });

  it('registerWithRecoveryAssertion: captura exceção inesperada e devolve unknown_error', async () => {
    vi.spyOn(NativePasskeyClient.prototype, 'registerWithRecoveryAssertion').mockRejectedValueOnce(
      new Error('assertion service indisponível')
    );

    const { result } = renderHook(() => usePasskey(), { wrapper });

    let outcome;
    await act(async () => {
      outcome = await result.current.registerWithRecoveryAssertion({
        assertion: faker.string.alphanumeric(40),
        deviceName: faker.commerce.productName()
      });
    });

    expect(outcome).toEqual({ success: false, error: result.current.error });
    expect(result.current.error).toBeInstanceOf(PasskeyError);
    expect(result.current.error?.code).toBe('unknown_error');
    expect(result.current.isLoading).toBe(false);
  });
});

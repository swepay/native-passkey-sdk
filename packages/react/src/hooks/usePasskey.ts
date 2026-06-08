// packages/react/src/hooks/usePasskey.ts
'use client';
import { useCallback, useState } from 'react';
import {
  PasskeyError,
  type AuthenticateOptions, type AuthenticateResult,
  type RegisterPasskeyOptions, type RegisterResult
} from '@nativeguard/passkey';
import { usePasskeyContext } from '../providers/PasskeyProvider';

export function usePasskey() {
  const { client } = usePasskeyContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PasskeyError | null>(null);

  const authenticate = useCallback(async (options?: AuthenticateOptions): Promise<AuthenticateResult> => {
    setIsLoading(true); setError(null);
    try {
      const result = await client.authenticateWithPasskey(options);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const e = err instanceof PasskeyError ? err : new PasskeyError('unknown_error', String(err));
      setError(e);
      return { success: false, error: e };
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const register = useCallback(async (options: RegisterPasskeyOptions): Promise<RegisterResult> => {
    setIsLoading(true); setError(null);
    try {
      const result = await client.registerPasskey(options);
      if (!result.success && result.error) setError(result.error);
      return result;
    } catch (err) {
      const e = err instanceof PasskeyError ? err : new PasskeyError('unknown_error', String(err));
      setError(e);
      return { success: false, error: e };
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return { isLoading, error, authenticate, register, clearError: () => setError(null) };
}

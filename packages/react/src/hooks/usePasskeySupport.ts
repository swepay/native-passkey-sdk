// packages/react/src/hooks/usePasskeySupport.ts
'use client';
import { useEffect, useState } from 'react';
import { NativePasskeyClient, type PasskeySupport } from '@nativeguard/passkey';

/** SSR-safe: retorna null durante hidratação */
export function usePasskeySupport(): { support: PasskeySupport | null; isLoading: boolean } {
  const [support, setSupport] = useState<PasskeySupport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    NativePasskeyClient.isAvailable().then(setSupport).finally(() => setIsLoading(false));
  }, []);

  return { support, isLoading };
}

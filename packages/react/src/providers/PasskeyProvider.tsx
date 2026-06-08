// packages/react/src/providers/PasskeyProvider.tsx
'use client';
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { NativePasskeyClient, type NativePasskeyConfig, type PasskeySupport } from '@nativeguard/passkey';

interface PasskeyContextValue {
  client: NativePasskeyClient;
  support: PasskeySupport | null;
  isLoading: boolean;
}

const PasskeyContext = createContext<PasskeyContextValue | null>(null);

export function PasskeyProvider({ children, config }: { children: ReactNode; config: NativePasskeyConfig }) {
  const [support, setSupport] = useState<PasskeySupport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const client = useMemo(() => new NativePasskeyClient(config), [config.projectId, config.apiBaseUrl]);

  useEffect(() => {
    NativePasskeyClient.isAvailable().then(setSupport).finally(() => setIsLoading(false));
  }, []);

  return (
    <PasskeyContext.Provider value={{ client, support, isLoading }}>
      {children}
    </PasskeyContext.Provider>
  );
}

export function usePasskeyContext(): PasskeyContextValue {
  const ctx = useContext(PasskeyContext);
  if (!ctx) throw new Error('usePasskeyContext must be inside <PasskeyProvider>');
  return ctx;
}

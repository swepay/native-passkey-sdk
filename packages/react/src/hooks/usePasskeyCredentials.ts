// packages/react/src/hooks/usePasskeyCredentials.ts
'use client';
import { useCallback, useEffect, useState } from 'react';
import type { PasskeyCredential } from '@nativeguard/passkey';
import { usePasskeyContext } from '../providers/PasskeyProvider';

export function usePasskeyCredentials(externalUserId: string, apiKey: string) {
  const { client } = usePasskeyContext();
  const [credentials, setCredentials] = useState<PasskeyCredential[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try { setCredentials(await client.listCredentials(externalUserId, apiKey)); }
    finally { setIsLoading(false); }
  }, [client, externalUserId, apiKey]);

  const revoke = useCallback(async (credentialId: string) => {
    await client.revokeCredential(externalUserId, credentialId, apiKey);
    setCredentials(prev => prev.filter(c => c.credentialId !== credentialId));
  }, [client, externalUserId, apiKey]);

  useEffect(() => { load(); }, [load]);

  return { credentials, isLoading, reload: load, revoke };
}

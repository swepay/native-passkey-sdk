// packages/react/src/components/PasskeyManager.tsx
'use client';
import type { PasskeyCredential } from '@nativeguard/passkey';
import { usePasskeyCredentials } from '../hooks/usePasskeyCredentials';

interface PasskeyManagerProps {
  externalUserId: string;
  apiKey: string;
  onRevoke?: (credentialId: string) => void;
  renderCredential?: (cred: PasskeyCredential, onRevoke: () => void) => React.ReactNode;
}

export function PasskeyManager({ externalUserId, apiKey, onRevoke, renderCredential }: PasskeyManagerProps) {
  const { credentials, isLoading, revoke } = usePasskeyCredentials(externalUserId, apiKey);

  const handleRevoke = async (credentialId: string) => {
    await revoke(credentialId);
    onRevoke?.(credentialId);
  };

  if (isLoading) return <div role="status">Carregando credenciais...</div>;
  if (credentials.length === 0) return <div>Nenhum dispositivo biométrico registrado.</div>;

  return (
    <ul role="list" aria-label="Dispositivos biométricos">
      {credentials.map(cred => (
        <li key={cred.credentialId}>
          {renderCredential
            ? renderCredential(cred, () => handleRevoke(cred.credentialId))
            : (
              <div>
                <div>
                  <strong>{cred.deviceName}</strong>
                  <span> — {new Date(cred.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <button type="button" onClick={() => handleRevoke(cred.credentialId)}>Remover</button>
              </div>
            )
          }
        </li>
      ))}
    </ul>
  );
}

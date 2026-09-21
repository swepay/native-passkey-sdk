// packages/react/src/components/PasskeyManager.xss.test.tsx
// Adversarial: a única string controlada pelo servidor que o SDK React renderiza
// (cred.deviceName) e a mensagem de PasskeyError (detail RFC 9457) têm de chegar ao DOM
// escapadas — nunca como HTML.
import { render, screen, waitFor } from '@testing-library/react';
import { NativePasskeyClient, PasskeyError } from '@nativeguard/passkey';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PasskeyProvider } from '../providers/PasskeyProvider';
import { usePasskey } from '../hooks/usePasskey';
import { PasskeyManager } from './PasskeyManager';

const XSS_DETAIL = '<img src=x onerror="window.__xss=1">';
const XSS_TITLE = '<b>bold</b>';
const config = { projectId: 'proj_xss' };

function ErrorConsumer() {
  const { error, authenticate } = usePasskey();
  return (
    <div>
      <button type="button" onClick={() => void authenticate()}>go</button>
      {error && <p data-testid="err">{error.message}</p>}
    </div>
  );
}

describe('SDK React — saída de servidor renderizada como texto', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).__xss;
  });

  it('PasskeyManager: deviceName com HTML é escapado', async () => {
    // Arrange
    vi.spyOn(NativePasskeyClient.prototype, 'listCredentials').mockResolvedValueOnce([{
      credentialId: 'cred-1',
      deviceName: `${XSS_TITLE} ${XSS_DETAIL}`,
      createdAt: new Date().toISOString(),
      aaguid: '0',
      transports: ['internal'],
      isActive: true
    }]);

    // Act
    const { container } = render(
      <PasskeyProvider config={config}>
        <PasskeyManager externalUserId="u1" apiKey="k" />
      </PasskeyProvider>
    );
    await waitFor(() => expect(container.querySelector('ul')).not.toBeNull());

    // Assert
    expect(container.innerHTML).toContain('&lt;img');
    expect(container.innerHTML).toContain('&lt;b&gt;bold');
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('b')).toBeNull();
    expect((window as any).__xss).toBeUndefined();
  });

  it('usePasskey.error.message (detail RFC 9457) chega ao DOM como texto', async () => {
    // Arrange
    vi.spyOn(NativePasskeyClient.prototype, 'authenticateWithPasskey').mockRejectedValueOnce(
      new PasskeyError('biometric_recovery_disabled', XSS_DETAIL)
    );
    const { container } = render(
      <PasskeyProvider config={config}>
        <ErrorConsumer />
      </PasskeyProvider>
    );

    // Act
    screen.getByText('go').click();
    await waitFor(() => expect(screen.getByTestId('err')).toBeTruthy());

    // Assert
    expect(screen.getByTestId('err').textContent).toBe(XSS_DETAIL);
    expect(container.innerHTML).toContain('&lt;img');
    expect(document.querySelector('img')).toBeNull();
    expect((window as any).__xss).toBeUndefined();
  });
});

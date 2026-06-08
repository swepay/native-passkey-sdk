'use client';
// apps/demo-nextjs/app/page.tsx
import { useState } from 'react';
import {
  PasskeyButton,
  PasskeyRegisterButton,
  PasskeyManager,
  usePasskeySupport,
  type AuthenticateResult,
  type RegisterResult
} from '@nativeguard/passkey-react';

const DEMO_USER_ID = 'demo-user-001';
const DEMO_API_KEY = process.env.NEXT_PUBLIC_NPK_DEMO_API_KEY ?? '';

export default function DemoPage() {
  const { support, isLoading: supportLoading } = usePasskeySupport();
  const [authResult, setAuthResult] = useState<AuthenticateResult | null>(null);
  const [registerResult, setRegisterResult] = useState<RegisterResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showManager, setShowManager] = useState(false);

  const handleAuthSuccess = (result: AuthenticateResult) => {
    setAuthResult(result);
    setErrorMsg(null);
  };

  const handleRegisterSuccess = (result: RegisterResult) => {
    setRegisterResult(result);
    setErrorMsg(null);
  };

  const handleError = (code: string) => {
    setErrorMsg(code);
  };

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        NativePasskey SDK — Demo
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Demonstracao do SDK WebAuthn/FIDO2 do ecossistema Swepay/NativeGuard.
      </p>

      {supportLoading && (
        <p style={{ color: '#888' }}>Verificando suporte biometrico...</p>
      )}

      {!supportLoading && !support?.available && (
        <div style={{ padding: '1rem', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8 }}>
          <strong>Biometria nao disponivel</strong>
          <p style={{ margin: '0.5rem 0 0' }}>
            Este dispositivo ou navegador nao suporta passkeys. Use Chrome 108+, Safari 16.4+ ou Edge 108+.
          </p>
        </div>
      )}

      {!supportLoading && support?.available && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <section style={{ padding: '1.5rem', border: '1px solid #e0e0e0', borderRadius: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Tipo de biometria detectado
            </h2>
            <p style={{ color: '#555', marginBottom: '1rem' }}>
              {support.biometricType === 'face' && 'Face ID (iOS)'}
              {support.biometricType === 'fingerprint' && 'Digital (Android)'}
              {support.biometricType === 'platform' && 'Windows Hello / Touch ID (macOS)'}
              {' — '}
              Conditional UI: {support.conditionalMediationAvailable ? 'disponivel' : 'indisponivel'}
            </p>
          </section>

          <section style={{ padding: '1.5rem', border: '1px solid #e0e0e0', borderRadius: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
              1. Autenticar com biometria
            </h2>
            <PasskeyButton
              options={{ externalUserId: DEMO_USER_ID }}
              onSuccess={handleAuthSuccess}
              onError={handleError}
              style={{
                padding: '12px 24px',
                background: '#1a1a2e',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
                minWidth: 220
              }}
            >
              Entrar com biometria
            </PasskeyButton>
            {authResult?.success && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#d4edda', borderRadius: 8 }}>
                <strong>Autenticado!</strong>
                <p style={{ margin: '0.25rem 0 0', fontSize: 13, wordBreak: 'break-all' }}>
                  userId: {authResult.externalUserId}
                </p>
                {authResult.assertionJwt && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: 11, color: '#555', wordBreak: 'break-all' }}>
                    JWT: {authResult.assertionJwt.slice(0, 60)}...
                  </p>
                )}
              </div>
            )}
          </section>

          <section style={{ padding: '1.5rem', border: '1px solid #e0e0e0', borderRadius: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
              2. Registrar nova chave biometrica
            </h2>
            <PasskeyRegisterButton
              registerOptions={{
                externalUserId: DEMO_USER_ID,
                userDisplayName: 'Usuario Demo',
                deviceName: 'Dispositivo Demo'
              }}
              onSuccess={handleRegisterSuccess}
              onError={handleError}
              style={{
                padding: '12px 24px',
                background: '#0d6efd',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
                minWidth: 220
              }}
            >
              Registrar biometria
            </PasskeyRegisterButton>
            {registerResult?.success && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#d4edda', borderRadius: 8 }}>
                <strong>Registrado!</strong>
                <p style={{ margin: '0.25rem 0 0', fontSize: 13 }}>
                  Dispositivo: {registerResult.deviceName}
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: 13 }}>
                  credentialId: {registerResult.credentialId?.slice(0, 20)}...
                </p>
              </div>
            )}
          </section>

          {errorMsg && (
            <div style={{ padding: '0.75rem 1rem', background: '#f8d7da', border: '1px solid #f5c2c7', borderRadius: 8 }}>
              <strong>Erro:</strong> {errorMsg}
            </div>
          )}

          <section style={{ padding: '1.5rem', border: '1px solid #e0e0e0', borderRadius: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
              3. Gerenciar dispositivos registrados
            </h2>
            <button
              type="button"
              onClick={() => setShowManager(prev => !prev)}
              style={{
                padding: '10px 20px',
                background: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              {showManager ? 'Ocultar' : 'Ver dispositivos'}
            </button>
            {showManager && DEMO_API_KEY && (
              <PasskeyManager
                externalUserId={DEMO_USER_ID}
                apiKey={DEMO_API_KEY}
                onRevoke={(id) => console.log('Revoked:', id)}
              />
            )}
            {showManager && !DEMO_API_KEY && (
              <p style={{ color: '#888', fontSize: 13 }}>
                Configure NEXT_PUBLIC_NPK_DEMO_API_KEY para listar credenciais.
              </p>
            )}
          </section>

        </div>
      )}

      <footer style={{ marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid #eee', color: '#aaa', fontSize: 12 }}>
        NativePasskey SDK v1.0.0 — Swepay / NativeGuard
      </footer>
    </main>
  );
}

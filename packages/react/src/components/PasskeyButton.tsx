// packages/react/src/components/PasskeyButton.tsx
'use client';
import type { ComponentPropsWithoutRef } from 'react';
import type { AuthenticateOptions, AuthenticateResult } from '@nativeguard/passkey';
import { usePasskey } from '../hooks/usePasskey';
import { usePasskeyContext } from '../providers/PasskeyProvider';

interface PasskeyButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'onError'> {
  options?: AuthenticateOptions;
  onSuccess?: (result: AuthenticateResult) => void;
  onError?: (code: string) => void;
  /** Render prop para design systems customizados */
  renderButton?: (props: { onClick: () => void; isLoading: boolean; biometricType: string }) => React.ReactNode;
}

export function PasskeyButton({ options, onSuccess, onError, renderButton, children, ...props }: PasskeyButtonProps) {
  const { support, isLoading: supportLoading } = usePasskeyContext();
  const { authenticate, isLoading } = usePasskey();

  if (supportLoading || !support?.available) return null;

  const handleClick = async () => {
    const result = await authenticate(options);
    result.success ? onSuccess?.(result) : onError?.(result.error?.code ?? 'error');
  };

  if (renderButton) return renderButton({ onClick: handleClick, isLoading, biometricType: support.biometricType }) as React.ReactElement;

  const label = support.biometricType === 'face' ? 'Entrar com Face ID' : 'Entrar com Digital';

  return (
    <button type="button" onClick={handleClick} disabled={isLoading} aria-busy={isLoading} {...props}>
      {isLoading ? 'Aguardando biometria...' : (children ?? label)}
    </button>
  );
}

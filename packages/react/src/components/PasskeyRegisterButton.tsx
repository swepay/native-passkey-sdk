// packages/react/src/components/PasskeyRegisterButton.tsx
'use client';
import type { ComponentPropsWithoutRef } from 'react';
import type { RegisterPasskeyOptions, RegisterResult } from '@nativeguard/passkey';
import { usePasskey } from '../hooks/usePasskey';
import { usePasskeyContext } from '../providers/PasskeyProvider';

interface PasskeyRegisterButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'onError'> {
  registerOptions: RegisterPasskeyOptions;
  onSuccess?: (result: RegisterResult) => void;
  onError?: (code: string) => void;
}

export function PasskeyRegisterButton({ registerOptions, onSuccess, onError, children, disabled, ...props }: PasskeyRegisterButtonProps) {
  const { support } = usePasskeyContext();
  const { register, isLoading } = usePasskey();

  if (!support?.available) return null;

  const handleClick = async () => {
    const result = await register(registerOptions);
    result.success ? onSuccess?.(result) : onError?.(result.error?.code ?? 'error');
  };

  return (
    <button type="button" onClick={handleClick} disabled={isLoading || disabled} aria-busy={isLoading} {...props}>
      {isLoading ? 'Registrando...' : (children ?? 'Registrar biometria')}
    </button>
  );
}

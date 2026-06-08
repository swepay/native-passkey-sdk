// packages/react/src/index.ts
export { PasskeyProvider } from './providers/PasskeyProvider';
export { usePasskey } from './hooks/usePasskey';
export { usePasskeySupport } from './hooks/usePasskeySupport';
export { usePasskeyCredentials } from './hooks/usePasskeyCredentials';
export { PasskeyButton } from './components/PasskeyButton';
export { PasskeyRegisterButton } from './components/PasskeyRegisterButton';
export { PasskeyManager } from './components/PasskeyManager';

// Re-export do core — consumer instala apenas @nativeguard/passkey-react
export { NativePasskeyClient, PasskeyError } from '@nativeguard/passkey';
export type {
  NativePasskeyConfig, RegisterPasskeyOptions, AuthenticateOptions,
  RegisterResult, AuthenticateResult, PasskeyCredential, PasskeySupport, PasskeyErrorCode
} from '@nativeguard/passkey';

// packages/react/src/index.ts
export { PasskeyProvider } from './providers/PasskeyProvider';
export { usePasskey } from './hooks/usePasskey';
export { usePasskeySupport } from './hooks/usePasskeySupport';
export { usePasskeyCredentials } from './hooks/usePasskeyCredentials';
export { PasskeyButton } from './components/PasskeyButton';
export { PasskeyRegisterButton } from './components/PasskeyRegisterButton';
export { PasskeyManager } from './components/PasskeyManager';

// Re-export do core — consumer instala apenas @swepay/native-passly-react
export { NativePasskeyClient, PasskeyError } from '@swepay/native-passly-sdk';
export type {
  NativePasskeyConfig, RegisterPasskeyOptions, AuthenticateOptions,
  RegisterResult, RegisterWithRecoveryAssertionOptions,
  AuthenticateResult, PasskeyCredential, PasskeySupport, PasskeyErrorCode
} from '@swepay/native-passly-sdk';

// packages/angular/projects/passkey-angular/src/lib/guards/passkey-supported.guard.ts
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { NativePasskeyService } from '../services/native-passkey.service';

export const passkeySupportedGuard: CanActivateFn = async () => {
  const svc = inject(NativePasskeyService);
  const router = inject(Router);
  const support = await svc.checkBiometricSupport();
  if (!support.available) {
    return router.createUrlTree(['/unsupported']);
  }
  return true;
};

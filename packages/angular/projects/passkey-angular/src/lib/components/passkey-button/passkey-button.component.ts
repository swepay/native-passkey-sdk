// packages/angular/projects/passkey-angular/src/lib/components/passkey-button/passkey-button.component.ts
import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal
} from '@angular/core';
import { NgIf } from '@angular/common';
import type { AuthenticateOptions, AuthenticateResult, PasskeySupport, RegisterPasskeyOptions, RegisterResult } from '@nativeguard/passkey';
import { NativePasskeyService } from '../../services/native-passkey.service';

export type PasskeyButtonMode = 'authenticate' | 'register';

@Component({
  selector: 'npk-passkey-button',
  standalone: true,
  imports: [NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button *ngIf="support()?.available"
      class="npk-btn"
      [class.npk-btn--loading]="loading()"
      [disabled]="loading()"
      (click)="handleClick()"
      [attr.aria-busy]="loading()">
      <span *ngIf="loading()" class="npk-spinner" role="status"></span>
      <span>{{ loading() ? 'Aguardando biometria...' : label }}</span>
    </button>
  `,
  styles: [`
    .npk-btn { display:inline-flex; align-items:center; gap:8px; padding:12px 24px;
      border-radius:12px; border:none; background:#1a1a2e; color:#fff;
      font-size:16px; font-weight:500; cursor:pointer; min-width:220px; justify-content:center;
      transition:opacity .2s,transform .15s; }
    .npk-btn:disabled { opacity:.6; cursor:not-allowed; }
    .npk-btn:not(:disabled):hover { opacity:.9; transform:translateY(-1px); }
    .npk-spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.3);
      border-top-color:#fff; border-radius:50%; animation:npk-spin .75s linear infinite; }
    @keyframes npk-spin { to { transform:rotate(360deg); } }
  `]
})
export class PasskeyButtonComponent implements OnInit {
  @Input({ required: true }) projectId!: string;
  @Input() apiBaseUrl?: string;
  @Input() mode: PasskeyButtonMode = 'authenticate';
  @Input() label = 'Entrar com biometria';
  @Input() externalUserId?: string;
  @Input() userDisplayName?: string;
  @Input() deviceName?: string;

  @Output() authSuccess = new EventEmitter<AuthenticateResult>();
  @Output() registerSuccess = new EventEmitter<RegisterResult>();
  @Output() passkeyError = new EventEmitter<string>();

  private readonly svc = inject(NativePasskeyService);
  readonly support = signal<PasskeySupport | null>(null);
  readonly loading = signal(false);

  async ngOnInit(): Promise<void> {
    this.svc.configure({ projectId: this.projectId, apiBaseUrl: this.apiBaseUrl });
    this.support.set(await this.svc.checkBiometricSupport());
  }

  async handleClick(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      if (this.mode === 'authenticate') {
        const r = await this.svc.authenticateWithPasskey({ externalUserId: this.externalUserId });
        r.success ? this.authSuccess.emit(r) : this.passkeyError.emit(r.error?.code ?? 'error');
      } else {
        const r = await this.svc.registerPasskey({
          externalUserId: this.externalUserId!,
          userDisplayName: this.userDisplayName!,
          deviceName: this.deviceName!
        });
        r.success ? this.registerSuccess.emit(r) : this.passkeyError.emit(r.error?.code ?? 'error');
      }
    } finally {
      this.loading.set(false);
    }
  }
}

// packages/angular/projects/passkey-angular/src/lib/components/passkey-manager/passkey-manager.component.ts
import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import type { PasskeyCredential } from '@nativeguard/passkey';
import { NativePasskeyService } from '../../services/native-passkey.service';

@Component({
  selector: 'npk-passkey-manager',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="npk-manager">
      <div *ngIf="loading()" class="npk-state">Carregando...</div>
      <div *ngIf="!loading() && credentials().length === 0" class="npk-state">
        Nenhum dispositivo biométrico registrado.
      </div>
      <ul *ngIf="credentials().length > 0" class="npk-list">
        <li *ngFor="let cred of credentials()" class="npk-item">
          <div class="npk-info">
            <strong>{{ cred.deviceName }}</strong>
            <span>Registrado {{ cred.createdAt | date:'dd/MM/yyyy' }}</span>
            <span *ngIf="cred.lastUsedAt">Último uso {{ cred.lastUsedAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <button class="npk-revoke" (click)="revoke(cred)"
            [disabled]="revokingId() === cred.credentialId">
            {{ revokingId() === cred.credentialId ? 'Removendo...' : 'Remover' }}
          </button>
        </li>
      </ul>
    </div>
  `
})
export class PasskeyManagerComponent implements OnInit {
  @Input({ required: true }) externalUserId!: string;
  @Input({ required: true }) projectId!: string;
  @Input({ required: true }) apiKey!: string;
  @Input() apiBaseUrl?: string;

  private readonly svc = inject(NativePasskeyService);
  readonly credentials = signal<PasskeyCredential[]>([]);
  readonly loading = signal(false);
  readonly revokingId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.svc.configure({ projectId: this.projectId, apiBaseUrl: this.apiBaseUrl });
    this.loading.set(true);
    try {
      this.credentials.set(await this.svc.listCredentials(this.externalUserId, this.apiKey));
    } finally {
      this.loading.set(false);
    }
  }

  async revoke(cred: PasskeyCredential): Promise<void> {
    this.revokingId.set(cred.credentialId);
    try {
      await this.svc.revokeCredential(this.externalUserId, cred.credentialId, this.apiKey);
      this.credentials.update(list => list.filter(c => c.credentialId !== cred.credentialId));
    } finally {
      this.revokingId.set(null);
    }
  }
}

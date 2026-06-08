// packages/angular/projects/passkey-angular/src/lib/services/flutter-bridge.service.ts
import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';

export interface FlutterBridgeMessage {
  type: 'biometric_result' | 'device_info' | 'ready';
  payload?: unknown;
}

export interface FlutterChannelMessage {
  type: 'passkey_registered' | 'passkey_authenticated' | 'passkey_error';
  payload?: unknown;
}

/**
 * Bridge bidirecional Angular ↔ Flutter via flutter_inappwebview.
 *
 * Flutter side (Dart) — configuração mínima:
 * ```dart
 * controller.addJavaScriptHandler(
 *   handlerName: 'FlutterChannel',
 *   callback: (args) { handleAngularMessage(args[0]); }
 * );
 * ```
 *
 * Angular → Flutter: window.flutter_inappwebview.callHandler('FlutterChannel', json)
 * Flutter → Angular: window.AngularChannel.postMessage(json)
 */
@Injectable({ providedIn: 'root' })
export class FlutterBridgeService implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly messages$ = new Subject<FlutterBridgeMessage>();

  readonly isFlutterContext: boolean = this.detectFlutterContext();

  constructor() {
    if (this.isFlutterContext) {
      (window as any).AngularChannel = {
        postMessage: (jsonStr: string) => {
          this.ngZone.run(() => {
            try {
              this.messages$.next(JSON.parse(jsonStr) as FlutterBridgeMessage);
            } catch {
              console.error('[NPK] Invalid Flutter message:', jsonStr);
            }
          });
        }
      };
    }
  }

  detectFlutterContext(): boolean {
    return typeof (window as any).flutter_inappwebview !== 'undefined'
      || navigator.userAgent.includes('FlutterWebView');
  }

  sendToFlutter(message: FlutterChannelMessage): void {
    if (!this.isFlutterContext) return;
    (window as any).flutter_inappwebview?.callHandler?.('FlutterChannel', JSON.stringify(message));
  }

  on<T = unknown>(type: FlutterBridgeMessage['type']): Observable<T> {
    return this.messages$.pipe(
      filter(msg => msg.type === type),
      map(msg => msg.payload as T)
    );
  }

  ngOnDestroy(): void {
    this.messages$.complete();
  }
}

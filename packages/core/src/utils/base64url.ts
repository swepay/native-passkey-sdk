// packages/core/src/utils/base64url.ts

/** Converte ArrayBuffer → Base64Url sem padding (RFC 4648 §5) */
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/** Converte Base64Url → Uint8Array */
export function base64UrlToBuffer(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

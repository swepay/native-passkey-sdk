// packages/core/src/utils/base64url.test.ts
import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { base64UrlToBuffer, bufferToBase64Url } from './base64url';

describe('bufferToBase64Url / base64UrlToBuffer', () => {
  it('round-trips arbitrary bytes back to the original content', () => {
    // Arrange
    const original = faker.string.alphanumeric({ length: 37 }); // não múltiplo de 4 — força padding
    const bytes = new TextEncoder().encode(original);

    // Act
    const encoded = bufferToBase64Url(bytes.buffer as ArrayBuffer);
    const decoded = base64UrlToBuffer(encoded);

    // Assert
    expect(new TextDecoder().decode(decoded)).toBe(original);
  });

  it('never emits standard base64 characters (+, /, =)', () => {
    // Arrange — bytes que produziriam + e / em base64 padrão
    const bytes = new Uint8Array([0xfb, 0xff, 0xfe, 0x3e, 0x3f]);

    // Act
    const encoded = bufferToBase64Url(bytes.buffer);

    // Assert
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('decodes a base64url string produced by the backend (no padding present)', () => {
    // Arrange — "swepay" em base64url, sem padding
    const encoded = 'c3dlcGF5';

    // Act
    const decoded = base64UrlToBuffer(encoded);

    // Assert
    expect(new TextDecoder().decode(decoded)).toBe('swepay');
  });

  it('round-trips every padding length (0..3 bytes leftover)', () => {
    // Arrange
    const lengths = [1, 2, 3, 4, 5];

    for (const length of lengths) {
      const original = faker.string.alphanumeric({ length });

      // Act
      const encoded = bufferToBase64Url(new TextEncoder().encode(original).buffer as ArrayBuffer);
      const decoded = base64UrlToBuffer(encoded);

      // Assert
      expect(new TextDecoder().decode(decoded)).toBe(original);
    }
  });
});

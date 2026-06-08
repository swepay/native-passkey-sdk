// packages/react/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig([
  // Client bundle — marcado com 'use client' para Next.js App Router
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['react', 'react-dom', '@nativeguard/passkey'],
    esbuildOptions(opts) {
      opts.banner = { js: "'use client';" };
    }
  },
  // Server bundle — sem 'use client', para Server Components e API Routes
  {
    entry: { 'server/index': 'src/server/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['jose', '@nativeguard/passkey']
  }
]);

// apps/demo-nextjs/app/layout.tsx
import { PasskeyProvider } from '@nativeguard/passkey-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <PasskeyProvider config={{
          projectId: process.env.NEXT_PUBLIC_NPK_PROJECT_ID!,
          apiBaseUrl: process.env.NEXT_PUBLIC_NPK_API_URL
        }}>
          {children}
        </PasskeyProvider>
      </body>
    </html>
  );
}

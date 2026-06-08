// apps/demo-nextjs/app/api/auth/passkey/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PasskeyVerifier } from '@nativeguard/passkey-react/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

const verifier = new PasskeyVerifier({
  projectId: process.env.NPK_PROJECT_ID!,
  apiBaseUrl: process.env.NPK_API_URL,
  audience: process.env.NEXT_PUBLIC_APP_URL!
});

export async function POST(request: NextRequest) {
  const { assertionJwt } = await request.json() as { assertionJwt?: string };
  if (!assertionJwt) return NextResponse.json({ error: 'missing_assertion_jwt' }, { status: 400 });

  const result = await verifier.verify(assertionJwt);
  if (!result.valid || !result.externalUserId) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  // Criar session token local (adaptar ao seu sistema de auth)
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
  const sessionToken = await new SignJWT({ sub: result.externalUserId })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);

  const store = await cookies();
  store.set('session', sessionToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 604_800 });

  return NextResponse.json({ success: true, userId: result.externalUserId });
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const token = body?.token;
    if (!token) return NextResponse.json({ ok: false, reason: 'missing token' }, { status: 400 });

    try {
      const { verifyAdminSession } = await import('@/lib/admin-session');
      const result = verifyAdminSession(token);

      // Extra low-level debug: compute expected HMAC (base64url) for the token
      // parts so we can compare server-side what was provided.
      try {
        const parts = String(token).split('.');
        if (parts.length === 3) {
          const crypto = await import('crypto');
          const unsigned = `${parts[0]}.${parts[1]}`;
          const secret = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || '';
          const expected = secret ? crypto.createHmac('sha256', secret).update(unsigned).digest('base64') : null;
          const expectedUrl = expected ? expected.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') : null;
          return NextResponse.json({ ok: true, verified: !!result, result: result || null, expectedSigB64url: expectedUrl, providedSig: parts[2] });
        }
      } catch (e) {
        // ignore low-level debug errors
      }
      return NextResponse.json({ ok: true, verified: !!result, result: result || null });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

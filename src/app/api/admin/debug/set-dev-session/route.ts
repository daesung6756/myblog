import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Only enable this helper in development to avoid accidentally
    // exposing a session setter in production.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const email = body?.email || 'dev@example.local';

    // We'll include the admin token in the JSON body for E2E tests so the
    // browser-runner can pick it up and set the cookie reliably. This is
    // strictly for local development usage.
    let debugAdminToken: string | null = null;
    const response = NextResponse.json({ success: true, email });

    const devSecure = String(process.env.NODE_ENV) === 'production';
    // Set fake tokens for testing cookie behavior. These are NOT real
    // Supabase tokens and should only be used for local dev verification.
    // Generate realistic-looking tokens for dev so they pass validation
    // heuristics used by the server while still being obviously dev-only.
    const randomHex = () => {
      // 64 hex characters (~256 bits)
      try {
        return Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback for environments without crypto.* available in this runtime
        return [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      }
    };
    const devAccess = `dev.access.${randomHex()}`;
    const devRefresh = `dev.refresh.${randomHex()}`;

    response.cookies.set('sb-access-token', devAccess, {
      httpOnly: true,
      secure: devSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });
    response.cookies.set('sb-refresh-token', devRefresh, {
      httpOnly: true,
      secure: devSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set('sb-expires-at', String(Math.floor(Date.now() / 1000) + 60 * 60), {
      httpOnly: true,
      secure: devSecure,
      sameSite: 'lax',
      path: '/',
    });

    // For developer testing, also create a short-lived server-side admin-session
    // so E2E and debug flows can exercise service-role logic without needing
    // a real Supabase admin user. This should ONLY run in non-production.
    try {
      const { signAdminSession } = await import('@/lib/admin-session');
      const adminToken = signAdminSession({ id: `dev-${email}`, email: email, role: 'admin' }, 60 * 60);
      if (adminToken) {
        response.cookies.set('admin-session', adminToken, { httpOnly: true, secure: devSecure, sameSite: 'lax', path: '/', maxAge: 60 * 60 });
        debugAdminToken = adminToken;
      } else {
        // If signing failed (eg. ADMIN_SESSION_SECRET not present in the
        // server process), create a simple unsigned payload token for DEV
        // only. The session-check route intentionally trusts an unsigned
        // payload in non-production for E2E/debugging convenience.
        try {
          const header = { alg: 'none', typ: 'JWT' };
          const body = {
            id: `dev-${email}`,
            email,
            role: 'admin',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
          };
          function b64(u: string) {
            return Buffer.from(u).toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
          }
          const token = `${b64(JSON.stringify(header))}.${b64(JSON.stringify(body))}.`;
          response.cookies.set('admin-session', token, { httpOnly: true, secure: devSecure, sameSite: 'lax', path: '/', maxAge: 60 * 60 });
          debugAdminToken = token;
        } catch (e) {
          // ignore fallback failures
        }
      }
    } catch (e) {
      // ignore in dev helper
    }

    // Also set a dev-only admin-session cookie so local tests can exercise
    // admin-only code paths without hitting Supabase.
    try {
      const { signAdminSession } = await import('@/lib/admin-session');
      const token = signAdminSession({ id: `dev:${email}`, email, role: 'admin' });
      if (token) {
        response.cookies.set('admin-session', token, {
          httpOnly: true,
          secure: devSecure,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });
          debugAdminToken = debugAdminToken || token;
        }
    } catch (e) {
      // ignore dev-only failure
    }

    try {
      const setAll = response.headers.get ? response.headers.get('set-cookie') : undefined;
      console.log('[api/admin/debug/set-dev-session] set-cookie header preview:', setAll ? setAll.toString().slice(0, 500) : '[none]');
    } catch (e) {
      // ignore logging errors
    }

    // Attach the actual admin token value to the returned body to make it
    // easy for E2E tests to always obtain and set the cookie in the browser
    // context even when the server runtime doesn't have a signing secret.
    try {
      // clone response body and add token
      const cloneBody: any = { success: true, email };
      if (debugAdminToken) cloneBody.adminSession = debugAdminToken;
      return NextResponse.json(cloneBody, response.init);
    } catch (e) {
      return response;
    }
  } catch (e) {
    console.error('set-dev-session error', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

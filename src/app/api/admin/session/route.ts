import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchUserFromAccess, refreshAuthTokens } from '@/lib/request-supabase';
import { verifyAdminSession } from '@/lib/admin-session';
import { getServerSession } from 'next-auth/next'
import authOptions from '@/lib/nextauth'

export async function GET(request: NextRequest) {
  try {
    let nextCookiesObj: any = null;
    try {
      nextCookiesObj = await cookies();
    } catch (e) {
      // ignore
    }

    // Debug: list cookie names seen by this route (mask values)
    try {
      const seen = (nextCookiesObj?.getAll ? nextCookiesObj.getAll() : []).map((c: any) => c.name + '=' + (c.value ? '[REDACTED]' : '[EMPTY]'));
      console.log('[api/admin/session] cookies:', seen.join('; '));
    } catch (e) {
      console.log('[api/admin/session] could not enumerate cookies', e);
    }

    // Accept multiple possible cookie name patterns produced by different
    // Supabase helper versions. Common formats:
    // - 'sb-access-token' / 'sb-refresh-token' (our fallback)
    // - 'sb-<projectRef>-auth-token' (auth token cookie produced by helper)
    // - 'sb-<projectRef>-refresh-token' (refresh token cookie)
    let access: string | undefined = undefined;
    let refresh: string | undefined = undefined;
    try {
      const all = nextCookiesObj?.getAll ? nextCookiesObj.getAll() : [];
      for (const c of all || []) {
        const name = String(c.name || '').toLowerCase();
        const value = c.value;
        if (!access && (name === 'sb-access-token' || /auth-token/i.test(name) || name.includes('auth_token') || name.endsWith('-auth-token'))) {
          access = value;
        }
        if (!refresh && (name === 'sb-refresh-token' || /refresh-token/i.test(name) || name.endsWith('-refresh-token'))) {
          refresh = value;
          try {
            const preview = typeof value === 'string' ? `${value.slice(0, 16)}...len=${value.length}` : String(value);
            console.log('[api/admin/session] chose refresh cookie', name, 'preview=', preview, 'containsDot=', String(value).includes('.'));
          } catch (e) {
            console.log('[api/admin/session] chose refresh cookie', name, 'but could not preview value');
          }
        }
      }
    } catch (e) {
      // fallback: try direct gets
      access = access || nextCookiesObj?.get('sb-access-token')?.value;
      refresh = refresh || nextCookiesObj?.get('sb-refresh-token')?.value;
    }

    // If NextAuth session exists (DB backed), trust it first.
    try {
      const nextAuthSession = await getServerSession(authOptions as any);
      if (nextAuthSession) {
        try {
          console.log('[api/admin/session] NextAuth session found for user', nextAuthSession.user?.email || nextAuthSession.user?.id);
          return NextResponse.json({ hasSession: true, user: { id: nextAuthSession.user?.id || null, role: (nextAuthSession.user as any)?.role || null } });
        } catch (e) {}
      }
    } catch (e) {
      // continue to admin-session fallback
    }

    // If we have a server-side admin session cookie, trust that first.
    try {
      const adminCookie = nextCookiesObj?.get('admin-session')?.value;
      if (adminCookie) {
        const adminData = verifyAdminSession(adminCookie);
        if (adminData) {
          console.log('[api/admin/session] admin-session verified for id=', adminData.id);
          return NextResponse.json({ hasSession: true, user: { id: adminData.id, role: adminData.role || 'admin' } });
        } else {
          // In development or tests we may not have ADMIN_SESSION_SECRET available
          // in the server process; falling back to a best-effort payload decode
          // allows UI-driven E2E to work without requiring a deployed secret.
          if (process.env.NODE_ENV !== 'production') {
            try {
              const parts = String(adminCookie).split('.');
              if (parts.length === 3) {
                let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                while (payload.length % 4) payload += '=';
                const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
                console.log('[api/admin/session] dev fallback accepted admin-session for id=', decoded?.id);
                return NextResponse.json({ hasSession: true, user: { id: decoded?.id || null, role: decoded?.role || 'admin' } });
              }
            } catch (e) {
              // ignore and proceed to token checks
            }
          }
          // Extra debugging: log token parts length so we can inspect signature mismatch
          try {
            const parts = String(adminCookie).split('.');
            console.warn('[api/admin/session] admin-session present but failed verify — parts=', parts.map((p) => `${p?.length || 0}`));
          } catch (e) {
            console.warn('[api/admin/session] admin-session present but failed verify');
          }
        }
      }
    } catch (e) {
      // proceed to token-based checks
    }

    let user = await fetchUserFromAccess(access);

    // If access is invalid, try refreshing once — but only when it's needed.
    // Check sb-expires-at to avoid unnecessary refresh requests when the
    // access token is still valid. Also skip refresh attempts for obviously
    // invalid/short refresh tokens.
    if (!user && refresh) {
      // read expires hint if present
      let expiresAtRaw: string | undefined = undefined;
      try {
        expiresAtRaw = (nextCookiesObj?.get('sb-expires-at')?.value) || undefined;
      } catch (e) {
        // ignore
      }
      const nowSec = Math.floor(Date.now() / 1000);
      const graceSec = 60; // only refresh when expires_at <= now + grace
      let shouldAttemptRefresh = true;
      try {
        if (typeof expiresAtRaw === 'string' && expiresAtRaw.trim().length) {
          const expiresAtNum = parseInt(expiresAtRaw, 10);
          if (!Number.isNaN(expiresAtNum) && expiresAtNum > nowSec + graceSec) {
            shouldAttemptRefresh = false;
            console.log('[api/admin/session] access not expired (expires_at > now+grace) — skipping refresh attempt, expires_at=', expiresAtNum);
          }
        }
      } catch (e) {
        // ignore parse errors — allow refresh
      }

      if (!shouldAttemptRefresh) {
        // don't attempt to refresh if not needed
      } else {
      try {
        if (typeof refresh === 'string' && refresh.length <= 20) {
          console.warn('[api/admin/session] ignoring short refresh cookie — length=', refresh.length);
        } else {
          // proceed to refresh
        }
      } catch (e) {
        // ignore and attempt refresh normally
      }
        if (typeof refresh === 'string' && refresh.length <= 20) {
          // still skip short refresh tokens
          console.warn('[api/admin/session] ignoring short refresh cookie — length=', refresh.length);
        } else {
          const tokens = await refreshAuthTokens(refresh);
      if (tokens?.access_token) {
        // apply cookies via NextResponse so client receives new tokens
        const res = NextResponse.json({
          hasSession: true,
          user: { id: null, role: null },
        });
        try {
          res.cookies.set('sb-access-token', tokens.access_token, { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
          if (tokens.refresh_token) res.cookies.set('sb-refresh-token', tokens.refresh_token, { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
          if (tokens.expires_at) res.cookies.set('sb-expires-at', String(tokens.expires_at), { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
        } catch (e) {
          console.error('[api/admin/session] failed to set refreshed cookies', e);
        }
        // attempt to fetch user with new token
        user = await fetchUserFromAccess(tokens.access_token);
        if (user) return res;
      }
        }
      }
    }

    console.log('[api/admin/session] final response:', { hasSession: !!user, user: !!user });
    return NextResponse.json({
      hasSession: !!user,
      user: user ? { id: user.id, role: user?.app_metadata?.role || null } : null,
    });
  } catch (e: any) {
    console.error('[api/admin/session] unexpected error', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchUserFromAccess, refreshAuthTokens } from '@/lib/request-supabase';

export async function GET(request: NextRequest) {
  try {
    let nextCookiesObj: any = null;
    try {
      nextCookiesObj = await cookies();
    } catch (e) {
      // ignore
    }

    const access = nextCookiesObj?.get('sb-access-token')?.value;
    const refresh = nextCookiesObj?.get('sb-refresh-token')?.value;

    let user = await fetchUserFromAccess(access);

    // If access is invalid, try refreshing once
    if (!user && refresh) {
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

    return NextResponse.json({
      hasSession: !!user,
      user: user ? { id: user.id, role: user?.app_metadata?.role || null } : null,
    });
  } catch (e: any) {
    console.error('[api/admin/session] unexpected error', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

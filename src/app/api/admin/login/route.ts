import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호가 필요합니다' }, { status: 400 });
    }

    // Acquire RequestCookies and Headers objects before creating the route client.
    let nextCookiesObj: any = null;
    try {
      nextCookiesObj = await cookies();
    } catch (e) {
      // fallthrough - leave null
    }
    // Create a safe cookies wrapper that provides `get` and `set` for the
    // auth helper. `set` will record cookie writes into `pendingSetCookies` so
    // we can apply them to the NextResponse after sign-in completes. This
    // prevents runtime errors when the helper expects a mutable cookies
    // object but the route runtime gives an accessor without `set`.
    const pendingSetCookies: Array<{ name: string; value: string; options?: any }> = [];
    const cookieWrapper = {
      get: (name: string) => {
        try {
          return nextCookiesObj?.get(name)?.value;
        } catch (e) {
          return undefined;
        }
      },
      set: (name: string, value: string, options?: any) => {
        try {
          pendingSetCookies.push({ name, value, options });
        } catch (e) {
          // ignore
        }
      },
      delete: (name: string, options?: any) => {
        try {
          pendingSetCookies.push({ name, value: '', options: { ...(options || {}), maxAge: 0 } });
        } catch (e) {
          // ignore
        }
      },
    } as any;

    const routeSupabase = createRouteHandlerClient({ cookies: () => cookieWrapper });

    const { data, error } = await routeSupabase.auth.signInWithPassword({
      email,
      password,
    });

    // More detailed debug logging for sign-in. Avoid printing tokens.
    console.log('[api/admin/login] signInWithPassword completed, error=', !!error, 'message=', error?.message);

    if (error) {
      console.error('[api/admin/login] signIn error detail:', error);
      return NextResponse.json({ error: error.message || '로그인 실패' }, { status: 401 });
    }

    // On success, the auth-helpers may have recorded cookie writes via our
    // wrapper; apply any pending cookies to the outgoing response.
    const response = NextResponse.json({ success: true });
    try {
      console.log('[api/admin/login] pendingSetCookies count before apply:', pendingSetCookies.length);
      for (const c of pendingSetCookies) {
        try {
          console.log('[api/admin/login] applying cookie:', c.name, 'httpOnly=', !!c.options?.httpOnly, 'secure=', !!c.options?.secure);
          const opts: any = {};
          if (c.options) {
            if (typeof c.options.httpOnly !== 'undefined') opts.httpOnly = !!c.options.httpOnly;
            if (typeof c.options.path !== 'undefined') opts.path = c.options.path;
            if (typeof c.options.maxAge !== 'undefined') opts.maxAge = c.options.maxAge;
            if (typeof c.options.sameSite !== 'undefined') opts.sameSite = c.options.sameSite;
            if (typeof c.options.secure !== 'undefined') opts.secure = c.options.secure;
            if (typeof c.options.domain !== 'undefined') opts.domain = c.options.domain;
            if (typeof c.options.expires !== 'undefined') opts.expires = c.options.expires;
          }
          // Ensure Supabase auth cookies are HttpOnly and Secure where appropriate.
          // Some runtimes or helper layers may omit explicit flags; force sensible
          // defaults for auth-related cookies to avoid exposing tokens to JS.
          try {
            const nameLower = (c.name || '').toLowerCase();
            const looksLikeAuth = nameLower.startsWith('sb-') || nameLower.includes('auth') || nameLower.includes('token');
            if (looksLikeAuth) {
              if (typeof opts.httpOnly === 'undefined') opts.httpOnly = true;
              if (typeof opts.secure === 'undefined') opts.secure = process.env.NODE_ENV === 'production';
              if (typeof opts.sameSite === 'undefined') opts.sameSite = 'lax';
            }
          } catch (e) {
            // ignore
          }
          response.cookies.set(c.name, c.value, opts);
        } catch (e) {
          console.error('[api/admin/login] failed to apply pending cookie', c.name, e);
        }
      }
    } catch (e) {
      console.error('[api/admin/login] error applying pending cookies', e);
    }
    return response;
  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { signAdminSession } from '@/lib/admin-session';

export async function POST(request: NextRequest) {
  try {
    // Support JSON, urlencoded and multipart form submissions.
    let parsedBody: any = {};
    const ct = String(request.headers.get('content-type') || '').toLowerCase();
    try {
      if (ct.includes('application/json')) {
        parsedBody = await request.json();
      } else if (ct.includes('application/x-www-form-urlencoded')) {
        const txt = await request.text();
        const params = new URLSearchParams(txt || '');
        parsedBody = { email: params.get('email') || undefined, password: params.get('password') || undefined };
      } else if (ct.includes('multipart/form-data')) {
        const form = await request.formData();
        const emailVal = form.get('email');
        const passwordVal = form.get('password');
        parsedBody = {
          email: typeof emailVal === 'string' ? emailVal : emailVal?.toString?.() || undefined,
          password: typeof passwordVal === 'string' ? passwordVal : passwordVal?.toString?.() || undefined,
        };
      } else {
        // Unknown content-type: try JSON, then formData, then text fallback.
        try {
          parsedBody = await request.json();
        } catch (e) {
          try {
            const form = await request.formData();
            const emailVal = form.get('email');
            const passwordVal = form.get('password');
            parsedBody = {
              email: typeof emailVal === 'string' ? emailVal : emailVal?.toString?.() || undefined,
              password: typeof passwordVal === 'string' ? passwordVal : passwordVal?.toString?.() || undefined,
            };
          } catch (e2) {
            try {
              const txt = await request.text();
              const params = new URLSearchParams(txt || '');
              parsedBody = { email: params.get('email') || undefined, password: params.get('password') || undefined };
            } catch (e3) {
              parsedBody = {};
            }
          }
        }
      }
    } catch (e) {
      parsedBody = {};
    }
    const { email, password } = parsedBody;

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

    const cookieMethods = {
      getAll: () => {
        try {
          return nextCookiesObj?.getAll ? nextCookiesObj.getAll().map((c: any) => ({ name: c.name, value: c.value })) : [];
        } catch (e) {
          return [];
        }
      },
      setAll: async (setCookies: any[]) => {
        try {
          // Forward writes from the helper to our cookieWrapper so they are
          // recorded in `pendingSetCookies` and later applied to the response.
          for (const sc of setCookies || []) {
            try {
              cookieWrapper.set(sc.name, sc.value, sc.options || {});
            } catch (e) {
              // ignore individual cookie failures
            }
          }
        } catch (e) {
          // ignore
        }
      },
    };
    const routeSupabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: cookieMethods });

    const { data, error } = await routeSupabase.auth.signInWithPassword({
      email,
      password,
    });

    // More detailed debug logging for sign-in. Avoid printing tokens.
    try {
      const hasSession = !!data?.session;
      const hasAccess = !!(data?.session?.access_token);
      const hasRefresh = !!(data?.session?.refresh_token);
      // Show masked preview so we can debug token contents without printing secrets.
      try {
        const accessPreview = data?.session?.access_token ? `${String(data.session.access_token).slice(0, 20)}...len=${String(data.session.access_token).length}` : '[none]';
        const refreshPreview = data?.session?.refresh_token ? `${String(data.session.refresh_token).slice(0, 20)}...len=${String(data.session.refresh_token).length}` : '[none]';
        console.log('[api/admin/login] signInWithPassword completed, error=', !!error, 'message=', error?.message, 'hasSession=', hasSession, 'hasAccess=', hasAccess, 'hasRefresh=', hasRefresh, 'accessPreview=', accessPreview, 'refreshPreview=', refreshPreview);
      } catch (e) {
        console.log('[api/admin/login] signInWithPassword completed (could not inspect tokens)');
      }
    } catch (e) {
      console.log('[api/admin/login] signInWithPassword completed (could not inspect data)');
    }

    if (error) {
      console.error('[api/admin/login] signIn error detail:', error);
      return NextResponse.json({ error: error.message || '로그인 실패' }, { status: 401 });
    }

    // On success, the auth-helpers may have recorded cookie writes via our
    // wrapper; apply any pending cookies to the outgoing response.
    // Return a redirect so the browser navigates to the admin list and
    // includes cookies set on this response. This helps avoid the client
    // repeatedly polling the session endpoint while cookies are not yet
    // present.
    const redirectUrl = new URL('/admin/posts', request.url || undefined);
    const response = NextResponse.redirect(redirectUrl);
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
              opts.httpOnly = true;
              opts.secure = process.env.NODE_ENV === 'production';
              opts.sameSite = 'lax';
              if (typeof opts.path === 'undefined') opts.path = '/';
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
    // Additionally set refresh token cookie from data.session only when
    // the helper did not already record a refresh cookie. Prevent overwriting
    // a helper-provided long refresh cookie with a possibly masked/short
    // value returned in data.session.
    try {
      const helperHasRefresh = pendingSetCookies.some((pc) => /refresh-token/i.test(String(pc.name || '')) || (String(pc.name || '').endsWith('-refresh-token')));
      // If helper did write a refresh cookie but it looks suspiciously short
      // (eg. <= 20 chars), and the sign-in response contains a longer
      // refresh_token, prefer the response token and overwrite the cookie.
      const helperRefreshCookie = pendingSetCookies.find((pc) => /refresh-token/i.test(String(pc.name || '')) || (String(pc.name || '').endsWith('-refresh-token')));
      const respRefresh = data?.session?.refresh_token;
      const helperRefreshValue = helperRefreshCookie ? String(helperRefreshCookie.value || '') : '';
      const isHelperRefreshShort = helperRefreshValue && helperRefreshValue.length > 0 && helperRefreshValue.length <= 20;
      const isRespRefreshLong = respRefresh && String(respRefresh).length > 20;
      if (helperRefreshCookie && isHelperRefreshShort && isRespRefreshLong) {
        try {
          console.log('[api/admin/login] helper wrote short refresh cookie, overwriting with response refresh_token');
          response.cookies.set(String(helperRefreshCookie.name), String(respRefresh), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
          });
        } catch (e) {
          console.error('[api/admin/login] failed overwriting short helper refresh cookie', e);
        }
      }
      if (!helperHasRefresh && data?.session?.refresh_token) {
        // Accept refresh tokens returned by signInWithPassword and persist
        // them to cookies so subsequent server-side session checks can use
        // the refresh flow. Some deployments unpredictably return short
        // refresh tokens; while uncommon this is better handled by writing
        // the token and allowing the refresh endpoint to validate it instead
        // of silently skipping and leaving the browser without a refresh token.
        try {
          const rawRefresh = String(data.session.refresh_token || '');
          if (rawRefresh.length <= 20) {
            // warn but persist: this avoids dropping sessions when the
            // returned token is short but still functional for this project.
            console.warn('[api/admin/login] refresh_token from signIn looks short; persisting anyway length=', rawRefresh.length);
          } else {
            console.log('[api/admin/login] helper did not write a refresh cookie — setting sb-refresh-token from data.session');
          }
          response.cookies.set('sb-refresh-token', data.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
          });
        } catch (e) {
          console.error('[api/admin/login] failed to set sb-refresh-token from response', e);
        }
      } else if (helperHasRefresh) {
        console.log('[api/admin/login] helper wrote refresh cookie — skipping manual sb-refresh-token write');
      }
    } catch (e) {
      console.error('[api/admin/login] failed to set refresh token cookie', e);
    }
    // If the auth helper didn't write cookies into our wrapper, ensure we
    // still set the essential Supabase session cookies from the returned
    // session object so the browser receives them and subsequent requests
    // will include the access/refresh tokens.
    try {
      // Always ensure the essential Supabase session cookies are present
      // based on the response session object. Some helper layers may set
      // project-scoped cookie names (like sb-<ref>-auth-token) and omit
      // the canonical sb-access-token / sb-refresh-token names we expect
      // later when verifying sessions. To be robust, populate these
      // canonical cookies from the returned session object when available.
      if (data?.session) {
        console.log('[api/admin/login] no pending cookies written by helper, applying manual cookie fallback');
        const sess = data.session as any;
        const devSecure = process.env.NODE_ENV === 'production';
        // access token
        try {
          // ensure an HttpOnly sb-access-token for server-side checks
          response.cookies.set('sb-access-token', sess.access_token, {
            httpOnly: true,
            secure: devSecure,
            sameSite: 'lax',
            path: '/',
            maxAge: typeof sess.expires_in === 'number' ? sess.expires_in : undefined,
          });
        } catch (e) {
          console.error('[api/admin/login] failed to set sb-access-token cookie', e);
        }
        // refresh token
        try {
          // Persist refresh token if present (we earlier warn about short
          // values but still write them so the client receives a refresh
          // value generated by the auth endpoint).
          response.cookies.set('sb-refresh-token', sess.refresh_token, {
            httpOnly: true,
            secure: devSecure,
            sameSite: 'lax',
            path: '/',
            // keep refresh longer (30 days) unless helper specifies otherwise
            maxAge: 60 * 60 * 24 * 30,
          });
        } catch (e) {
          console.error('[api/admin/login] failed to set sb-refresh-token cookie', e);
        }
        // expires at (unix seconds or ISO) — store as string for compatibility
        try {
          const expiresAt = sess.expires_at || (typeof sess.expires_in === 'number' ? Math.floor(Date.now() / 1000) + sess.expires_in : undefined);
          if (typeof expiresAt !== 'undefined') {
            response.cookies.set('sb-expires-at', String(expiresAt), {
              httpOnly: true,
              secure: devSecure,
              sameSite: 'lax',
              path: '/',
            });
          }
        } catch (e) {
          console.error('[api/admin/login] failed to set sb-expires-at cookie', e);
        }
      }
    } catch (e) {
      console.error('[api/admin/login] manual cookie fallback failed', e);
    }
    try {
      // If the authenticated user appears to be an admin, issue a server-side
      // admin session cookie so the admin UI can rely on a stable HttpOnly
      // session independent of Supabase refresh behavior.
      const userObj: any = data?.user || null;
      // Determine admin status. In normal operation this relies on
      // user_metadata.is_admin or app_metadata.role === 'admin'. For
      // deterministic local testing and E2E we allow a safe dev fallback
      // for emails on the example.local domain so tests that sign in a
      // dev user still get an admin-session cookie.
      const isAdmin = !!(
        userObj && (
          userObj.user_metadata?.is_admin ||
          userObj.app_metadata?.role === 'admin' ||
          (process.env.NODE_ENV !== 'production' && typeof userObj.email === 'string' && userObj.email.endsWith('@example.local'))
        )
      );
      if (isAdmin) {
        try {
          const token = signAdminSession({ id: userObj.id, email: userObj.email, role: userObj.app_metadata?.role || 'admin' });
          if (token) {
            response.cookies.set('admin-session', token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 60 * 60 * 24 * 30,
            });
            console.log('[api/admin/login] admin-session cookie set for user', userObj.id);
          }
        } catch (e) {
          console.error('[api/admin/login] failed to set admin-session cookie', e);
        }
      }
    } catch (e) {
      // ignore any admin-session side effects
    }

    return response;
  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

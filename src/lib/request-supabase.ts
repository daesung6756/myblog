import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createClientWithAccess(accessToken?: string) {
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  return createClient(SUPABASE_URL, SUPABASE_ANON, { global: { headers } });
}

export function createServiceRoleClient() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceRole) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  // Use the service role as the main auth header and still send anon apikey
  return createClient(SUPABASE_URL, serviceRole, { global: { headers: { Authorization: `Bearer ${serviceRole}`, apikey: SUPABASE_ANON } } });
}

export async function fetchUserFromAccess(accessToken?: string) {
  if (!accessToken) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function refreshAuthTokens(refreshToken: string | undefined) {
  if (!refreshToken) return null;
  // Helper to detect refresh tokens that are plausibly valid.
  // Valid refresh tokens are often JWTs (contain dot) or long opaque strings.
  // Reject obviously short placeholders to avoid needless requests.
  function isLikelyValidRefreshToken(t: string | undefined) {
    if (!t) return false;
    try {
      const s = String(t);
      // If it's a JWT-like value (has two dots) treat as valid.
      if (s.split('.').length === 3) return true;
      // If it looks like a base64url-like opaque token and reasonably long, accept.
      // Use a conservative minimum length of 40 characters.
      const base64UrlRegex = /^[A-Za-z0-9_-]{40,}$/;
      if (base64UrlRegex.test(s)) return true;
      // If token is very long (>= 64), accept regardless of characters.
      if (s.length >= 64) return true;
      return false;
    } catch (e) {
      return false;
    }
  }
  // Some environments or dev helpers may set short placeholder refresh tokens
  // (<= 20 chars). Treat those as invalid so we don't attempt to use them for
  // real token refreshes — they will always fail and pollute logs. This also
  // prevents sending obviously invalid tokens to the Supabase auth endpoint.
    try {
      if (!isLikelyValidRefreshToken(refreshToken)) {
        console.warn('[request-supabase] refresh token failed basic validation; skipping refresh attempt preview=', typeof refreshToken === 'string' ? `${refreshToken.slice(0, 24)}...len=${refreshToken.length}` : String(refreshToken));
        return null;
      }
  } catch (e) {
    // ignore length-check errors and proceed
  }
  try {
    // Debug: log a masked preview of the refresh token so we can diagnose bad formatting
    try {
      const preview = typeof refreshToken === 'string' ? `${refreshToken.slice(0, 8)}...len=${refreshToken.length}` : String(refreshToken);
      console.log('[request-supabase] refresh attempt, token preview:', preview);
    } catch (e) {
      console.log('[request-supabase] refresh attempt, token preview unavailable');
    }
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', refreshToken);

    // Prefer using the service role key for server-side refreshes when available.
    // This keeps refresh logic server-only and avoids relying on client anon keys.
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const authHeader = serviceRole ? `Bearer ${serviceRole}` : `Bearer ${SUPABASE_ANON}`;
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apikey: SUPABASE_ANON,
        Authorization: authHeader,
      },
      body: body.toString(),
    });
    // debug outgoing body for visibility (masked)
    try {
      const masked = body.toString().replace(/refresh_token=[^&]+/, 'refresh_token=[REDACTED]');
      console.log('[request-supabase] refresh outgoing body:', masked);
    } catch (e) {
      // ignore
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[request-supabase] refresh failed', res.status, text);

      // Some Supabase deployments (or proxies) may expect JSON instead of
      // application/x-www-form-urlencoded for token refresh. If we see a
      // bad_json hint, try again with a JSON body as a fallback.
      if (res.status === 400 && String(text || '').toLowerCase().includes('bad_json')) {
        try {
          console.log('[request-supabase] retrying refresh using application/json body');
          const jsonRes = await fetch(`${SUPABASE_URL}/auth/v1/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON,
              Authorization: authHeader,
            },
            body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refreshToken }),
          });
          if (!jsonRes.ok) {
            const t2 = await jsonRes.text().catch(() => '');
            console.error('[request-supabase] refresh (json) failed', jsonRes.status, t2);
            return null;
          }
          const d2 = await jsonRes.json();
          return d2;
        } catch (e) {
          console.error('[request-supabase] refresh (json) exception', e);
          return null;
        }
      }
      return null;
    }
    const data = await res.json();
    // data contains access_token, refresh_token, expires_in, expires_at, token_type
    return data;
  } catch (e) {
    console.error('[request-supabase] refresh exception', e);
    return null;
  }
}

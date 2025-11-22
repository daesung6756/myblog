import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createClientWithAccess(accessToken?: string) {
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  return createClient(SUPABASE_URL, SUPABASE_ANON, { global: { headers } });
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
  try {
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', refreshToken);

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apikey: SUPABASE_ANON,
      },
      body: body.toString(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[request-supabase] refresh failed', res.status, text);
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

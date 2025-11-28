import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginPageClient from "./LoginClient";
import { fetchUserFromAccess } from '@/lib/request-supabase';

export default async function LoginPage() {
  // Server-side: check if a session exists and redirect to admin posts.
  // Use the request-scoped `cookies()` and `headers()` helpers directly
  // (they are sync functions in the App Router) to avoid type mismatches
  const nextCookies = await cookies();

  // Detect access/refresh token values from possible cookie name patterns
  let access: string | undefined;
  let refresh: string | undefined;
  try {
    const all = nextCookies.getAll ? nextCookies.getAll() : [];
    for (const c of all) {
      const name = String(c.name || '').toLowerCase();
      const value = c.value;
      if (!access && (name === 'sb-access-token' || /auth-token/i.test(name) || name.includes('auth_token') || name.endsWith('-auth-token'))) {
        access = value;
      }
      if (!refresh && (name === 'sb-refresh-token' || /refresh-token/i.test(name) || name.endsWith('-refresh-token'))) {
        refresh = value;
      }
    }
    const cookieList = all.map((c: any) => c.name + '=' + (c.value ? '[REDACTED]' : '[EMPTY]'));
    console.log('[admin/login] server render, cookies:', cookieList.join('; '), 'foundAccess=', !!access, 'foundRefresh=', !!refresh);
  } catch (e) {
    console.log('[admin/login] server render, cookie detection failed', e);
  }

  // Validate access token by calling Supabase user endpoint directly.
  const user = await fetchUserFromAccess(access);
  if (user) {
    console.log('[admin/login] server render - valid access token, redirecting to /admin/posts, user id=', user?.id);
    redirect('/admin/posts');
  }

  return <LoginPageClient />;
}

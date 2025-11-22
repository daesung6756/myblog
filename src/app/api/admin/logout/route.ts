import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    let nextCookiesObj: any = null;
    try {
      nextCookiesObj = await cookies();
    } catch (e) {
      // ignore
    }
    const cookieMethods = {
      getAll: () => (nextCookiesObj?.getAll ? nextCookiesObj.getAll().map((c: any) => ({ name: c.name, value: c.value })) : []),
      setAll: async (_setCookies: any[]) => { /* noop */ },
    };
    const routeSupabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: cookieMethods });
    const { error } = await routeSupabase.auth.signOut();
    if (error) {
      console.error('[api/admin/logout] signOut error:', error.message || error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[api/admin/logout] unexpected error', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

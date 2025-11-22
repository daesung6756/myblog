import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    let nextCookiesObj: any = null;
    try {
      nextCookiesObj = await cookies();
    } catch (e) {
      // ignore
    }
    const routeSupabase = createRouteHandlerClient({ cookies: () => nextCookiesObj });
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

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    let nextCookiesObj: any = null;
    try {
      nextCookiesObj = await cookies();
    } catch (e) {
      // ignore
    }
    const routeSupabase = createRouteHandlerClient({ cookies: () => nextCookiesObj });
    const { data: sessionData, error } = await routeSupabase.auth.getSession();
    const session = (sessionData as any)?.session;
    if (error) {
      console.error('[api/admin/session] getSession error:', error.message || error);
    }

    return NextResponse.json({
      hasSession: !!session,
      user: session ? { id: session.user.id, role: session.user.app_metadata?.role || null } : null,
    });
  } catch (e: any) {
    console.error('[api/admin/session] unexpected error', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

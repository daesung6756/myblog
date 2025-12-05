import { NextResponse } from 'next/server';

export async function GET() {
  // Dev-only: return whether ADMIN_SESSION_SECRET is present in the server
  // environment so tests can detect mismatched env loading.
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ ok: false }, { status: 403 });
  return NextResponse.json({ hasAdminSessionSecret: !!process.env.ADMIN_SESSION_SECRET });
}

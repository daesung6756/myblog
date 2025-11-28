import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-server';



export async function POST(request: NextRequest) {
  try {
    // Obtain RequestCookies helper for auth; avoid logging raw cookie values.
    let nextCookiesObj: any = null;
    try {
      nextCookiesObj = await cookies();
    } catch (e) {
      console.error('[upload-image/POST] cookies() invocation failed');
    }

    // Authenticate the request: prefer request-scoped supabase session, but
    // allow a server-side admin-session cookie for dev/testing so admin flows
    // (service-role uploads) can be exercised.
    const authClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: nextCookiesObj });
    const { data: { session } } = await authClient.auth.getSession();

    // If there's no Supabase session, check for our server-side admin-session
    // (dev-only helper sets this). If present and valid, treat request as
    // authenticated admin and allow the upload.
    let isAdminSession = false;
    if (!session) {
      try {
        const adminCookie = nextCookiesObj?.get('admin-session')?.value;
        if (adminCookie) {
          const { verifyAdminSession } = await import('@/lib/admin-session');
          const admin = verifyAdminSession(adminCookie);
          if (admin) isAdminSession = true;
        }
      } catch (e) {
        // ignore
      }
    }

    if (!session && !isAdminSession) {
      // In development, allow server-side service-role uploads when explicitly
      // configured so E2E/dev flows can run without a Supabase session.
      const allowDevSrv = process.env.NODE_ENV !== 'production' && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!allowDevSrv) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 체크 (2MB 이하)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기가 너무 큽니다. (최대 2MB)' },
        { status: 400 }
      );
    }

    // 파일명 생성
    const fileExt = 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `images/${fileName}`;

    // Supabase Storage에 업로드 (서버 admin 클라이언트 사용)
    const { data, error } = await supabaseAdmin.storage
      .from('blog-images')
      .upload(filePath, file, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Supabase 업로드 에러:', error);
      throw error;
    }

    // Public URL 가져오기
    const { data: publicData } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    return NextResponse.json({ publicUrl: publicData.publicUrl });
  } catch (error: any) {
    console.error('이미지 업로드 실패:', error);
    return NextResponse.json(
      { error: error.message || '이미지 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}

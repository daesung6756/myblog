import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from 'next/headers';
import { createClientWithAccess, createServiceRoleClient, refreshAuthTokens, fetchUserFromAccess } from '@/lib/request-supabase';
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { success: 0, error: "No file provided" },
        { status: 400 }
      );
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 이미지 압축 (60% 품질, WebP 형식으로 변환)
    const compressedBuffer = await sharp(buffer)
      .webp({ quality: 60 }) // 60% 품질로 WebP 변환
      .toBuffer();

    // 파일명 생성 (타임스탬프 + 원본 파일명, 확장자는 .webp로 변경)
    const timestamp = Date.now();
    const originalName = file.name.replace(/\.[^/.]+$/, ""); // 확장자 제거
    const fileName = `${timestamp}-${originalName}.webp`;

    // 먼저 요청 스코프 인증이 있으면 그 클라이언트로 시도
    let usedClient = supabase;
    let uploadResult: any = null;
    let uploadError: any = null;

    try {
      let nextCookiesObj: any = null;
      try { nextCookiesObj = await cookies(); } catch (e) {}
      // If admin-session cookie exists, prefer service-role upload immediately
        // If admin-session cookie exists, prefer service-role upload immediately
        try {
          const adminCookieDirect = nextCookiesObj?.get('admin-session')?.value;
          if (adminCookieDirect) {
            const admin = (await import('@/lib/admin-session')).verifyAdminSession(adminCookieDirect);
            if (admin) {
              const srv = createServiceRoleClient();
              usedClient = srv;
              const res = await srv.storage.from("blog-images").upload(fileName, compressedBuffer, {
                cacheControl: "3600",
                upsert: false,
                contentType: "image/webp",
              });
              uploadResult = res;
              uploadError = res.error;
            }
          }
        } catch (e) {
          // continue to normal flow if admin-session check fails
        }
      // Try request-scoped client if cookies appear (we already fetched cookies above)
      const access = nextCookiesObj?.get('sb-access-token')?.value;
      const refresh = nextCookiesObj?.get('sb-refresh-token')?.value;

      if (access) {
        const routeSupabase = createClientWithAccess(access);
        // attempt upload with access-scoped client
        usedClient = routeSupabase;
        const res = await routeSupabase.storage
          .from("blog-images")
          .upload(fileName, compressedBuffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: "image/webp",
          });
        uploadResult = res;
        uploadError = res.error;
      } else if (refresh) {
        // try one-time refresh and retry
        const tokens = await refreshAuthTokens(refresh);
        if (tokens?.access_token) {
          const routeSupabase = createClientWithAccess(tokens.access_token);
          usedClient = routeSupabase;
          const res = await routeSupabase.storage
            .from("blog-images")
            .upload(fileName, compressedBuffer, {
              cacheControl: "3600",
              upsert: false,
              contentType: "image/webp",
            });
          uploadResult = res;
          uploadError = res.error;
        }
      }
    } catch (e) {
      // swallow and allow fallback
      uploadError = e;
      uploadResult = null;
    }

    // If the request-scoped attempt failed due to auth/permission and we allow
    // server-side fallback, try using the service-role client to ensure admin
    // uploads succeed in environments where client sessions might be broken.
    if ((!uploadResult || uploadError) && (process.env.NODE_ENV !== 'production' || String(process.env.ALLOW_SERVICE_ROLE_FALLBACK) === 'true')) {
      try {
        const srv = createServiceRoleClient();
        usedClient = srv;
        const res = await srv.storage.from("blog-images").upload(fileName, compressedBuffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/webp",
        });
        uploadResult = res;
        uploadError = res.error;
        if (!uploadError) {
          console.log('[api/upload] service-role fallback used for image upload:', fileName);
          try { (await import('@/lib/audit')).logAudit({ route: '/api/upload', method: 'POST', action: 'upload', resource: 'blog-images', id: fileName, user: null, reason: 'service_role_fallback' }); } catch (e) {}
        }
      } catch (e) {
        uploadError = e;
      }
    }

    // After attempts, examine result/error
    const { data, error } = uploadResult || { data: null, error: uploadError };

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { success: 0, error: error.message },
        { status: 500 }
      );
    }

    // 공개 URL 가져오기 (사용한 클라이언트 기준)
    const { data: publicData } = await usedClient.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    // Editor.js 이미지 툴 응답 형식
    return NextResponse.json({
      success: 1,
      file: {
        url: publicData.publicUrl,
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { success: 0, error: "Upload failed" },
      { status: 500 }
    );
  }
}

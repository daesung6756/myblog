import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClientWithAccess, fetchUserFromAccess, refreshAuthTokens } from '@/lib/request-supabase';
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export async function DELETE(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const password = body.password;
    // allow admin token to be passed in request body as a fallback
    const adminTokenFromBody = body.adminToken as string | undefined;

    // Prepare route-scoped Supabase client (uses the request cookies/headers)
    // so DB operations run in the right authentication/RLS context.
    let nextCookiesObj: any = null;
    try {
      nextCookiesObj = await cookies();
    } catch (e) {
      // ignore
    }
    const access = nextCookiesObj?.get('sb-access-token')?.value;
    const refresh = nextCookiesObj?.get('sb-refresh-token')?.value;

    // Create a request-scoped client that will send the access token as
    // an Authorization header. If the token is expired we'll attempt a
    // one-time refresh and retry.
    let routeSupabase = createClientWithAccess(access);

    // If a server-side admin session exists, treat this request as an
    // admin and use the service-role client so admin deletes/updates work
    // even when access/refresh tokens are missing or short.
    let isAdmin = false;
    try {
      const adminCookie = nextCookiesObj?.get('admin-session')?.value;
      if (adminCookie) {
        const admin = (await import('@/lib/admin-session')).verifyAdminSession(adminCookie);
        if (admin) {
          const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (serviceRole) {
            const adminClient = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '', serviceRole);
            routeSupabase = adminClient as any;
            isAdmin = true;
          }
        }
      }
    } catch (e) {
      // ignore and fall back to token-based check
    }

    if (!isAdmin) {
      try {
        const user = await fetchUserFromAccess(access);
        isAdmin = !!(user && (user.user_metadata?.is_admin || user.app_metadata?.role === 'admin'));
      } catch (e) {
        console.error('[comments/[id]/DELETE] auth check failed:', e);
      }
    }

    if (!isAdmin && !password) {
      return NextResponse.json(
        { error: "비밀번호를 입력해주세요" },
        { status: 400 }
      );
    }

    // 댓글 조회
    const { data: comment, error: fetchError } = await routeSupabase
      .from("comments")
      .select("password_hash")
      .eq("id", id)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // If not admin, check the provided password
    if (!isAdmin) {
      const isValid = await bcrypt.compare(password, comment.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: "비밀번호가 일치하지 않습니다" },
          { status: 401 }
        );
      }
    }

    // If admin, perform a soft-delete by setting `deleted_at` (and record admin delete).
    // If the `deleted_at` column does not exist, fall back to hard delete.
    if (isAdmin) {
      let updateError: any = null;
      let updateData: any = null;
      try {
        // Try to perform the update in the request-scoped context first.
        try {
          const ures = await routeSupabase
            .from("comments")
            .update({ deleted_at: new Date().toISOString(), deleted_by_admin: true })
            .eq("id", id)
            .select()
            .single();
          updateError = ures.error;
          updateData = ures.data;
        } catch (e) {
          updateError = e;
        }

        // If update didn't persist (no error but no updated row) or RLS blocked it,
        // and we have a SUPABASE_SERVICE_ROLE_KEY, perform the update with a
        // privileged server-side client. This ensures admin actions can modify
        // rows even if RLS prevents the route-scoped client.
        if ((!updateError && !updateData) || updateError) {
          const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (serviceRole) {
            try {
              const adminClient = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '', serviceRole);
              const ares = await adminClient
                .from('comments')
                .update({ deleted_at: new Date().toISOString(), deleted_by_admin: true })
                .eq('id', id)
                .select()
                .single();
              if (ares.error) {
                console.error('[comments/[id]/DELETE] adminClient update error:', ares.error);
              } else {
                try { (await import('@/lib/audit')).logAudit({ route: '/api/comments/[id]', method: 'DELETE', action: 'admin-update', resource: 'comments', id, user: null, reason: 'service_role_admin_fallback' }); } catch (e) {}
                console.log('[comments/[id]/DELETE] service-role/adminClient update succeeded (admin fallback) id=', id);
                updateData = ares.data;
                updateError = null;
              }
            } catch (e) {
              console.error('[comments/[id]/DELETE] adminClient update exception:', e);
            }
          }
        }

        if (updateError && /deleted_at|deleted_by_admin/.test(String(updateError.message || updateError.details || ""))) {
          // fallthrough to hard delete
          const { error: deleteError2 } = await routeSupabase
            .from("comments")
            .delete()
            .eq("id", id);
          if (deleteError2) {
            return NextResponse.json({ error: "댓글 삭제에 실패했습니다" }, { status: 500 });
          }
        } else if (updateError) {
          return NextResponse.json({ error: "댓글 삭제에 실패했습니다" }, { status: 500 });
        }
      } catch (e) {
        // Try hard delete as a last resort
        const { error: deleteError3 } = await routeSupabase
          .from("comments")
          .delete()
          .eq("id", id);
        if (deleteError3) {
          return NextResponse.json({ error: "댓글 삭제에 실패했습니다" }, { status: 500 });
        }
      }
      // Fetch and return the updated comment so the client can apply authoritative state.
      // If we have updateData from either update attempt, return it; otherwise
      // try to fetch the row for best-effort authoritative data.
      if (updateData) {
        return NextResponse.json({ success: true, comment: updateData });
      }
      const { data: updatedComment, error: fetchUpdatedError } = await routeSupabase
        .from('comments')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchUpdatedError) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ success: true, comment: updatedComment });
    } else {
      // 댓글 삭제 (non-admin - hard delete after password check)
      const { error: deleteError } = await routeSupabase
        .from("comments")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return NextResponse.json(
          { error: "댓글 삭제에 실패했습니다" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

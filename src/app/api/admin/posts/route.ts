import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClientWithAccess, fetchUserFromAccess, refreshAuthTokens } from '@/lib/request-supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    

    let nextCookiesObj: any = null;
    try {
      nextCookiesObj = await cookies();
    } catch (e) {
      // ignore
    }
    const access = nextCookiesObj?.get('sb-access-token')?.value;
    const refresh = nextCookiesObj?.get('sb-refresh-token')?.value;

    // candidate payload from request body (for post - created_at set server-side)

    let routeSupabase = createClientWithAccess(access);
    let user: any = null;
    // If a server-side admin-session cookie exists, treat the request as an
    // authenticated admin and use the service-role client for privileged writes.
    try {
      const adminCookie = nextCookiesObj?.get('admin-session')?.value;
      if (adminCookie) {
        const admin = (await import('@/lib/admin-session')).verifyAdminSession(adminCookie);
        if (admin) {
          const { createServiceRoleClient } = await import('@/lib/request-supabase');
          routeSupabase = createServiceRoleClient();
          user = { id: admin.id, is_admin: true } as any;
        }
      }
    } catch (e) {
      // ignore
    }
    if (!user) user = await fetchUserFromAccess(access);
    // Prepare a candidate payload from the request body. If we authenticate
    // successfully below, we'll set the real author_id to the user's id.
    const candidatePayload: any = {
      title: body.title,
      slug: body.slug,
      summary: body.summary || null,
      content: body.content || null,
      tags: body.tags || [],
      ad_code_1: body.ad_code_1 || null,
      ad_code_2: body.ad_code_2 || null,
      published_at: body.published_at || null,
      author_id: body.author_id || null,
    };

    if (!user) {
      // try refresh once
      if (refresh) {
        const tokens = await refreshAuthTokens(refresh);
        if (tokens?.access_token) {
          const res = NextResponse.json({ error: null });
          try {
            res.cookies.set('sb-access-token', tokens.access_token, { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
            if (tokens.refresh_token) res.cookies.set('sb-refresh-token', tokens.refresh_token, { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
            if (tokens.expires_at) res.cookies.set('sb-expires-at', String(tokens.expires_at), { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
          } catch (e) {
            console.error('[api/admin/posts] failed to set refreshed cookies', e);
          }
          routeSupabase = createClientWithAccess(tokens.access_token);
          user = await fetchUserFromAccess(tokens.access_token);
        }
      }
    }
    if (!user) {
      // If we explicitly allow server-side fallbacks (dev by default, or
      // production when ALLOW_SERVICE_ROLE_FALLBACK=true), use the service
      // role key to perform writes so admin operations still persist.
      const allowFallback = process.env.NODE_ENV !== 'production' || String(process.env.ALLOW_SERVICE_ROLE_FALLBACK) === 'true';
      if (allowFallback) {
        try {
          const { createServiceRoleClient } = await import('@/lib/request-supabase');
          const srv = createServiceRoleClient();
          // Use body-provided author_id if present; otherwise set to null
          const payloadWithAuthor = { ...candidatePayload, author_id: candidatePayload.author_id || null };
          const { data, error } = await srv.from('posts').insert([payloadWithAuthor]).select();
          if (error) {
            console.error('[api/admin/posts] service-role insert error:', error);
            return NextResponse.json({ error: error.message || 'Insert failed (service role)' }, { status: 500 });
          }
          try { 
            (await import('@/lib/audit')).logAudit({ route: '/api/admin/posts', method: 'POST', action: 'insert', resource: 'posts', id: data?.[0]?.id || null, user: null, reason: 'service_role_fallback' });
          } catch (e) {}
          return NextResponse.json({ success: true, post: data?.[0] }, { status: 201 });
        } catch (e: any) {
          console.error('[api/admin/posts] service-role fallback failed', e);
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = { ...candidatePayload, author_id: user.id };

    const { data, error } = await routeSupabase.from("posts").insert([payload]).select();
    if (error) {
      console.error("[api/admin/posts] insert error:", error);
      return NextResponse.json({ error: error.message || "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data?.[0] }, { status: 201 });
  } catch (err: any) {
    console.error("[api/admin/posts] unexpected error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    let nextCookiesObj: any = null;
    try {
      nextCookiesObj = await cookies();
    } catch (e) {
      // ignore
    }
    const access = nextCookiesObj?.get('sb-access-token')?.value;
    const refresh = nextCookiesObj?.get('sb-refresh-token')?.value;

    const id = body.id;
    const payload: any = {
      title: body.title,
      slug: body.slug,
      summary: body.summary || null,
      content: body.content || null,
      tags: body.tags || [],
      ad_code_1: body.ad_code_1 || null,
      ad_code_2: body.ad_code_2 || null,
      updated_at: new Date().toISOString(),
    };
    let routeSupabase = createClientWithAccess(access);
    let user: any = null;
    try {
      const adminCookie = nextCookiesObj?.get('admin-session')?.value;
      if (adminCookie) {
        const admin = (await import('@/lib/admin-session')).verifyAdminSession(adminCookie);
        if (admin) {
          const { createServiceRoleClient } = await import('@/lib/request-supabase');
          routeSupabase = createServiceRoleClient();
          user = { id: admin.id, is_admin: true } as any;
        }
      }
    } catch (e) {}
    if (!user) user = await fetchUserFromAccess(access);
    if (!user) {
      // try refresh once
      if (refresh) {
        const tokens = await refreshAuthTokens(refresh);
        if (tokens?.access_token) {
          const res = NextResponse.json({ error: null });
          try {
            res.cookies.set('sb-access-token', tokens.access_token, { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
            if (tokens.refresh_token) res.cookies.set('sb-refresh-token', tokens.refresh_token, { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
            if (tokens.expires_at) res.cookies.set('sb-expires-at', String(tokens.expires_at), { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
          } catch (e) {
            console.error('[api/admin/posts] failed to set refreshed cookies', e);
          }
          routeSupabase = createClientWithAccess(tokens.access_token);
          user = await fetchUserFromAccess(tokens.access_token);
        }
      }
    }
    if (!user) {
      const allowFallback = process.env.NODE_ENV !== 'production' || String(process.env.ALLOW_SERVICE_ROLE_FALLBACK) === 'true';
      if (allowFallback) {
        try {
          const { createServiceRoleClient } = await import('@/lib/request-supabase');
          const srv = createServiceRoleClient();
          const { data, error } = await srv.from('posts').update(payload).eq('id', id).select();
          if (error) {
            console.error('[api/admin/posts] service-role update error:', error);
            return NextResponse.json({ error: error.message || 'Update failed (service role)' }, { status: 500 });
          }
          try { 
            (await import('@/lib/audit')).logAudit({ route: '/api/admin/posts', method: 'PUT', action: 'update', resource: 'posts', id, user: null, reason: 'service_role_fallback' });
          } catch (e) {}
          return NextResponse.json({ success: true, post: data?.[0] }, { status: 200 });
        } catch (e: any) {
          console.error('[api/admin/posts] service-role fallback failed (PUT)', e);
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { data, error } = await routeSupabase.from("posts").update(payload).eq("id", id).select();
    if (error) {
      console.error("[api/admin/posts] update error:", error);
      return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data?.[0] }, { status: 200 });
  } catch (err: any) {
    console.error("[api/admin/posts] unexpected error (PUT)", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    let nextCookiesObj: any = null;
    try {
      nextCookiesObj = await cookies();
    } catch (e) {
      // ignore
    }
    const access = nextCookiesObj?.get('sb-access-token')?.value;
    const refresh = nextCookiesObj?.get('sb-refresh-token')?.value;

    const id = body.id;
    let routeSupabase = createClientWithAccess(access);
    let user: any = null;
    try {
      const adminCookie = nextCookiesObj?.get('admin-session')?.value;
      if (adminCookie) {
        const admin = (await import('@/lib/admin-session')).verifyAdminSession(adminCookie);
        if (admin) {
          const { createServiceRoleClient } = await import('@/lib/request-supabase');
          routeSupabase = createServiceRoleClient();
          user = { id: admin.id, is_admin: true } as any;
        }
      }
    } catch (e) {}
    if (!user) user = await fetchUserFromAccess(access);
    if (!user && refresh) {
      const tokens = await refreshAuthTokens(refresh);
      if (tokens?.access_token) {
        const res = NextResponse.json({ error: null });
        try {
          res.cookies.set('sb-access-token', tokens.access_token, { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
          if (tokens.refresh_token) res.cookies.set('sb-refresh-token', tokens.refresh_token, { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
          if (tokens.expires_at) res.cookies.set('sb-expires-at', String(tokens.expires_at), { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production' });
        } catch (e) {
          console.error('[api/admin/posts] failed to set refreshed cookies', e);
        }
        routeSupabase = createClientWithAccess(tokens.access_token);
        user = await fetchUserFromAccess(tokens.access_token);
      }
    }
    if (!user) {
      const allowFallback = process.env.NODE_ENV !== 'production' || String(process.env.ALLOW_SERVICE_ROLE_FALLBACK) === 'true';
      if (allowFallback) {
        try {
          const { createServiceRoleClient } = await import('@/lib/request-supabase');
          const srv = createServiceRoleClient();
          const { error } = await srv.from('posts').delete().eq('id', id);
          if (error) {
            console.error('[api/admin/posts] service-role delete error:', error);
            return NextResponse.json({ error: error.message || 'Delete failed (service role)' }, { status: 500 });
          }
          try { 
            (await import('@/lib/audit')).logAudit({ route: '/api/admin/posts', method: 'DELETE', action: 'delete', resource: 'posts', id, user: null, reason: 'service_role_fallback' });
          } catch (e) {}
          return NextResponse.json({ success: true }, { status: 200 });
        } catch (e: any) {
          console.error('[api/admin/posts] service-role fallback failed (DELETE)', e);
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { error } = await routeSupabase.from("posts").delete().eq("id", id);
    if (error) {
      console.error("[api/admin/posts] delete error:", error);
      return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[api/admin/posts] unexpected error (DELETE)", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

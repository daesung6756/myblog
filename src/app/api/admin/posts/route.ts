import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Acquire cookies/headers for route client
    let nextCookiesObj: any = null;
    try {
      nextCookiesObj = await cookies();
    } catch (e) {
      // ignore
    }
    const routeSupabase = createRouteHandlerClient({ cookies: () => nextCookiesObj });

    // Check session / user
    const { data: sessionData } = await routeSupabase.auth.getSession();
    const user = (sessionData as any)?.session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = {
      title: body.title,
      slug: body.slug,
      summary: body.summary || null,
      content: body.content || null,
      tags: body.tags || [],
      ad_code_1: body.ad_code_1 || null,
      ad_code_2: body.ad_code_2 || null,
      published_at: body.published_at || null,
      author_id: user.id,
    };

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
    const routeSupabase = createRouteHandlerClient({ cookies: () => nextCookiesObj });

    const { data: sessionData } = await routeSupabase.auth.getSession();
    const user = (sessionData as any)?.session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = body.id;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

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
    const routeSupabase = createRouteHandlerClient({ cookies: () => nextCookiesObj });

    const { data: sessionData } = await routeSupabase.auth.getSession();
    const user = (sessionData as any)?.session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = body.id;
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

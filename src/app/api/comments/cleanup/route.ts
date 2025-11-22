import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint permanently removes comments that were soft-deleted more than
// 1 hour ago. It's protected by a secret header `x-cleanup-secret` which must
// match the environment variable `COMMENT_CLEANUP_SECRET`.

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-cleanup-secret");
    const expected = process.env.COMMENT_CLEANUP_SECRET;
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const svc = createClient(supabaseUrl, serviceKey);

    const threshold = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Delete comments that have deleted_at <= threshold
    const { error } = await svc
      .from("comments")
      .delete()
      .lte("deleted_at", threshold);

    if (error) {
      console.error("Cleanup error:", error);
      return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

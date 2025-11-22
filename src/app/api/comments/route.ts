import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { postId, authorName, authorEmail = "", content, password = "", replyTo } = await request.json();

    if (!postId || !authorName || !content) {
      return NextResponse.json(
        { error: "postId, authorName, content는 필수입니다" },
        { status: 400 }
      );
    }

    // 비밀번호는 선택사항입니다. 입력된 경우에만 해시화합니다.
    let passwordHash: string | null = null;
    if (password && String(password).length > 0) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // 클라이언트 IP 추출 (프록시 환경을 고려하여 X-Forwarded-For 우선 사용)
    const forwarded = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
    const cfIp = request.headers.get("cf-connecting-ip") || "";
    const ipFromHeader = forwarded ? forwarded.split(",")[0].trim() : (cfIp || "");
    const ipAddress = ipFromHeader || "";

    // 댓글 저장
    // 일부 DB 스키마에는 `ip_address` 컬럼이 없을 수 있으므로, 먼저 ip 포함으로 시도하고
    // 실패하면 ip 없이 다시 삽입하도록 처리합니다.
    let data: any = null;
    let error: any = null;

    const basePayload: any = {
      post_id: postId,
      author_name: authorName,
      content: content,
    };
    if (authorEmail && String(authorEmail).trim() !== "") basePayload.author_email = authorEmail;
    if (passwordHash) basePayload.password_hash = passwordHash;
    if (replyTo) basePayload.reply_to = replyTo;

    try {
      const res = await supabase.from("comments").insert({ ...basePayload, ip_address: ipAddress }).select();
      data = res.data;
      error = res.error;
      // 만약 컬럼 관련 에러가 발생하면 아래에서 재시도합니다.
      if (error && /ip_address/.test(String(error.message || error.details || ""))) {
        // fallthrough to re-insert without ip
        error = null;
        data = null;
      }
    } catch (e) {
      // supabase 클라이언트가 예외를 던질 경우 대비
      error = e;
    }

    if (!data && !error) {
      // Try inserting without `ip_address`. If reply_to column doesn't exist this will
      // still fail; we should be defensive but try once.
      const res2 = await supabase.from("comments").insert(basePayload).select();
      data = res2.data;
      error = res2.error;
    }

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json(
        { error: "댓글 작성에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

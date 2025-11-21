import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { postId, authorName, authorEmail, content, password } = await request.json();

    if (!postId || !authorName || !authorEmail || !content || !password) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요" },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const passwordHash = await bcrypt.hash(password, 10);

    // 댓글 저장
    const { data, error } = await supabase.from("comments").insert({
      post_id: postId,
      author_name: authorName,
      author_email: authorEmail,
      content: content,
      password_hash: passwordHash,
    }).select();

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

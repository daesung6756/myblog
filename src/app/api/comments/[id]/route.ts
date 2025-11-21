import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function DELETE(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const { id } = await context.params;
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "비밀번호를 입력해주세요" },
        { status: 400 }
      );
    }

    // 댓글 조회
    const { data: comment, error: fetchError } = await supabase
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

    // 비밀번호 확인
    const isValid = await bcrypt.compare(password, comment.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다" },
        { status: 401 }
      );
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
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
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

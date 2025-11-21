import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from("blog-images") // 스토리지 버킷 이름
      .upload(fileName, compressedBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/webp",
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { success: 0, error: error.message },
        { status: 500 }
      );
    }

    // 공개 URL 가져오기
    const { data: publicData } = supabase.storage
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

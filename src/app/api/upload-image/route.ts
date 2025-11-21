import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Service Role Key를 사용하여 RLS 우회
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);



export async function POST(request: NextRequest) {
  try {
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

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
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
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    return NextResponse.json({ publicUrl });
  } catch (error: any) {
    console.error('이미지 업로드 실패:', error);
    return NextResponse.json(
      { error: error.message || '이미지 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}

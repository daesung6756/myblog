# Supabase 데이터베이스 설정 가이드

## 1. Supabase 프로젝트 생성
1. https://supabase.com 에서 계정 생성/로그인
2. New Project 클릭
3. 프로젝트 이름, DB 비밀번호, 리전 선택 (Seoul 권장)

## 2. 환경 변수 설정
`.env.local` 파일 생성 (루트 디렉터리):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Settings > API에서 확인 가능

## 3. 데이터베이스 테이블 생성
Supabase Dashboard > SQL Editor에서 아래 SQL 실행:

### 새 프로젝트인 경우 (전체 생성):
```sql
-- 블로그 포스트 테이블
CREATE TABLE IF NOT EXISTS posts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  summary text,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  author_id uuid REFERENCES auth.users(id),
  tags text[],
  views integer DEFAULT 0
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text NOT NULL,
  content text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Row Level Security 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
DROP POLICY IF EXISTS "Anyone can delete their own comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can update posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can delete posts" ON posts;

-- 읽기 권한 (모두 공개)
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

-- 댓글 작성 권한 (모두 가능)
CREATE POLICY "Anyone can create comments"
  ON comments FOR INSERT
  WITH CHECK (true);

-- 댓글 삭제 권한 (모두 가능 - 비밀번호는 API에서 검증)
CREATE POLICY "Anyone can delete their own comments"
  ON comments FOR DELETE
  USING (true);

-- 포스트 쓰기 권한 (인증된 사용자만)
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update posts"
  ON posts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete posts"
  ON posts FOR DELETE
  USING (auth.role() = 'authenticated');

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts(slug);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
```

## 4. Storage 설정 (이미지 업로드용)

Supabase Dashboard > Storage 메뉴에서:

1. **New Bucket** 클릭
2. 버킷 이름: `blog-images` 입력
3. **Public bucket** 체크 (이미지를 공개적으로 접근 가능하게)
4. **Create bucket** 클릭

### Storage 정책 설정 (선택사항):

더 세밀한 제어가 필요한 경우 SQL Editor에서:

```sql
-- 모든 사용자가 이미지를 읽을 수 있도록
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'blog-images' );

-- 인증된 사용자만 이미지를 업로드할 수 있도록
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'blog-images' AND auth.role() = 'authenticated' );

-- 인증된 사용자만 이미지를 삭제할 수 있도록
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'blog-images' AND auth.role() = 'authenticated' );
```

## 5. 개발 서버 재시작
```powershell
npm run dev
```

## 6. 다음 단계
- 블로그 페이지를 Supabase 연동으로 변경
- 관리자 페이지 생성 (포스트 작성/수정)
- Supabase Auth 통합

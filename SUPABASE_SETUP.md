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

```sql
-- 블로그 포스트 테이블
create table posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text unique not null,
  content text,
  summary text,
  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  author_id uuid references auth.users(id),
  tags text[],
  views integer default 0
);

-- 댓글 테이블
create table comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade,
  author_name text,
  author_email text,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Row Level Security 활성화
alter table posts enable row level security;
alter table comments enable row level security;

-- 읽기 권한 (모두 공개)
create policy "Posts are viewable by everyone"
  on posts for select
  using (true);

create policy "Comments are viewable by everyone"
  on comments for select
  using (true);

-- 쓰기 권한 (인증된 사용자만)
create policy "Authenticated users can create posts"
  on posts for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update posts"
  on posts for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete posts"
  on posts for delete
  using (auth.role() = 'authenticated');

-- 인덱스 생성 (성능 향상)
create index posts_slug_idx on posts(slug);
create index posts_published_at_idx on posts(published_at desc);
create index comments_post_id_idx on comments(post_id);
```

## 4. 개발 서버 재시작
```powershell
npm run dev
```

## 5. 다음 단계
- 블로그 페이지를 Supabase 연동으로 변경
- 관리자 페이지 생성 (포스트 작성/수정)
- Supabase Auth 통합

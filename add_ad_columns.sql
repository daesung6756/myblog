-- posts 테이블에 광고 코드 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS ad_code_1 TEXT,
ADD COLUMN IF NOT EXISTS ad_code_2 TEXT;

-- 컬럼 설명 추가 (선택사항)
COMMENT ON COLUMN posts.ad_code_1 IS '광고 코드 1 (모바일 상단/데스크톱 사이드바 상단)';
COMMENT ON COLUMN posts.ad_code_2 IS '광고 코드 2 (모바일 하단/데스크톱 사이드바 하단)';


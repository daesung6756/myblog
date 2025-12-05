-- Disable public deletes on comments (safe default)
-- Drop the existing risky policy (if present) and create a deny policy

DROP POLICY IF EXISTS "Anyone can delete their own comments" ON comments;

-- Prevent public (anon) role from deleting comments
DROP POLICY IF EXISTS "Prevent public deletes on comments" ON comments;
CREATE POLICY "Prevent public deletes on comments"
  ON comments FOR DELETE
  USING (false);

-- Notes:
-- 1) Run this in Supabase SQL Editor (or via psql/service role) to apply immediately.
-- 2) This blocks DELETE for anon/public clients; server-side/service-role deletions still work.
-- 3) If you want a controlled deletion flow (author-only or password-based), I can prepare
--    the appropriate ALTER POLICY/ALTER TABLE or RPC function next.

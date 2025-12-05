-- Delete comment only when correct password is provided
-- This function verifies the provided password against the stored
-- password_hash (using pgcrypto's crypt()) and deletes the comment
-- if the password matches. Create the function as SECURITY DEFINER
-- and grant execute to public so clients can call the RPC. RLS will
-- prevent direct DELETE (use the other policy file to disable public deletes).

-- IMPORTANT:
-- - Ensure comments.password_hash stores values created with crypt(..., gen_salt('bf')).
--   Example when inserting a comment from the app:
--     INSERT INTO public.comments (..., password_hash)
--     VALUES (..., crypt('plain_password', gen_salt('bf')));
-- - Create this function as a DB owner (e.g. 'postgres' or project owner) so SECURITY DEFINER
--   behavior is safe. Limit the function to only delete the single row after verification.

CREATE OR REPLACE FUNCTION public.delete_comment_with_password(p_comment_id uuid, p_password text)
RETURNS boolean AS $$
DECLARE
  v_hash text;
BEGIN
  -- fetch stored hash
  SELECT password_hash INTO v_hash FROM public.comments WHERE id = p_comment_id;
  IF v_hash IS NULL THEN
    RETURN false; -- no such comment
  END IF;

  -- verify password using crypt()
  IF crypt(p_password, v_hash) = v_hash THEN
    DELETE FROM public.comments WHERE id = p_comment_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to public (allows anon/clients to call RPC)
GRANT EXECUTE ON FUNCTION public.delete_comment_with_password(uuid, text) TO public;

-- Optional: change owner to postgres for extra safety (run as DB superuser if available)
-- ALTER FUNCTION public.delete_comment_with_password(uuid, text) OWNER TO postgres;

-- Usage (from client via Supabase RPC or SQL Editor):
-- SELECT public.delete_comment_with_password('<comment-uuid>'::uuid, 'user-entered-password');

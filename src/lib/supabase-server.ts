import { createClient } from '@supabase/supabase-js'

// Server-side only client (for admin operations)
// This file should only be imported in Server Components or API routes
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

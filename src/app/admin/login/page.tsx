import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import LoginPageClient from "./LoginClient";

export default async function LoginPage() {
  // Server-side: check if a session exists and redirect to admin posts.
  // Use the request-scoped `cookies()` and `headers()` helpers directly
  // (they are sync functions in the App Router) to avoid type mismatches
  const nextCookies = await cookies();
  const cookieMethods = {
    getAll: () => nextCookies.getAll().map(c => ({ name: c.name, value: c.value })),
    // setAll is a no-op in this server component (we only read session here)
    setAll: async (_setCookies: any[]) => { /* noop */ },
  };
  const routeSupabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: cookieMethods });
  const { data: sessionData } = await routeSupabase.auth.getSession();
  const session = (sessionData as any)?.session;
  if (session) {
    redirect("/admin/posts");
  }

  return <LoginPageClient />;
}

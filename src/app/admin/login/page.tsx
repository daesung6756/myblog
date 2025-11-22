import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import LoginPageClient from "./LoginClient";

export default async function LoginPage() {
  // Server-side: check if a session exists and redirect to admin posts.
  // Use the request-scoped `cookies()` and `headers()` helpers directly
  // (they are sync functions in the App Router) to avoid type mismatches
  const routeSupabase = createRouteHandlerClient({ cookies: () => cookies() });
  const { data: sessionData } = await routeSupabase.auth.getSession();
  const session = (sessionData as any)?.session;
  if (session) {
    redirect("/admin/posts");
  }

  return <LoginPageClient />;
}

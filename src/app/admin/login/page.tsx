import { cookies, headers } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import LoginPageClient from "./LoginClient";

export default async function LoginPage() {
  // Server-side: check if a session exists and redirect to admin posts.
  let nextCookiesObj: any = null;
  try {
    nextCookiesObj = await cookies();
  } catch (e) {
    // ignore
  }
  const nextHeaders = headers();
  const routeSupabase = createRouteHandlerClient({ cookies: () => nextCookiesObj, headers: () => nextHeaders });
  const { data: sessionData } = await routeSupabase.auth.getSession();
  const session = (sessionData as any)?.session;
  if (session) {
    redirect("/admin/posts");
  }

  return <LoginPageClient />;
}

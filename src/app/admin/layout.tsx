"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user, loading } = useAuth();

  const isLoginPath = pathname.startsWith("/admin/login");
  const isAdminRoot = pathname === "/admin";

  let active = "posts";
  if (pathname.startsWith("/admin/inquiries")) active = "inquiries";
  if (pathname.startsWith("/admin/images")) active = "images";
  if (pathname.startsWith("/admin/ads")) active = "ads";

  // Redirect unauthenticated users to login (but do not redirect when
  // rendering the login page itself). Keep the hook call unconditional so
  // hook order is stable across renders.
  useEffect(() => {
    // If the client navigates to the admin root, rewrite to /admin/posts so
    // client-side transitions mirror the server-side redirect. This prevents
    // the URL from changing while the previous page content remains visible
    // until a full reload.
    if (isAdminRoot) {
      router.replace('/admin/posts');
      return;
    }
    if (isLoginPath) return;
    if (!loading && !user) {
      // Before redirecting to `/admin/login`, confirm the server
      // believes there is no session. This avoids a race where the
      // server has just set an HttpOnly session cookie and redirects
      // to `/admin/posts` while the client (with no session yet)
      // redirects back to `/admin/login`.
      let cancelled = false;
      const checkServerSession = async () => {
        try {
          const res = await fetch('/api/admin/session', { credentials: 'include' });
          const data = await res.json();
          if (cancelled) return;
          if (!data?.hasSession) {
            router.replace('/admin/login');
          }
        } catch (e) {
          if (!cancelled) router.replace('/admin/login');
        }
      };

      // Run the check (no extra delay). Return a cleanup to cancel.
      checkServerSession();
      return () => {
        cancelled = true;
      };
    }
  }, [isLoginPath, loading, user, router]);

  // While auth state is resolving, show nothing (avoid flashing admin UI).
  // Allow the login page to render even when loading/user are not resolved.
  if (!isLoginPath && (loading || !user)) {
    return (
      <Container>
        <div className="py-12 px-4 text-center">로딩 중...</div>
      </Container>
    );
  }

  // If we're on the login page, render only the login form (no admin nav).
  if (isLoginPath) {
    return (
      <Container>
        <div className="py-6 px-4">
          <div>{children}</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-6 px-4">
        <div className="mb-4">
          <nav role="navigation" aria-label="Admin tabs">
            <div className="inline-flex rounded-full p-1 surface">
                <Link
                  href="/admin/posts"
                  aria-current={active === "posts"}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition duration-200 ${
                    active === "posts"
                      ? "bg-linear-to-r from-purple-600 to-pink-500 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  포스트 관리
                </Link>
                <Link
                  href="/admin/inquiries"
                  aria-current={active === "inquiries"}
                  className={`ml-1 px-4 py-2 rounded-full text-sm font-semibold transition duration-200 ${
                    active === "inquiries"
                      ? "bg-linear-to-r from-purple-600 to-pink-500 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  문의 관리
                </Link>
                <Link
                  href="/admin/images"
                  aria-current={active === "images"}
                  className={`ml-1 px-4 py-2 rounded-full text-sm font-semibold transition duration-200 ${
                    active === "images"
                      ? "bg-linear-to-r from-purple-600 to-pink-500 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  이미지 관리
                </Link>
                <Link
                  href="/admin/ads"
                  aria-current={active === "ads"}
                  className={`ml-1 px-4 py-2 rounded-full text-sm font-semibold transition duration-200 ${
                    active === "ads"
                      ? "bg-linear-to-r from-purple-600 to-pink-500 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  광고 관리
                </Link>
              </div>
          </nav>
        </div>

        <div>{children}</div>
      </div>
    </Container>
  );
}

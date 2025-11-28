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
    console.log('[AdminLayout] pathname=', pathname, 'isLoginPath=', isLoginPath, 'loading=', loading, 'user=', user);
    // If the client navigates to the admin root, rewrite to /admin/posts so
    // client-side transitions mirror the server-side redirect.
    if (isAdminRoot) {
      router.replace('/admin/posts');
      return;
    }
    // Do not perform a client-side redirect to `/admin/login` here. Rely on
    // the server-side checks and `AuthProvider` to determine session state.
    // This avoids client/server redirect races that cause the ping-pong.
  }, [isAdminRoot, router]);

  // If we're on an admin page (not the login page) and we've resolved
  // auth state (loading === false) but have no user, send the client to
  // the login page so the login form is visible. Keep a tiny delay to
  // avoid races with in-flight navigation.
  useEffect(() => {
    if (!isLoginPath && !loading && !user) {
      const t = setTimeout(() => {
        router.replace('/admin/login');
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isLoginPath, loading, user, router]);

  // While auth state is resolving, show nothing (avoid flashing admin UI).
  // Allow the login page to render even when loading/user are not resolved.
  if (!isLoginPath && (loading || !user)) {
    return (
      <Container>
        <div className="py-12 px-4 text-center">
          <div>로딩 중...</div>
          <div className="mt-4 text-left text-sm text-zinc-600 dark:text-zinc-400">상태 디버그:</div>
          <pre className="mt-2 p-3 text-xs bg-gray-100 dark:bg-zinc-800 rounded overflow-auto text-left">{JSON.stringify({ pathname, isLoginPath, loading, user: user ? '[object]' : null }, null, 2)}</pre>
          <div className="mt-2 text-xs text-zinc-500">(이 정보 복사해서 공유해 주세요)</div>
        </div>
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

"use client";
import Link from "next/link";
import useStore from "../../store/useStore";
import { useAuth } from "../AuthProvider";
import { useEffect } from "react";
import MicrositeNav from "./MicrositeNav";
import { Button } from "../ui/button";

export default function Header() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  return (
    <header className="w-full border-b bg-white/50 backdrop-blur-sm dark:bg-black/50">
      {/* Top bar - Microsite links */}
      <MicrositeNav />

      {/* Main header */}
      <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
        <Link href="/" className="text-lg font-semibold">
          MyBlog
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/blog" className="text-sm hover:underline">
            Blog
          </Link>
          <Link href="/about" className="text-sm hover:underline">
            About
          </Link>
          {user ? (
            <>
              <Link href="/admin/posts" className="text-sm hover:underline">
                Admin
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
              >
                로그아웃
              </Button>
            </>
          ) : (
            <Link href="/admin/login">
              <Button variant="outline" size="sm">
                로그인
              </Button>
            </Link>
          )}
          <button
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="ml-2 rounded border px-3 py-1 text-sm"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </nav>
      </div>
    </header>
  );
}

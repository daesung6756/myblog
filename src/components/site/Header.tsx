"use client";
import Link from "next/link";
import useStore from "../../store/useStore";
import { useAuth } from "../AuthProvider";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import MicrositeNav from "./MicrositeNav";
import ScrollProgress from "../ScrollProgress";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";

export default function Header() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const { user, signOut, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname() || "";
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminLoginPath = pathname === "/admin/login";

  // Hide the login link in the header when on admin routes (except the
  // explicit admin login page). This avoids a UI flash where the header
  // shows a '로그인' button while the admin layout is still verifying
  // the server-side session and rendering a loading screen.
  const hideLoginLinkOnAdmin = isAdminPath && !isAdminLoginPath;

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleBg =
    theme === "dark"
      ? "bg-linear-to-br from-purple-900 to-purple-700"
      : "bg-linear-to-br from-amber-400 to-orange-400";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80 shadow-sm" style={{ borderBottomColor: 'var(--border)' }}>

      <ScrollProgress />
      {/* Top bar - Microsite links - Hidden on mobile */}
      <div className="hidden md:block">
        <MicrositeNav />
      </div>

      {/* Main header */}
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link href="/" className="text-xl sm:text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
          비로그
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          <Link href="/blog" className="text-sm font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors relative group">
            Blog
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 dark:bg-purple-400 group-hover:w-full transition-all" />
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors relative group">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 dark:bg-purple-400 group-hover:w-full transition-all" />
          </Link>
          <Link href="/contact" className="text-sm font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors relative group">
            Contact
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 dark:bg-purple-400 group-hover:w-full transition-all" />
          </Link>
          {user ? (
            <>
              <Link href="/admin/posts" className="text-sm font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors relative group">
                Admin
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 dark:bg-purple-400 group-hover:w-full transition-all" />
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 transition-all"
              >
                로그아웃
              </Button>
            </>
          ) : (
            !hideLoginLinkOnAdmin && (
              <Link href="/admin/login">
                <Button variant="outline" size="sm" className="hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-700 transition-all">
                  로그인
                </Button>
              </Link>
            )
          )}
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`relative ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110 ${toggleBg} shadow-lg`}
            >
              <span className="text-lg">
                {theme === "dark" ? "🌙" : "☀️"}
              </span>
            </button>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95 ${toggleBg} shadow-lg`}
            >
              <span className="text-base">
                {theme === "dark" ? "🌙" : "☀️"}
              </span>
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all active:scale-95 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white/95 dark:bg-gray-900/95 backdrop-blur-md" style={{ borderTopColor: 'var(--border)' }}>
          <nav className="px-4 py-4 space-y-1">
            <Link 
              href="/blog" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-base font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all active:scale-95"
            >
              Blog
            </Link>
            <Link 
              href="/about" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-base font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all active:scale-95"
            >
              About
            </Link>
            <Link 
              href="/contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-base font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all active:scale-95"
            >
              Contact
            </Link>
            {user ? (
              <>
                <Link 
                  href="/admin/posts" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all active:scale-95"
                >
                  Admin
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-base font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95"
                >
                  로그아웃
                </button>
              </>
            ) : (
              !hideLoginLinkOnAdmin && (
                <Link 
                  href="/admin/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all active:scale-95"
                >
                  로그인
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

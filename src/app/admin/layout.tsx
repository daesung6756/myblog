"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/ui/Container";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const active = pathname.startsWith("/admin/inquiries") ? "inquiries" : "posts";

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
              </div>
          </nav>
        </div>

        <div>{children}</div>
      </div>
    </Container>
  );
}

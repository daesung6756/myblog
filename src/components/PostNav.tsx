import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Props = {
  slug: string;
  publishedAt?: string | null;
  id?: string;
};

// Server component: fetches the nearest previous/next posts and renders links.
export default async function PostNav({ slug, publishedAt, id }: Props) {
  // New behavior: "이전글" = older post (published_at < current)
  // "다음글" = newer post (published_at > current)
  let prev: any = null; // older
  let next: any = null; // newer

  try {
    if (publishedAt) {
      // Older post (previous) => published_at < current, most recent among older
      const { data: older } = await supabase
        .from("posts")
        .select("id,title,slug,published_at")
        .lt("published_at", publishedAt)
        .order("published_at", { ascending: false })
        .limit(1);

      // Newer post (next) => published_at > current, earliest among newer
      const { data: newer } = await supabase
        .from("posts")
        .select("id,title,slug,published_at")
        .gt("published_at", publishedAt)
        .order("published_at", { ascending: true })
        .limit(1);

      prev = older && older.length ? older[0] : null;
      next = newer && newer.length ? newer[0] : null;
    } else if (id) {
      // Fallback: use id ordering
      const { data: all } = await supabase
        .from("posts")
        .select("id,title,slug,created_at")
        .order("created_at", { ascending: true });

      if (all && all.length) {
        const idx = all.findIndex((p: any) => p.id === id);
        if (idx !== -1) {
          // previous (older) is at idx - 1
          prev = idx - 1 >= 0 ? all[idx - 1] : null;
          // next (newer) is at idx + 1
          next = idx + 1 < all.length ? all[idx + 1] : null;
        }
      }
    }
  } catch (e) {
    prev = null;
    next = null;
  }

  if (!prev && !next) return null;

  const formatDate = (d?: string | null) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <nav className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4 items-stretch">
        <div>
          {prev && (
            <Link href={`/blog/${prev.slug}`} className="group block h-full rounded-xl p-4 bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 transform group-hover:-translate-x-1 transition-transform">
                  {/* left arrow */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">이전글</div>
                  <div className="text-sm font-semibold dark:text-gray-100">{prev.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{formatDate(prev.published_at || prev.created_at)}</div>
                </div>
              </div>
            </Link>
          )}
        </div>

        <div className="text-right">
          {next && (
            <Link href={`/blog/${next.slug}`} className="group inline-block w-full h-full rounded-xl p-4 bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-end gap-3">
                <div className="flex-1">
                  <div className="text-xs text-gray-500">다음글</div>
                  <div className="text-sm font-semibold ">{next.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{formatDate(next.published_at || next.created_at)}</div>
                </div>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 transform group-hover:translate-x-1 transition-transform">
                  {/* right arrow */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

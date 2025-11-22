"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import timeAgo from "@/lib/timeAgo";

interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  published_at: string;
  tags: string[];
  views: number;
}

interface RecentPostsProps {
  limit?: number;
  showViewCount?: boolean;
}

export default function RecentPosts({ limit = 5, showViewCount = true }: RecentPostsProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentPosts();
  }, [limit]);

  const fetchRecentPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, summary, published_at, tags, views")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching recent posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return timeAgo(dateString as string);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(limit)].map((_, i) => (
          <div
            key={i}
            className="surface-60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 animate-pulse"
          >
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">아직 작성된 포스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <div
          key={post.id}
          onClick={() => router.push(`/blog/${post.slug}`)}
          className="group surface-60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* 순위 뱃지 */}
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-md ${
                    index === 0
                      ? "bg-linear-to-br from-yellow-400 via-yellow-500 to-orange-500 text-white"
                      : index === 1
                      ? "bg-linear-to-br from-gray-300 via-gray-400 to-gray-500 text-white"
                      : index === 2
                      ? "bg-linear-to-br from-orange-400 via-orange-500 to-orange-600 text-white"
                      : "bg-linear-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {index + 1}
                </span>
                <h3 className="text-base sm:text-lg font-semibold dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                  {post.title}
                </h3>
              </div>

              {/* 요약 */}
              {post.summary && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 ml-10 sm:ml-11">
                  {post.summary}
                </p>
              )}

              {/* 메타 정보 */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-500 ml-10 sm:ml-11">
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                  {formatDate(post.published_at)}
                </span>

                {showViewCount && (
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                    {post.views || 0}
                  </span>
                )}

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                      >
                        #{tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{post.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 화살표 아이콘 */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all shrink-0"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

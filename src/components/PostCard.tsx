import Link from "next/link";
import { formatRelativeTime } from "@/lib/dateUtils";

export default function PostCard({
  title,
  summary,
  slug,
  date,
}: {
  title: string;
  summary: string;
  slug: string;
  date?: string;
}) {
  return (
    <article className="group relative rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 surface-60 backdrop-blur-sm overflow-hidden active:scale-100">
      {/* 호버 시 그라데이션 효과 */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <h3 className="text-lg sm:text-xl font-bold mb-2 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
          <Link href={`/blog/${slug}`} className="hover:underline">
            {title}
          </Link>
        </h3>
        {date && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {formatRelativeTime(date)}
          </p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{summary}</p>
        
        {/* 읽기 버튼 */}
        <div className="mt-3 sm:mt-4 flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
          읽기
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>
    </article>
  );
}

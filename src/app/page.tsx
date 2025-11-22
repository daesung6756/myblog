"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "../components/ui/Container";
import { Input } from "../components/ui/input";
import { supabase } from "../lib/supabase";
import RecentPosts from "../components/RecentPosts";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    posts: 0,
    tags: 0,
    views: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // 포스트 수 가져오기
      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true });

      // 고유 태그 수 가져오기
      const { data: postsData } = await supabase
        .from("posts")
        .select("tags");

      const uniqueTags = new Set<string>();
      postsData?.forEach((post) => {
        post.tags?.forEach((tag: string) => uniqueTags.add(tag));
      });

      // 총 조회수 가져오기
      const { data: viewsData } = await supabase
        .from("posts")
        .select("views");

      const totalViews = viewsData?.reduce((sum, post) => sum + (post.views || 0), 0) || 0;

      setStats({
        posts: postsCount || 0,
        tags: uniqueTags.size,
        views: totalViews,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`;
    }
    return `${num}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/blog?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-200px)] flex items-center justify-center overflow-hidden surface">
      {/* 그라데이션 배경 */}
      <div className="absolute inset-0 bg-linear-to-br" />
      
      {/* 애니메이션 도형들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 text-center space-y-8 sm:space-y-12 py-12 sm:py-20 px-4 w-full">
        {/* 타이틀 */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-fade-in">
            비로그
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-400 font-light px-4">
            최소 하루 하나의 기록
          </p>
        </div>

        {/* 검색바 */}
        <form onSubmit={handleSearch} className="max-w-xl sm:max-w-3xl lg:max-w-5xl mx-auto px-4">
          <div className="relative transition-transform duration-300 hover:scale-105 active:scale-100">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="블로그 글 검색..."
              className="h-14 sm:h-16 w-full rounded-full text-base sm:text-lg px-5 sm:px-6 pr-14 sm:pr-16 shadow-2xl border-2 focus-visible:ring-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-linear-to-r from-blue-600 to-purple-600 text-white hover:scale-110 active:scale-95 transition-all shadow-lg"
              aria-label="검색"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
          </div>
        </form>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto mt-12 sm:mt-16">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700/50 hover:scale-105 hover:shadow-xl transition-all">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.posts > 0 ? formatNumber(stats.posts) : "0"}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">포스트</div>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700/50 hover:scale-105 hover:shadow-xl transition-all">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
              {stats.tags > 0 ? formatNumber(stats.tags) : "0"}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">태그</div>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700/50 hover:scale-105 hover:shadow-xl transition-all">
            <div className="text-2xl sm:text-3xl font-bold text-pink-600 dark:text-pink-400">
              {stats.views > 0 ? formatNumber(stats.views) : "0"}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">조회수</div>
          </div>
        </div>

        {/* 최신 게시물 */}
        <div className="mt-16 sm:mt-20 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 px-4">
            <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              최근 게시글
            </h2>
            <button
              onClick={() => router.push("/blog")}
              className="text-sm sm:text-base text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1 group"
            >
              전체보기
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
          <RecentPosts limit={5} />
        </div>
      </div>
    </div>
  );
}

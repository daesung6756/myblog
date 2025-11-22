"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Container from "../../../components/ui/Container";
import confirm from "@/lib/confirm";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import Pagination from "../../../components/ui/Pagination";

type Post = {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
  views: number;
};

const POSTS_PER_PAGE = 20;

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    // 검색 필터링
    const filtered = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPosts(filtered);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  }, [searchQuery, posts]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, published_at, views")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
      setFilteredPosts(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!(await confirm(`"${title}" 포스트를 삭제하시겠습니까?`))) return;

    try {
      const res = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("delete post failed", data);
        alert("삭제에 실패했습니다.");
        return;
      }

      alert("삭제되었습니다.");
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Container>
        <div className="py-6 sm:py-8 px-4">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="h-8 w-48 bg-gray-200/60 dark:bg-zinc-700 rounded-md animate-pulse" />
            <div className="h-10 w-40 bg-gray-200/60 dark:bg-zinc-700 rounded-md animate-pulse" />
          </div>

          <div className="space-y-3 sm:space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-lg border p-4 surface-60 animate-pulse"
              >
                <div className="flex-1 min-w-0">
                  <div className="h-5 bg-gray-200/60 dark:bg-zinc-700 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200/50 dark:bg-zinc-700 rounded w-1/2" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-gray-200/60 dark:bg-zinc-700 rounded" />
                  <div className="h-8 w-20 bg-gray-200/60 dark:bg-zinc-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-6 sm:py-8 px-4">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">포스트 관리</h1>
          <Link href="/admin/posts/new">
            <Button className="w-full sm:w-auto bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 text-white">
              새 포스트 작성
            </Button>
          </Link>
        </div>

        {/* 검색바 */}
        <div className="mb-6">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <Input
              type="text"
              placeholder="제목 또는 슬러그로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-2"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            전체 {filteredPosts.length}개 포스트
            {searchQuery && ` (검색 결과)`}
          </p>
        </div>

        {currentPosts.length === 0 ? (
          <div className="text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <p className="text-zinc-600 dark:text-zinc-400">
              {searchQuery ? "검색 결과가 없습니다." : "포스트가 없습니다."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 sm:space-y-4">
              {currentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-lg border p-4 dark:border-zinc-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      <Link href={post.slug ? `/blog/${post.slug}` : `#`} className="inline-block w-full">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                      /{post.slug} · 조회 {post.views || 0}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/posts/edit/${post.id}`} className="flex-1 sm:flex-none">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        수정
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.id, post.title)}
                      className="flex-1 sm:flex-none hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </Container>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Container from "../../components/ui/Container";
import PostCard from "../../components/PostCard";
import { Input } from "../../components/ui/input";

type Post = {
  id: string;
  title: string;
  summary: string | null;
  slug: string;
  published_at: string | null;
  tags: string[];
};

export default function BlogPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    setLocalSearch(searchQuery);
    filterPosts(searchQuery);
  }, [searchQuery, posts]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, summary, slug, published_at, tags')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
      setFilteredPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = (query: string) => {
    if (!query.trim()) {
      setFilteredPosts(posts);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = posts.filter(post => 
      post.title.toLowerCase().includes(lowerQuery) ||
      post.summary?.toLowerCase().includes(lowerQuery) ||
      post.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
    setFilteredPosts(filtered);
  };

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    filterPosts(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b">
        <Container>
          <div className="py-8 sm:py-12 px-4">
            <div className="mb-8 sm:mb-12 text-center space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Blog 
              </h1>
              <p className="text-sm sm:text-base max-w-2xl mx-auto px-4">
                하루 하나의 기록
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="backdrop-blur-sm rounded-2xl p-6 border animate-pulse">
                  <div className="h-6 rounded w-3/4 mb-3"></div>
                  <div className="h-4 rounded w-full mb-2"></div>
                  <div className="h-4 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b">
      <Container>
        <div className="py-8 sm:py-12 px-4">
          {/* 페이지 헤더 */}
          <div className="mb-8 sm:mb-12 text-center space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Blog
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              하루 하나의 기록
            </p>
          </div>

          {/* 검색바 */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Input
                type="text"
                value={localSearch}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="제목, 내용, 태그로 검색..."
                className="h-12 w-full rounded-xl text-base px-5 pr-12 shadow-lg border-2"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            
            {/* 검색 결과 정보 */}
            {localSearch && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">"{localSearch}"</span>
                  {" "}검색 결과: <span className="font-semibold">{filteredPosts.length}개</span>
                </p>
              </div>
            )}
          </div>

          {filteredPosts.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
              {filteredPosts.map((p: Post) => (
                <PostCard
                  key={p.id}
                  title={p.title}
                  summary={p.summary || ""}
                  slug={p.slug}
                  date={p.published_at || ""}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 sm:py-20">
              {localSearch ? (
                <>
                  <div className="text-5xl sm:text-6xl mb-4">🔍</div>
                  <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg mb-2">
                    검색 결과가 없습니다.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    다른 키워드로 검색해보세요.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-5xl sm:text-6xl mb-4">📝</div>
                  <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                    아직 포스트가 없습니다.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

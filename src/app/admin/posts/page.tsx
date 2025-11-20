"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Container from "../../../components/ui/Container";
import Link from "next/link";
import { Button } from "../../../components/ui/button";

type Post = {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
  views: number;
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, published_at, views")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 포스트를 삭제하시겠습니까?`)) return;

    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      alert("삭제에 실패했습니다.");
    } else {
      alert("삭제되었습니다.");
      fetchPosts();
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="py-8">로딩 중...</div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">포스트 관리</h1>
          <Link href="/admin/posts/new">
            <Button>새 포스트 작성</Button>
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">포스트가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between rounded-lg border p-4 dark:border-zinc-700"
              >
                <div>
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    /{post.slug} · 조회 {post.views || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/posts/edit/${post.id}`}>
                    <Button variant="outline" size="sm">
                      수정
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(post.id, post.title)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

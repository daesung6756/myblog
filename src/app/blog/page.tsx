import { supabase } from "../../lib/supabase";
import Container from "../../components/ui/Container";
import PostCard from "../../components/PostCard";

type Post = {
  id: string;
  title: string;
  summary: string | null;
  slug: string;
  published_at: string | null;
};

export const revalidate = 60; // ISR: 60초마다 재검증

export default async function BlogPage() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, summary, slug, published_at')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
  }

  return (
    <Container>
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-semibold">Blog</h1>
        {posts && posts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {posts.map((p: Post) => (
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
          <p className="text-zinc-600 dark:text-zinc-400">
            아직 포스트가 없습니다.
          </p>
        )}
      </div>
    </Container>
  );
}

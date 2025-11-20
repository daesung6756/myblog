import { supabase } from "../../../lib/supabase";
import MarkdownRenderer from "../../../components/MarkdownRenderer";
import Container from "../../../components/ui/Container";
import { notFound } from "next/navigation";

type Params = { params: { slug: string } };

export const revalidate = 60; // ISR: 60초마다 재검증

export default async function PostPage({ params }: Params) {
  const { slug } = params;

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !post) {
    notFound();
  }

  // 조회수 증가
  await supabase
    .from('posts')
    .update({ views: (post.views || 0) + 1 })
    .eq('id', post.id);

  return (
    <Container>
      <article className="py-8">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <div className="mt-2 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          {post.published_at && (
            <time>{new Date(post.published_at).toLocaleDateString('ko-KR')}</time>
          )}
          {post.views > 0 && <span>조회 {post.views}</span>}
        </div>
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-200 px-3 py-1 text-xs dark:bg-zinc-800"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-8">
          <MarkdownRenderer source={post.content || ""} />
        </div>
      </article>
    </Container>
  );
}

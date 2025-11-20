import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Container from "../../components/ui/Container";
import PostCard from "../../components/PostCard";

type PostMeta = {
  title: string;
  summary?: string;
  date?: string;
  slug: string;
};

export default function BlogPage() {
  const postsDir = path.join(process.cwd(), "content", "posts");
  const files = fs.existsSync(postsDir) ? fs.readdirSync(postsDir) : [];
  const posts: PostMeta[] = files
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((file) => {
      const full = path.join(postsDir, file);
      const raw = fs.readFileSync(full, "utf8");
      const { data } = matter(raw);
      return {
        title: String(data.title || file),
        summary: String(data.summary || ""),
        date: String(data.date || ""),
        slug: String(data.slug || file.replace(/\.mdx?$/, "")),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <Container>
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-semibold">Blog</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((p) => (
            <PostCard key={p.slug} title={p.title} summary={p.summary || ""} slug={p.slug} date={p.date} />
          ))}
        </div>
      </div>
    </Container>
  );
}

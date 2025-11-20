import fs from "fs";
import path from "path";
import matter from "gray-matter";
import MarkdownRenderer from "../../../components/MarkdownRenderer";
import Container from "../../../components/ui/Container";

type Params = { params: { slug: string } };

export default function PostPage({ params }: Params) {
  const { slug } = params;
  const postsDir = path.join(process.cwd(), "content", "posts");
  const filePathMd = path.join(postsDir, `${slug}.md`);
  const filePathMdx = path.join(postsDir, `${slug}.mdx`);
  const filePath = fs.existsSync(filePathMd) ? filePathMd : filePathMdx;

  if (!fs.existsSync(filePath)) {
    return (
      <Container>
        <div className="py-8">포스트를 찾을 수 없습니다.</div>
      </Container>
    );
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  return (
    <Container>
      <article className="py-8">
        <h1 className="text-2xl font-bold">{String(data.title)}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{String(data.date)}</p>
        <div className="mt-6">
          <MarkdownRenderer source={content} />
        </div>
      </article>
    </Container>
  );
}

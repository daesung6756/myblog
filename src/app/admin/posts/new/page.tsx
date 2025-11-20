"use client";
import { useState } from "react";
import { supabase } from "../../../../lib/supabase";
import MarkdownEditor from "../../../../components/MarkdownEditor";
import Container from "../../../../components/ui/Container";
import { useRouter } from "next/navigation";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { Button } from "../../../../components/ui/button";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("posts").insert([
        {
          title,
          slug,
          summary,
          content,
          tags: tags ? tags.split(",").map((t) => t.trim()) : [],
          published_at: new Date().toISOString(),
          author_id: user?.id || null,
        },
      ]);

      if (error) throw error;

      alert("포스트가 생성되었습니다!");
      router.push("/admin/posts");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("포스트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-bold">새 포스트 작성</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">제목</label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="포스트 제목"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">슬러그 (URL)</label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="post-slug"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">요약</label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="포스트 요약"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">태그 (쉼표로 구분)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">본문 (Markdown)</label>
            <MarkdownEditor value={content} onChange={setContent} />
          </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : "포스트 생성"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/posts")}
            >
              취소
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}

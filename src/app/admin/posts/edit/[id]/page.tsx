"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import MarkdownEditor from "../../../../../components/MarkdownEditor";
import Container from "../../../../../components/ui/Container";
import { useRouter } from "next/navigation";
import { Input } from "../../../../../components/ui/input";
import { Textarea } from "../../../../../components/ui/textarea";
import { Button } from "../../../../../components/ui/button";

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPost();
  }, []);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!error && data) {
      setTitle(data.title);
      setSlug(data.slug);
      setSummary(data.summary || "");
      setContent(data.content || "");
      setTags(data.tags ? data.tags.join(", ") : "");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("posts")
        .update({
          title,
          slug,
          summary,
          content,
          tags: tags ? tags.split(",").map((t) => t.trim()) : [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);

      if (error) throw error;

      alert("포스트가 수정되었습니다!");
      router.push("/admin/posts");
    } catch (error) {
      console.error("Error updating post:", error);
      alert("포스트 수정에 실패했습니다.");
    } finally {
      setSaving(false);
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
        <h1 className="mb-6 text-2xl font-bold">포스트 수정</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">제목</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
            <Button type="submit" disabled={saving}>
              {saving ? "저장 중..." : "포스트 수정"}
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

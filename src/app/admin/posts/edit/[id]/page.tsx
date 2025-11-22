"use client";
import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Container from "@/components/ui/Container";
import { useRouter } from "next/navigation";
import PostForm from "@/components/admin/PostForm";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState<any>({ blocks: [] });
  const [tags, setTags] = useState("");
  const [adCode1, setAdCode1] = useState("");
  const [adCode2, setAdCode2] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isMobileView, setIsMobileView] = useState<boolean | null>(null);
  const isDragging = useRef(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState<"success" | "error">("success");

  useEffect(() => {
    fetchPost();
    // determine initial viewport type for mounting a single EditorJS instance
    const checkMobile = () => setIsMobileView(typeof window !== 'undefined' ? window.innerWidth < 1024 : null);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setTitle(data.title);
      setSlug(data.slug);
      setSummary(data.summary || "");
      try {
        const parsed = data.content ? JSON.parse(data.content) : { blocks: [] };
        setContent(parsed);

        // Diagnostic: send trimmed content summary to /api/diagnostic for analysis
        try {
          const blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
          const blockTypes = blocks.map((b: any) => b.type).slice(0, 20);
          const payload = {
            phase: 'fetchPost',
            postId: data.id,
            slug: data.slug,
            timestamp: new Date().toISOString(),
            blocksCount: blocks.length,
            sampleBlockTypes: blockTypes,
            contentPreview:
              typeof data.content === 'string'
                ? data.content.slice(0, 2000)
                : JSON.stringify(parsed).slice(0, 2000),
          };

          fetch('/api/diagnostic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(() => {});
        } catch (e) {
          // ignore diagnostic errors
        }
      } catch {
        setContent({ blocks: [] });
      }
      setTags(data.tags ? data.tags.join(", ") : "");
      setAdCode1(data.ad_code_1 || "");
      setAdCode2(data.ad_code_2 || "");
    }
    setLoading(false);
  };

  const handleUpdate = async (values: any) => {
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id,
          title: values.title,
          slug: values.slug,
          summary: values.summary || null,
          content: JSON.stringify(values.content),
          tags: values.tags ? values.tags.split(",").map((t: string) => t.trim()) : [],
          ad_code_1: values.adCode1 || null,
          ad_code_2: values.adCode2 || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("update post failed", data);
        return { success: false, message: data.error || "포스트 수정에 실패했습니다." };
      }

      return { success: true, message: "포스트가 수정되었습니다!" };
    } catch (err) {
      console.error(err);
      return { success: false, message: "예기치 못한 오류가 발생했습니다." };
    }
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    if (percentage > 20 && percentage < 80) {
      setLeftWidth(percentage);
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
    <div className="min-h-screen surface">
      <Container>
        <div className="py-6 sm:py-8 md:py-12">
          <div className="mb-6 sm:mb-8">
             <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-1 bg-linear-to-b from-blue-600 via-purple-600 to-pink-600 rounded-full"></div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                포스트 수정
              </h1>
              </div>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">수정할 내용을 입력하고 미리보기를 확인하세요</p>
          </div>

          <PostForm
            initialValues={{
              title,
              slug,
              summary,
              content,
              tags,
              adCode1,
              adCode2,
            }}
            onSubmit={handleUpdate}
            submitLabel="포스트 수정"
            onSuccess={() => router.push("/admin/posts")}
          />
        </div>
      </Container>
    </div>
  );
}

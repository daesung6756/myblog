"use client";
import { supabase } from "@/lib/supabase";
import Container from "@/components/ui/Container";
import { useRouter } from "next/navigation";
import PostForm from "@/components/admin/PostForm";

export default function NewPostPage() {
  const router = useRouter();

  const handleCreate = async (values: any) => {
    try {
      // Use server API so HttpOnly session is honored (avoid client-side 401)
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: values.title,
          slug: values.slug,
          summary: values.summary || null,
          content: JSON.stringify(values.content),
          tags: values.tags ? values.tags.split(",").map((t: string) => t.trim()) : [],
          ad_code_1: values.adCode1 || null,
          ad_code_2: values.adCode2 || null,
          published_at: new Date().toISOString(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("create post failed", data);
        return { success: false, message: data.error || "포스트 생성에 실패했습니다." };
      }

      return { success: true, message: "포스트가 생성되었습니다!" };
    } catch (err) {
      console.error(err);
      return { success: false, message: "예기치 못한 오류가 발생했습니다." };
    }
  };

  return (
    <div className="min-h-screen surface">
      <Container>
        <div className="py-6 sm:py-8 px-4">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-1 bg-linear-to-b from-blue-600 via-purple-600 to-pink-600 rounded-full"></div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                새 포스트 작성
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 ml-4">마크다운으로 멋진 포스트를 작성하세요</p>
          </div>

          <PostForm initialValues={{}} onSubmit={handleCreate} submitLabel="포스트 생성" onSuccess={() => router.push("/admin/posts")} />
        </div>
      </Container>
    </div>
  );
}

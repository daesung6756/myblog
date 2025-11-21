"use client";
import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import EditorJS from "@/components/EditorJS";
import EditorJSRenderer from "@/components/EditorJSRenderer";
import Container from "@/components/ui/Container";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
          content: JSON.stringify(content),
          tags: tags ? tags.split(",").map((t) => t.trim()) : [],
          ad_code_1: adCode1 || null,
          ad_code_2: adCode2 || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setDialogType("success");
      setDialogMessage("포스트가 수정되었습니다!");
      setDialogOpen(true);
    } catch (error) {
      console.error("Error updating post:", error);
      setDialogType("error");
      setDialogMessage("포스트 수정에 실패했습니다.");
      setDialogOpen(true);
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-900 dark:via-purple-950 dark:to-zinc-900">
      <Container>
        <div className="py-6 sm:py-8 md:py-12">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
              포스트 수정
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              수정할 내용을 입력하고 미리보기를 확인하세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 데스크톱: 좌우 레이아웃 */}
            <div className="hidden lg:flex gap-0 relative"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* 좌측: 미리보기 */}
              <div className="space-y-4 overflow-auto pr-4" style={{ width: `${leftWidth}%` }}>
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <h2 className="text-lg font-semibold">미리보기</h2>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
                  <h1 className="mb-3 text-3xl font-bold">{title || "제목을 입력하세요"}</h1>
                  {summary && (
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 italic border-l-4 border-purple-500 pl-4">
                      {summary}
                    </p>
                  )}
                  {tags && (
                    <div className="mb-6 flex flex-wrap gap-2">
                      {tags.split(",").map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-linear-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="prose prose-sm lg:prose-base dark:prose-invert max-w-none">
                    <EditorJSRenderer data={content} />
                  </div>
                </div>
              </div>

              {/* 리사이저 */}
              <div
                className="group relative w-3 cursor-col-resize hover:bg-purple-500/20 transition-colors flex items-center justify-center"
                onMouseDown={handleMouseDown}
              >
                <div className="h-12 w-1 rounded-full bg-gray-300 group-hover:bg-linear-to-b group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-pink-600 transition-all"></div>
              </div>

              {/* 우측: 편집기 */}
              <div className="space-y-4 overflow-auto pl-4" style={{ width: `${100 - leftWidth}%` }}>
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                  <h2 className="text-lg font-semibold">편집</h2>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg space-y-4">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>📝</span>
                      제목
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="포스트 제목을 입력하세요"
                      required
                      className="h-12 text-lg border-2"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>🔗</span>
                      슬러그 (URL)
                    </label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="post-slug"
                      required
                      className="font-mono text-sm border-2"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      URL: /blog/{slug || "post-slug"}
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>💬</span>
                      요약
                    </label>
                    <Textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="포스트를 간단히 소개해주세요"
                      rows={3}
                      className="resize-none border-2"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>🏷️</span>
                      태그
                    </label>
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="태그1, 태그2, 태그3"
                      className="border-2"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>📢</span>
                      광고 코드 1 (모바일 상단)
                    </label>
                    <Textarea
                      value={adCode1}
                      onChange={(e) => setAdCode1(e.target.value)}
                      placeholder="<script>...</script> 또는 HTML 광고 코드"
                      rows={3}
                      className="resize-none border-2 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>📢</span>
                      광고 코드 2 (모바일 하단)
                    </label>
                    <Textarea
                      value={adCode2}
                      onChange={(e) => setAdCode2(e.target.value)}
                      placeholder="<script>...</script> 또는 HTML 광고 코드"
                      rows={3}
                      className="resize-none border-2 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>✍️</span>
                      본문
                    </label>
                    {isMobileView !== null && !isMobileView && (
                      <EditorJS value={content} onChange={setContent} placeholder="내용을 입력하세요..." />
                    )}
                    {isMobileView !== null && isMobileView && (
                      <div className="text-sm text-gray-500">편집은 모바일 레이아웃에서 아래 섹션을 사용하세요.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 모바일: 세로 레이아웃 */}
            <div className="lg:hidden space-y-6">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                  <h2 className="text-lg font-semibold">포스트 정보</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>📝</span>
                      제목
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="포스트 제목을 입력하세요"
                      required
                      className="h-11 sm:h-12 text-base sm:text-lg border-2"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>🔗</span>
                      슬러그 (URL)
                    </label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="post-slug"
                      required
                      className="font-mono text-sm border-2 h-10 sm:h-11"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      URL: /blog/{slug || "post-slug"}
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>💬</span>
                      요약
                    </label>
                    <Textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="포스트를 간단히 소개해주세요"
                      rows={3}
                      className="resize-none border-2 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>🏷️</span>
                      태그
                    </label>
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="태그1, 태그2, 태그3"
                      className="border-2 h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>📢</span>
                      광고 코드 1 (모바일 상단)
                    </label>
                    <Textarea
                      value={adCode1}
                      onChange={(e) => setAdCode1(e.target.value)}
                      placeholder="<script>...</script> 또는 HTML 광고 코드"
                      rows={3}
                      className="resize-none border-2 font-mono text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>📢</span>
                      광고 코드 2 (모바일 하단)
                    </label>
                    <Textarea
                      value={adCode2}
                      onChange={(e) => setAdCode2(e.target.value)}
                      placeholder="<script>...</script> 또는 HTML 광고 코드"
                      rows={3}
                      className="resize-none border-2 font-mono text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>✍️</span>
                      본문
                    </label>
                    {isMobileView !== null && isMobileView && (
                      <EditorJS value={content} onChange={setContent} placeholder="내용을 입력하세요..." />
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <h2 className="text-lg font-semibold">미리보기</h2>
                </div>
                <h1 className="mb-3 text-xl sm:text-2xl md:text-3xl font-bold">{title || "제목을 입력하세요"}</h1>
                {summary && (
                  <p className="mb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic border-l-4 border-purple-500 pl-3 sm:pl-4">
                    {summary}
                  </p>
                )}
                {tags && (
                  <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
                    {tags.split(",").map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-linear-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                  <EditorJSRenderer data={content} />
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/posts")}
                className="w-full sm:w-auto h-11 sm:h-12 border-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={saving} 
                className="w-full sm:w-auto h-11 sm:h-12 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 transition-opacity shadow-lg text-white"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    저장 중...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    포스트 수정
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Container>

      {/* 다이얼로그 */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="bg-white text-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogType === "success" ? (
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  성공
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  오류
                </span>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setDialogOpen(false);
                if (dialogType === "success") {
                  router.push("/admin/posts");
                }
              }}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

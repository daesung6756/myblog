"use client";
import React, { useEffect, useRef, useState } from "react";
import EditorJS from "@/components/EditorJS";
import EditorJSRenderer from "@/components/EditorJSRenderer";
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

type PostValues = {
  title?: string;
  slug?: string;
  summary?: string;
  content?: any;
  tags?: string;
  adCode1?: string;
  adCode2?: string;
};

type SubmitResult = Promise<{ success: boolean; message?: string }>;

export default function PostForm({
  initialValues = {},
  onSubmit,
  submitLabel = "저장",
  cancelHref = "/admin/posts",
  onSuccess,
}: {
  initialValues?: PostValues;
  onSubmit: (values: PostValues) => SubmitResult;
  submitLabel?: string;
  cancelHref?: string;
  onSuccess?: () => void;
}) {
  const [title, setTitle] = useState(initialValues.title || "");
  const [slug, setSlug] = useState(initialValues.slug || "");
  const [summary, setSummary] = useState(initialValues.summary || "");
  const [content, setContent] = useState<any>(initialValues.content || { blocks: [] });
  const [tags, setTags] = useState(initialValues.tags || "");
  const [adCode1, setAdCode1] = useState(initialValues.adCode1 || "");
  const [adCode2, setAdCode2] = useState(initialValues.adCode2 || "");
  const [loading, setLoading] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const isDragging = useRef(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState<"success" | "error">("success");

  // mobile view detection for EditorJS mount behavior
  const [isMobileView, setIsMobileView] = useState<boolean | null>(null);
  useEffect(() => {
    const checkMobile = () => setIsMobileView(typeof window !== "undefined" ? window.innerWidth < 1024 : null);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Default ad snippets (fallbacks in case localStorage is empty)
  const DEFAULT_AD_CODE_1 = `<div class="ad-contact-banner" style="display:block; width:100%; box-sizing:border-box; padding: clamp(12px, 4vw, 20px); border-radius:12px; background: linear-gradient(90deg, #06b6d4, #3b82f6); color:#fff; text-align:center;">\n  <p style="margin:0 0 8px 0; font-size:clamp(14px,3.5vw,16px); font-weight:700;">블로그에 광고 배너를 게재</p>\n  <p style="margin:0 0 12px 0; font-size:clamp(12px,3vw,14px); opacity:0.95;">문의는 아래 버튼으로!</p>\n  <a href=\"/contact?topic=advertise\" style=\"display:inline-block; background:#fff; color:#0369a1; padding:8px 16px; border-radius:8px; font-weight:700; text-decoration:none; font-size:clamp(12px,3vw,14px);\">광고 문의하기</a>\n</div>`;

  const DEFAULT_AD_CODE_2 = `<a href=\"https://dutch-pay-lemon.vercel.app/\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"display: block;\">\n  <picture>\n    <source media=\"(min-width: 1024px)\" srcset=\"https://clgeftofunbnvcfhcgkx.supabase.co/storage/v1/object/public/blog-images/1763692630466-Gemini_Generated_Image_9lk4ll9lk4ll9lk4.webp\" />\n    <img src=\"https://clgeftofunbnvcfhcgkx.supabase.co/storage/v1/object/public/blog-images/1763693482502-Gemini_Generated_Image_w4p41tw4p41tw4p4.webp\" alt=\"광고 배너\" loading=\"lazy\" style=\"width: 100%; height: auto; max-height: 350px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: block;\"/>\n  </picture>\n</a>`;

  // If initial values don't include ad codes, attempt to load admin defaults from localStorage
  useEffect(() => {
    try {
      if (!adCode1) {
        const stored = typeof window !== "undefined" ? localStorage.getItem("admin:defaultAdCode1") : null;
        setAdCode1(stored ?? DEFAULT_AD_CODE_1);
      }
      if (!adCode2) {
        const stored2 = typeof window !== "undefined" ? localStorage.getItem("admin:defaultAdCode2") : null;
        setAdCode2(stored2 ?? DEFAULT_AD_CODE_2);
      }
    } catch (e) {
      // ignore
    }
    // only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyDefaultAd1 = () => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("admin:defaultAdCode1") : null;
    setAdCode1(stored ?? DEFAULT_AD_CODE_1);
  };

  const applyDefaultAd2 = () => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("admin:defaultAdCode2") : null;
    setAdCode2(stored ?? DEFAULT_AD_CODE_2);
  };

  const generateSlug = (text: string) => {
    const timestamp = Date.now();
    const cleanText = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    return cleanText || `post-${timestamp}`;
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug) setSlug(generateSlug(value));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await onSubmit({
        title,
        slug,
        summary,
        content,
        tags,
        adCode1,
        adCode2,
      });

      if (result.success) {
        setDialogType("success");
        setDialogMessage(result.message || "저장되었습니다.");
        setDialogOpen(true);
        if (onSuccess) onSuccess();
      } else {
        setDialogType("error");
        setDialogMessage(result.message || "저장에 실패했습니다.");
        setDialogOpen(true);
      }
    } catch (err) {
      console.error(err);
      setDialogType("error");
      setDialogMessage("저장 중 오류가 발생했습니다.");
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className="hidden lg:flex gap-0 relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="space-y-4 overflow-auto pr-4" style={{ width: `${leftWidth}%` }}>
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <h2 className="text-lg font-semibold">미리보기</h2>
          </div>
          <div className="surface-60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
            <h1 className="mb-3 text-3xl font-bold">{title || "제목을 입력하세요"}</h1>
            {summary && (
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 italic border-l-4 border-purple-500 pl-4">
                {summary}
              </p>
            )}
            {tags && (
              <div className="mb-6 flex flex-wrap gap-2">
                {tags.split(",").map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-linear-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
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

        <div className="group relative w-3 cursor-col-resize hover:bg-purple-500/20 transition-colors flex items-center justify-center" onMouseDown={handleMouseDown}>
          <div className="h-12 w-1 rounded-full bg-gray-300 group-hover:bg-linear-to-b group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-pink-600 transition-all"></div>
        </div>

        <div className="space-y-4 overflow-auto pl-4" style={{ width: `${100 - leftWidth}%` }}>
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            <h2 className="text-lg font-semibold">편집</h2>
          </div>
          <div className="surface-60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg space-y-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>📝</span>
                제목
              </label>
              <Input name="title" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="포스트 제목을 입력하세요" required className="h-12 text-lg border-2" />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>🔗</span>
                슬러그 (URL)
              </label>
              <Input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="post-slug" required className="font-mono text-sm border-2" />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">URL: /blog/{slug || "post-slug"}</p>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>💬</span>
                요약
              </label>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="포스트를 간단히 소개해주세요" rows={3} className="resize-none border-2" />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>🏷️</span>
                태그
              </label>
              <Input name="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="태그1, 태그2, 태그3" className="border-2" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span>📢</span>
                  광고 코드 1 (모바일 상단)
                </label>
                <button type="button" onClick={applyDefaultAd1} className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400">기본값</button>
              </div>
              <Textarea value={adCode1} onChange={(e) => setAdCode1(e.target.value)} placeholder="<script>...</script> 또는 HTML 광고 코드" rows={3} className="resize-none border-2 font-mono text-xs" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span>📢</span>
                  광고 코드 2 (모바일 하단)
                </label>
                <button type="button" onClick={applyDefaultAd2} className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400">기본값</button>
              </div>
              <Textarea value={adCode2} onChange={(e) => setAdCode2(e.target.value)} placeholder="<script>...</script> 또는 HTML 광고 코드" rows={3} className="resize-none border-2 font-mono text-xs" />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>✍️</span>
                본문
              </label>
              {isMobileView !== null && !isMobileView && <EditorJS value={content} onChange={setContent} placeholder="내용을 입력하세요..." />}
              {isMobileView !== null && isMobileView && <div className="text-sm text-gray-500">편집은 모바일 레이아웃에서 아래 섹션을 사용하세요.</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden space-y-6">
        <div className="surface-60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 shadow-lg">
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
              <Input name="title" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="포스트 제목을 입력하세요" required className="h-11 sm:h-12 text-base sm:text-lg border-2" />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>🔗</span>
                슬러그 (URL)
              </label>
              <Input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="post-slug" required className="font-mono text-sm border-2 h-10 sm:h-11" />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">URL: /blog/{slug || "post-slug"}</p>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>💬</span>
                요약
              </label>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="포스트를 간단히 소개해주세요" rows={3} className="resize-none border-2 text-sm sm:text-base" />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>🏷️</span>
                태그
              </label>
              <Input name="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="태그1, 태그2, 태그3" className="border-2 h-10 sm:h-11 text-sm sm:text-base" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span>📢</span>
                  광고 코드 1 (모바일 상단)
                </label>
                <button type="button" onClick={applyDefaultAd1} className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400">기본값</button>
              </div>
              <Textarea value={adCode1} onChange={(e) => setAdCode1(e.target.value)} placeholder="<script>...</script> 또는 HTML 광고 코드" rows={3} className="resize-none border-2 font-mono text-xs sm:text-sm" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span>📢</span>
                  광고 코드 2 (모바일 하단)
                </label>
                <button type="button" onClick={applyDefaultAd2} className="text-sm text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400">기본값</button>
              </div>
              <Textarea value={adCode2} onChange={(e) => setAdCode2(e.target.value)} placeholder="<script>...</script> 또는 HTML 광고 코드" rows={3} className="resize-none border-2 font-mono text-xs sm:text-sm" />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>✍️</span>
                본문
              </label>
              <EditorJS value={content} onChange={setContent} placeholder="내용을 입력하세요..." />
            </div>
          </div>
        </div>

        <div className="surface-60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <h2 className="text-lg font-semibold">미리보기</h2>
          </div>
          <h1 className="mb-3 text-xl sm:text-2xl md:text-3xl font-bold">{title || "제목을 입력하세요"}</h1>
          {summary && (
            <p className="mb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic border-l-4 border-purple-500 pl-3 sm:pl-4">{summary}</p>
          )}
          {tags && (
            <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">{tags.split(",").map((tag, idx) => (
              <span key={idx} className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-linear-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700">#{tag.trim()}</span>
            ))}</div>
          )}
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
            <EditorJSRenderer data={content} />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <a href={cancelHref} className="w-full sm:w-auto">
          <Button type="button" variant="outline" className="w-full sm:w-auto h-11 sm:h-12 border-2">취소</Button>
        </a>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 sm:h-12 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:opacity-90 transition-opacity shadow-lg">
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              저장 중...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
              {submitLabel}
            </>
          )}
        </Button>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogType === "success" ? "성공" : "오류"}</AlertDialogTitle>
            <AlertDialogDescription>{dialogMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDialogOpen(false)}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

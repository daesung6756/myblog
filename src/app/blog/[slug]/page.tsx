import { supabase } from "../../../lib/supabase";
import EditorJSRenderer from "../../../components/EditorJSRenderer";
import CommentSection from "../../../components/CommentSection";
import Container from "../../../components/ui/Container";
import { formatRelativeTime } from "@/lib/dateUtils";
import { notFound } from "next/navigation";

type Params = { params: { slug: string } };

export const revalidate = 60; // ISR: 60초마다 재검증

export default async function PostPage({ params }: Params) {
  const { slug } = await params;

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

  // content JSON 파싱
  let parsedContent;
  try {
    parsedContent = post.content ? JSON.parse(post.content) : { blocks: [] };
  } catch {
    parsedContent = { blocks: [] };
  }

  return (
    <div className="min-h-screen bg-linear-to-b ">
      <Container>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 py-8 sm:py-12">
          {/* 좌측: 광고 영역 (데스크톱에서 1/4) */}
          <aside className="lg:w-1/4 shrink-0">
            {/* 모바일: 가로 광고 2개 */}
            <div className="lg:hidden space-y-4 mb-6">
              {/* 광고 1 */}
              {post.ad_code_1 ? (
                <div 
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: post.ad_code_1 }}
                />
              ) : (
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-lg">
                  <div className="h-24 flex items-center justify-center text-gray-400 dark:text-gray-600">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto mb-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      <p className="text-xs">광고 영역</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 광고 2 */}
              {post.ad_code_2 ? (
                <div 
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: post.ad_code_2 }}
                />
              ) : (
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-lg">
                  <div className="h-24 flex items-center justify-center text-gray-400 dark:text-gray-600">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto mb-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      <p className="text-xs">광고 영역</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 데스크톱: 세로 광고 */}
            <div className="hidden lg:block lg:sticky lg:top-32 space-y-6">
              {/* 광고 영역 1 */}
              {post.ad_code_1 ? (
                <div 
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: post.ad_code_1 }}
                />
              ) : (
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
                  <div className="aspect-square flex items-center justify-center text-gray-400 dark:text-gray-600">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      <p className="text-sm">광고 영역</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 광고 영역 2 */}
              {post.ad_code_2 ? (
                <div 
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: post.ad_code_2 }}
                />
              ) : (
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
                  <div className="aspect-square flex items-center justify-center text-gray-400 dark:text-gray-600">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      <p className="text-sm">광고 영역</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* 우측: 콘텐츠 영역 (3/4) */}
          <article className="flex-1 lg:w-3/4 px-4 lg:px-0">
            {/* 헤더 */}
            <header className="mb-8 sm:mb-12 space-y-4 sm:space-y-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">{post.title}</h1>
              
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {post.published_at && (
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    <time>{formatRelativeTime(post.published_at)}</time>
                  </div>
                )}
                {post.views > 0 && (
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    <span>{post.views.toLocaleString()}회</span>
                  </div>
                )}
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* 본문 */}
            <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none mb-12 sm:mb-16 overflow-hidden">
              <EditorJSRenderer data={parsedContent} />
            </div>

            {/* 구분선 */}
            <div className="my-12 sm:my-16 border-t border-gray-200 dark:border-gray-800" />

            {/* 댓글 섹션 */}
            <CommentSection postId={post.id} />
          </article>
        </div>
      </Container>
    </div>
  );
}

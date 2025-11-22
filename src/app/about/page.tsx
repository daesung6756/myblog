import Container from "../../components/ui/Container";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-linear-to-br surface">
      <Container>
        <div className="py-12 sm:py-16 px-4">
          {/* Hero Section */}
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">현재 운영중</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Blog
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              하루 하나의 기록, <br className="hidden sm:block" />
              나만의 생각과 경험을 공유하는 공간입니다
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {/* 반응형 디자인 */}
            <div className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">완벽한 반응형</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                모바일, 태블릿, 데스크톱 모든 디바이스에서 최적화된 경험을 제공합니다
              </p>
            </div>

            {/* 다크모드 */}
            <div className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">다크모드 지원</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                눈의 피로를 줄이는 우아한 다크모드 테마를 자동으로 감지합니다
              </p>
            </div>

            {/* 마크다운 */}
            <div className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Editor.js 에디터</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                블록 기반 에디터로 풍부한 콘텐츠 작성과 실시간 미리보기 지원
              </p>
            </div>

            {/* 실시간 검색 */}
            <div className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-linear-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">실시간 검색</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                빠르고 정확한 검색으로 원하는 콘텐츠를 즉시 찾아보세요
              </p>
            </div>

            {/* 댓글 시스템 */}
            <div className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">댓글 & 소통</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                독자들과 실시간으로 소통하고 피드백을 받을 수 있습니다
              </p>
            </div>

            {/* 광고 시스템 */}
            <div className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">맞춤형 광고</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                포스트별로 광고를 자유롭게 설정하고 수익을 창출하세요
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 sm:p-12 text-white shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              함께 소통해요
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              블로그에 방문해주셔서 감사합니다<br className="hidden sm:block" />
              댓글로 자유롭게 소통해주세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/blog" 
                className="inline-flex items-center justify-center gap-2 bg-white text-purple-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                블로그 둘러보기
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}


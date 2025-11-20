import Link from "next/link";
import Container from "../components/ui/Container";

export default function Home() {
  return (
    <Container>
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-4xl font-bold">MyBlog에 오신 것을 환영합니다</h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          개인 블로그 — Next.js, TypeScript, Tailwind, shadcn-ui로 제작
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/blog"
            className="rounded-md bg-black px-6 py-3 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            블로그 보기
          </Link>
          <Link
            href="/about"
            className="rounded-md border border-zinc-300 px-6 py-3 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            소개
          </Link>
        </div>
      </div>
    </Container>
  );
}

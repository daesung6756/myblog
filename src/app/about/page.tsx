import Container from "../../components/ui/Container";

export default function AboutPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="text-3xl font-bold">소개</h1>
        <div className="prose mt-6 dark:prose-invert">
          <p>
            안녕하세요! 이 블로그는 Next.js, TypeScript, Tailwind CSS, shadcn-ui로 만들어졌습니다.
          </p>
          <p>
            개인 블로그로 기술 관련 글이나 일상을 공유할 예정입니다.
          </p>
          <h2>기술 스택</h2>
          <ul>
            <li>Next.js 15+ (App Router)</li>
            <li>TypeScript</li>
            <li>Tailwind CSS</li>
            <li>shadcn-ui</li>
            <li>Zustand (전역 상태 관리)</li>
            <li>react-markdown (마크다운 렌더링)</li>
            <li>SimpleMDE (마크다운 에디터)</li>
          </ul>
        </div>
      </div>
    </Container>
  );
}

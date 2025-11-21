import Link from "next/link";

export default function MicrositeNav() {
  return (
    <div className="border-b bg-zinc-50 dark:bg-zinc-900" style={{ borderBottomColor: 'var(--border)' }}>
      <div className="mx-auto flex max-w-[1440px] items-center justify-end gap-4 px-4 py-2 text-xs">
        <Link href="https://dutch-pay-lemon.vercel.app/" className="hover:underline" target="_blank" rel="noopener noreferrer">
          더치페이
        </Link>
        <Link href="https://a4-pdf-maker.vercel.app/" className="hover:underline">
          PDF 생성기
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function MicrositeNav() {
  return (
    <div className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-4xl items-center justify-end gap-4 px-4 py-2 text-xs">
        <Link href="/projects" className="hover:underline">
          Projects
        </Link>
        <Link href="/links" className="hover:underline">
          Links
        </Link>
        <Link href="/contact" className="hover:underline">
          Contact
        </Link>
      </div>
    </div>
  );
}

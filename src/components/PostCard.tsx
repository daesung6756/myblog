import Link from "next/link";

export default function PostCard({
  title,
  summary,
  slug,
  date,
}: {
  title: string;
  summary: string;
  slug: string;
  date?: string;
}) {
  return (
    <article className="rounded-md border p-4 hover:shadow dark:border-zinc-700">
      <h3 className="text-lg font-semibold">
        <Link href={`/blog/${slug}`} className="hover:underline">
          {title}
        </Link>
      </h3>
      {date && <p className="mt-1 text-xs text-zinc-500">{date}</p>}
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{summary}</p>
    </article>
  );
}

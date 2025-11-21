export default function Footer() {
  return (
    <footer className="w-full border-t">
      <div className="mx-auto max-w-[1440px] p-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        © {new Date().getFullYear()} Leeds. All rights reserved.
      </div>
    </footer>
  );
}

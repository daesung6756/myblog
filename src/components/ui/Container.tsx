export default function Container({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Ensure the container blends with surrounding surfaces in dark mode
  return (
    <div className="mx-auto max-w-[1440px] px-4 bg-transparent dark:bg-(--card)">
      {children}
    </div>
  );
}

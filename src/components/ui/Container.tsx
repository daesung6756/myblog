export default function Container({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="mx-auto max-w-4xl px-4">{children}</div>;
}

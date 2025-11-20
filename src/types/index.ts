export type PostMeta = {
  title: string;
  summary?: string;
  date?: string;
  tags?: string[];
  slug: string;
};

export type Theme = "light" | "dark";

export type SiteConfig = {
  title: string;
  description?: string;
};

export type User = {
  id?: string;
  name?: string;
  email?: string;
};

"use client";
import { create } from "zustand";
import type { Theme, User } from "../types";

type Store = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  user?: User;
  setUser: (u?: User) => void;
};

const useStore = create<Store>((set, get) => ({
  // Prefer a server-provided initial theme (window.__INITIAL_THEME) when present.
  theme:
    (typeof window !== "undefined" && (window as any).__INITIAL_THEME as Theme) ||
    (typeof window !== "undefined" && (localStorage.getItem("theme") as Theme)) ||
    (typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? ("dark" as Theme) : ("light" as Theme)),
  toggleTheme() {
    const next = get().theme === "light" ? "dark" : "light";
    set({ theme: next });
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", next);
      try {
        document.cookie = `theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
      } catch (e) {}
    }
  },
  setTheme(t: Theme) {
    set({ theme: t });
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", t);
      try {
        document.cookie = `theme=${t}; path=/; max-age=${60 * 60 * 24 * 365}`;
      } catch (e) {}
    }
  },
  user: undefined,
  setUser(u?: User) {
    set({ user: u });
  },
}));

export default useStore;

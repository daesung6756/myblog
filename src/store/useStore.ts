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
  theme: (typeof window !== "undefined" && (localStorage.getItem("theme") as Theme)) || "light",
  toggleTheme() {
    const next = get().theme === "light" ? "dark" : "light";
    set({ theme: next });
    if (typeof window !== "undefined") localStorage.setItem("theme", next);
  },
  setTheme(t: Theme) {
    set({ theme: t });
    if (typeof window !== "undefined") localStorage.setItem("theme", t);
  },
  user: undefined,
  setUser(u?: User) {
    set({ user: u });
  },
}));

export default useStore;

"use client";
import { useEffect } from "react";
import useStore from "../store/useStore";

export default function ThemeProvider() {
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  return null;
}

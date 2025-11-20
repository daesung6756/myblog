"use client";
import { useEffect, useState } from "react";

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const trackLength = documentHeight - windowHeight;
      const percent = trackLength > 0 ? (scrollTop / trackLength) * 100 : 0;
      setProgress(percent);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed left-0 top-0 z-50 h-1 w-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className="h-full bg-blue-600 transition-all duration-150 dark:bg-blue-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

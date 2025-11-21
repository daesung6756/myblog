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
    <div className="fixed left-0 top-[57px] md:top-[73px] z-40 h-1 w-full bg-gray-200/50 dark:bg-gray-800/50">
      <div
        className="h-full bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

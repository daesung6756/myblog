"use client";
import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const winH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const sc = window.scrollY;
      const track = Math.max(docH - winH, 1);
      const value = Math.min(Math.max(sc / track, 0), 1);
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${value})`;
      }
    };

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    update(); // initial

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="absolute left-0 bottom-0 h-1 w-full  dark:bg-slate-900 overflow-hidden">
      <div
        ref={barRef}
        className="h-full origin-left bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 transition-transform duration-300 ease-out"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

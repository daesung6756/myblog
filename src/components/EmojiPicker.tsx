"use client";
import React, { useState, useRef, useEffect } from "react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EMOJIS = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😍",
  "👍",
  "🙏",
  "🔥",
  "🎉",
  "😮",
  "😢",
  "😡",
  "🤔",
  "🙌",
  "✨",
  "😅",
  "🤗",
];

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="이모지 선택"
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <span className="text-lg">😊</span>
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-20 w-56 rounded-md border bg-white p-2 shadow-lg dark:bg-zinc-900">
          <div className="grid grid-cols-6 gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onSelect(e);
                  setOpen(false);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label={`이모지 ${e}`}
              >
                <span className="text-lg">{e}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

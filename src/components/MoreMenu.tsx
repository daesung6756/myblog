"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Item {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

export default function MoreMenu({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);

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

  // compute menu position when opened
  useEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuStyle(null);
      return;
    }

    const btn = buttonRef.current;
    const rect = btn.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Estimated menu size; we'll adjust after mount if needed
    const estimatedWidth = 160; // ~w-40
    const estimatedHeight = 200;

    let left = rect.right - estimatedWidth; // align right by default
    let top = rect.bottom + 8; // small offset

    // If not enough space to the right, align to left edge of button
    if (rect.right + 8 > viewportW) {
      left = rect.left - 8;
    }

    // If not enough space below, open upwards
    if (rect.bottom + estimatedHeight > viewportH) {
      top = rect.top - estimatedHeight - 8;
    }

    // clamp
    left = Math.max(8, Math.min(left, viewportW - 8 - estimatedWidth));
    top = Math.max(8, Math.min(top, viewportH - 8 - 40));

    setMenuStyle({ position: "fixed", left, top, zIndex: 9999 });

    const onScrollOrResize = () => {
      const r = btn.getBoundingClientRect();
      // measure actual menu size if available
      const menuW = menuRef.current?.offsetWidth ?? estimatedWidth;
      const menuH = menuRef.current?.offsetHeight ?? estimatedHeight;
      let newLeft = r.right - menuW;
      if (r.right + 8 > viewportW) newLeft = r.left - 8 - menuW + menuW; // align to left of button
      if (r.bottom + menuH > viewportH) {
        // open upwards
        const newTop = r.top - menuH - 8;
        setMenuStyle((s) => (s ? { ...s, left: Math.max(8, Math.min(newLeft, viewportW - 8 - menuW)), top: Math.max(8, Math.min(newTop, viewportH - 8 - 40)) } : s));
      } else {
        setMenuStyle((s) => (s ? { ...s, left: Math.max(8, Math.min(newLeft, viewportW - 8 - menuW)), top: Math.max(8, Math.min(r.bottom + 8, viewportH - 8 - 40)) } : s));
      }
    };

    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open]);

  // After the menu is rendered, measure its real size and adjust placement precisely
  useEffect(() => {
    if (!open) return;
    // measure on next tick after portal render
    const id = setTimeout(() => {
      if (!buttonRef.current || !menuRef.current) return;
      const btn = buttonRef.current;
      const rect = btn.getBoundingClientRect();
      const menuW = menuRef.current.offsetWidth;
      const menuH = menuRef.current.offsetHeight;
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      let left = rect.right - menuW;
      let top = rect.bottom + 8;
      if (rect.right + menuW > viewportW) {
        left = rect.left - 8;
      }
      if (rect.bottom + menuH > viewportH) {
        top = rect.top - menuH - 8;
      }
      left = Math.max(8, Math.min(left, viewportW - 8 - menuW));
      top = Math.max(8, Math.min(top, viewportH - 8 - menuH));
      setMenuStyle({ position: "fixed", left, top, zIndex: 9999 });
    }, 0);
    return () => clearTimeout(id);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="더보기"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 7a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && menuStyle && createPortal(
        <div ref={menuRef} style={menuStyle} className="w-40 origin-top-right divide-y divide-gray-100 rounded-md border bg-white shadow-lg dark:bg-zinc-900 dark:divide-zinc-800">
          <div className="py-1">
            {items.map((it, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  it.onClick();
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm ${it.destructive ? "text-red-600" : "text-zinc-700 dark:text-zinc-200"} hover:bg-zinc-100 dark:hover:bg-zinc-800`}
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

const SimpleMDE = dynamic(() => import("react-simplemde-editor"), { ssr: false });
import "easymde/dist/easymde.min.css";

export default function MarkdownEditor({
  value: initial = "",
  onChange,
}: {
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div>
      {/* @ts-ignore */}
      <SimpleMDE
        value={value}
        onChange={(v: string) => {
          setValue(v);
          onChange?.(v);
        }}
      />
    </div>
  );
}

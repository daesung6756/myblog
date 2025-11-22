"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
// Use server-side upload/compression (Editor.js upload route)

type Uploaded = { url: string; name: string };

export default function AdminImageUploader() {
  const [files, setFiles] = useState<Array<{ file: File; preview: string; error?: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<Uploaded[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const list = e.target.files;
    if (!list) return;

    const inFiles = Array.from(list);
    const items: Array<{ file: File; preview: string; error?: string }> = [];

    for (const f of inFiles) {
      try {
        const preview = URL.createObjectURL(f);
        items.push({ file: f, preview });
      } catch (err: any) {
        const preview = "";
        const msg = err?.message || String(err);
        items.push({ file: f, preview, error: msg });
        setError((prev) => (prev ? prev + `; ${f.name}: ${msg}` : `${f.name}: ${msg}`));
      }
    }

    // Revoke previous previews to avoid leaks
    files.forEach((p) => { try { URL.revokeObjectURL(p.preview); } catch {} });
    setFiles(items);
  }

  async function uploadAll() {
    if (files.length === 0) return;
    setError(null);
    // filter out files that have pre-existing errors (e.g. too large after compression)
    const toUpload = files.filter((p) => !p.error);
    const skipped = files.filter((p) => p.error).map((p) => `${p.file.name}: ${p.error}`);
    if (toUpload.length === 0) {
      setError(skipped.join('; '));
      return;
    }
    setUploading(true);
    setProgress(0);
    const results: Uploaded[] = [];

    for (let i = 0; i < toUpload.length; i++) {
      const f = toUpload[i].file;
      try {
        const form = new FormData();
        // Use Editor.js upload route which accepts field 'image' and does server-side sharp compression
        form.append("image", f, f.name);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || res.statusText);
        }
        const json = await res.json();
        // Editor.js upload route returns { success: 1, file: { url } }
        const publicUrl = json?.file?.url || json?.publicUrl || json?.url || json?.data?.publicUrl || "";
        results.push({ url: publicUrl, name: f.name });
        setProgress(Math.round(((i + 1) / toUpload.length) * 100));
      } catch (err: any) {
        setError(err?.message || String(err));
        console.error(err);
      }
    }

    setUploaded((prev) => [...results, ...prev]);
    setUploading(false);
    // revoke previews and clear file inputs
    files.forEach((p) => { try { URL.revokeObjectURL(p.preview); } catch {} });
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function copyToClipboard(url: string) {
    try {
      void navigator.clipboard.writeText(url);
      // show dialog confirmation
      setCopyMessage("클립보드에 복사되었습니다.");
      setCopyDialogOpen(true);
    } catch (e) {
      console.error(e);
      setCopyMessage("복사에 실패했습니다.");
      setCopyDialogOpen(true);
    }
  }

  function handleReset() {
    // revoke previews
    files.forEach((p) => {
      try {
        URL.revokeObjectURL(p.preview);
      } catch {}
    });
    setFiles([]);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="surface p-4 rounded-md">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">이미지 선택</label>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 rounded bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-100 hover:opacity-95"
            onClick={() => inputRef.current?.click()}
          >
            파일 선택
          </button>
          <span className="text-sm text-zinc-500">{files.length > 0 ? `${files.length}개 선택` : '선택된 파일 없음'}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="sr-only"
            aria-hidden="true"
          />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            className={`inline-flex items-center px-3 py-1.5 rounded text-white text-sm ${uploading || files.length === 0 ? 'bg-zinc-400 opacity-60 cursor-not-allowed' : 'bg-purple-600 hover:opacity-95'}`}
            onClick={uploadAll}
            disabled={uploading || files.length === 0}
            aria-disabled={uploading || files.length === 0}
          >
            {uploading ? `업로드중 ${progress}%` : "업로드"}
          </button>
          <button
            className={`inline-flex items-center px-3 py-1.5 rounded border text-sm ${uploading || files.length === 0 ? 'opacity-60 cursor-not-allowed' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
            onClick={handleReset}
            disabled={uploading || files.length === 0}
            aria-disabled={uploading || files.length === 0}
          >
            선택 초기화
          </button>
        </div>

        {error ? <p className="text-sm text-red-500 mt-2">{error}</p> : null}

        {files.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {files.map((p) => (
              <div key={p.file.name} className="p-1 surface-60 rounded">
                <img
                  src={p.preview}
                  alt={p.file.name}
                  className="w-full h-32 object-cover rounded"
                />
                <div className="text-xs mt-1">{p.file.name}</div>
                {p.error ? <div className="text-xs text-red-500 mt-1">{p.error}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">업로드된 이미지</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {uploaded.map((u) => (
            <div key={u.url} className="p-3 surface-60 rounded flex items-start gap-3">
              <img src={u.url} alt={u.name} className="w-20 h-20 object-cover rounded" />
              <div className="flex-1">
                <div className="text-sm font-medium">{u.name}</div>
                <div className="text-xs wrap-break-word text-zinc-600 dark:text-zinc-300 mt-1">{u.url}</div>
                <div className="mt-2 flex gap-2">
                  <button
                    className="px-2 py-1 text-sm rounded border"
                    onClick={() => copyToClipboard(u.url)}
                  >
                    링크 복사
                  </button>
                  <a href={u.url} target="_blank" rel="noreferrer" className="px-2 py-1 text-sm rounded border">
                    새 탭 열기
                  </a>
                </div>
              </div>
            </div>
          ))}
          {uploaded.length === 0 ? <div className="text-sm text-zinc-500">업로드된 이미지가 없습니다.</div> : null}
        </div>
      </div>
      <AlertDialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>알림</AlertDialogTitle>
            <AlertDialogDescription>{copyMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setCopyDialogOpen(false)}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

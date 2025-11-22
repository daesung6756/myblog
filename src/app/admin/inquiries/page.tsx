"use client";
import { useEffect, useState } from "react";
import Container from "@/components/ui/Container";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import confirm from "@/lib/confirm";

type Inquiry = {
  id: string;
  name: string | null;
  email: string;
  subject: string | null;
  message: string;
  created_at: string | null;
};

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inquiries")
      .select("id, name, email, subject, message, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data as Inquiry[]);
    }
    setLoading(false);
  };

  return (
    <Container>
      <div className="py-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">문의 관리</h1>
          <div className="flex gap-2 items-center">
            <Button
              size="sm"
              onClick={fetchInquiries}
              aria-label="새로고침"
              title="새로고침"
              className="surface border border-gray-200/50 dark:border-gray-700/50 rounded-md p-2 hover:shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.04 8.59A9 9 0 1 0 21 12" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v5h-5" />
              </svg>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-md border border-gray-200/50 dark:border-gray-700/50 p-4 surface-60 animate-pulse">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200/60 dark:bg-zinc-700 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200/50 dark:bg-zinc-700 rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-gray-200/50 dark:bg-zinc-700 rounded w-24" />
                </div>
                <div className="mt-3">
                  <div className="h-3 bg-gray-200/50 dark:bg-zinc-700 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200/50 dark:bg-zinc-700 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div>문의가 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="rounded-md border border-gray-200/50 dark:border-gray-700/50 p-4 surface-60">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{it.subject || "(제목 없음)"}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{it.name || "익명"} · {it.email}</p>
                  </div>
                  <div className="text-sm text-zinc-500">{it.created_at ? new Date(it.created_at).toLocaleString() : "-"}</div>
                </div>
                <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap">{it.message}</div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={async () => {
                    if (!(await confirm('이 문의를 삭제하시겠습니까?'))) return;
                    setActionLoading(it.id);
                    try {
                      const res = await fetch('/api/inquiries', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id }) });
                      if (!res.ok) throw new Error('삭제 실패');
                      setItems((s) => s.filter(x => x.id !== it.id));
                    } catch (e) {
                      alert('삭제 중 오류가 발생했습니다.');
                    } finally {
                      setActionLoading(null);
                    }
                  }}>{actionLoading === it.id ? '처리 중...' : '삭제'}</Button>

                  <Button size="sm" onClick={async () => {
                    setActionLoading(it.id);
                    try {
                      const res = await fetch('/api/inquiries', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id, responded: true }) });
                      if (!res.ok) throw new Error('업데이트 실패');
                      // update local state
                      setItems((s) => s.map(x => x.id === it.id ? { ...x, responded: true } as any : x));
                      alert('응답 처리됨으로 표시되었습니다.');
                    } catch (e) {
                      alert('업데이트 중 오류가 발생했습니다.');
                    } finally {
                      setActionLoading(null);
                    }
                  }}>{actionLoading === it.id ? '처리 중...' : '응답됨으로 표시'}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

"use client";
import { useState, useRef, useEffect } from "react";
import Container from "@/components/ui/Container";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (success && statusRef.current) {
      // move focus to status for screen readers
      statusRef.current.focus();
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // client-side basic validation guard
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError("유효한 이메일을 입력하세요.");
        setLoading(false);
        return;
      }
      // include honeypot 'website' field (should be empty for humans)
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website: "" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "서버에 저장하지 못했습니다.");
      }

      setSuccess("문의가 접수되었습니다. 감사합니다!");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setError(err?.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email);
  const canSubmit = isEmailValid(email) && message.trim().length > 0;

  return (
    <Container>
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-2">문의하기</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          문의사항이나 제안이 있으시면 아래 양식을 통해 보내주세요. 가능한 빠르게 회신드리겠습니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field (hidden) to catch simple bots */}
          <div style={{ display: "none" }} aria-hidden>
            <label>Website</label>
            <input name="website" autoComplete="off" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">이름</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" required aria-invalid={email.length>0 && !isEmailValid(email)} />
            {email.length > 0 && !isEmailValid(email) && (
              <p className="mt-1 text-xs text-red-600">유효한 이메일을 입력하세요.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">제목</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="문의 제목" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">메시지</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="문의 내용을 입력하세요" required />
          </div>

          <div className="flex w-full items-center gap-3 justify-end">
            <Button type="submit" disabled={loading || !canSubmit} className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
              {loading ? "전송 중..." : "문의 보내기"}
            </Button>
            {success && <p className="text-sm text-green-600">{success}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </form>
        {/* status container for screen readers */}
        <div aria-live="polite" role="status" tabIndex={-1} ref={statusRef} className="sr-only" />
      </div>
    </Container>
  );
}

"use client";
import { useState } from "react";
import Container from "../../../components/ui/Container";
import { useRouter } from "next/navigation";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import LoginButton from "../../../components/LoginButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

export default function LoginPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const showDialog = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        showDialog('오류', data.error || '로그인 실패');
      } else {
        // Full navigation to ensure server session cookie is used.
        window.location.href = '/admin/posts';
      }
    } catch (error: any) {
      showDialog('오류', '로그인 실패: ' + (error?.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md space-y-6 rounded-lg border p-8 dark:border-zinc-700">
          <h1 className="text-2xl font-bold">관리자 로그인</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">이메일</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">비밀번호</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <LoginButton
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
              label={loading ? "로그인 중..." : "로그인"}
            />
          </form>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setDialogOpen(false)}>확인</Button>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

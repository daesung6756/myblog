"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { z } from "zod";

const commentSchema = z.object({
  authorName: z.string().min(1, "이름을 입력해주세요").max(50, "이름은 50자 이하로 입력해주세요"),
  authorEmail: z.string().email("올바른 이메일 주소를 입력해주세요"),
  content: z.string().min(1, "댓글 내용을 입력해주세요").max(1000, "댓글은 1000자 이하로 입력해주세요"),
  password: z.string().min(4, "비밀번호는 최소 4자 이상이어야 합니다").max(20, "비밀번호는 20자 이하로 입력해주세요"),
});

interface Comment {
  id: string;
  author_name: string;
  author_email: string;
  content: string;
  created_at: string;
  password_hash: string;
}

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const showDialog = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (data) {
      setComments(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Zod 유효성 검사
    const validation = commentSchema.safeParse({
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim(),
      content: content.trim(),
      password: password,
    });

    if (!validation.success) {
      const newErrors: { [key: string]: string } = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // API 라우트로 댓글 작성 요청
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: postId,
          authorName: validation.data.authorName,
          authorEmail: validation.data.authorEmail,
          content: validation.data.content,
          password: validation.data.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showDialog("오류", data.error || "댓글 작성에 실패했습니다.");
      } else {
        setAuthorName("");
        setAuthorEmail("");
        setContent("");
        setPassword("");
        fetchComments();
        showDialog("성공", "댓글이 작성되었습니다.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      showDialog("오류", "댓글 작성 중 오류가 발생했습니다.");
    }

    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!deletePassword) {
      showDialog("확인", "비밀번호를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (response.ok) {
        showDialog("성공", "댓글이 삭제되었습니다.");
        setDeletingId(null);
        setDeletePassword("");
        fetchComments();
      } else {
        showDialog("오류", data.error || "댓글 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showDialog("오류", "댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="mt-8 sm:mt-12 border-t pt-6 sm:pt-8">
      <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">댓글 ({comments.length})</h2>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div>
            <Input
              type="text"
              placeholder="이름 *"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="h-10 sm:h-11"
            />
            {errors.authorName && (
              <p className="mt-1 text-sm text-red-500">{errors.authorName}</p>
            )}
          </div>
          <div>
            <Input
              type="email"
              placeholder="이메일 *"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              className="h-10 sm:h-11"
            />
            {errors.authorEmail && (
              <p className="mt-1 text-sm text-red-500">{errors.authorEmail}</p>
            )}
          </div>
        </div>
        <div>
          <Input
            type="password"
            placeholder="비밀번호 (삭제 시 필요) *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 sm:h-11"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
        </div>
        <div>
          <Textarea
            placeholder="댓글을 입력하세요 *"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="text-sm sm:text-base"
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-500">{errors.content}</p>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto h-10 sm:h-11">
            {loading ? "작성 중..." : "댓글 작성"}
          </Button>
        </div>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-3 sm:space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
            첫 댓글을 작성해보세요!
          </p>
        ) : (
          <>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border bg-white p-3 sm:p-4 dark:bg-zinc-900"
              >
                <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="font-semibold text-sm sm:text-base">{comment.author_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-zinc-500">
                      {new Date(comment.created_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(comment.id)}
                      className="text-red-500 hover:text-red-700 h-8"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm sm:text-base text-zinc-700 dark:text-zinc-300 wrap-break-word">
                  {comment.content}
                </p>
                {deletingId === comment.id && (
                  <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-t pt-3">
                    <Input
                      type="password"
                      placeholder="비밀번호 입력"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="flex-1 h-9"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDelete(comment.id)}
                        className="flex-1 sm:flex-none h-9"
                      >
                        확인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDeletingId(null);
                          setDeletePassword("");
                        }}
                        className="flex-1 sm:flex-none h-9"
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
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
    </div>
  );
}

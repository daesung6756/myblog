"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import CommentMoreButton from "./CommentMoreButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { z } from "zod";
import timeAgo from "../lib/timeAgo";
import EmojiPicker from "./EmojiPicker";
import CommentItem from "./CommentItem";
import CommentItemReplyList from "./CommentItemReplyList";
import maskIp from "@/lib/maskIp";
import CommentForm from "./CommentForm";

const commentSchema = z.object({
  authorName: z.string().min(1, "이름을 입력해주세요").max(50, "이름은 50자 이하로 입력해주세요"),
  // 이메일은 선택 항목입니다. 빈 문자열이면 허용하고, 입력한 경우 형식을 검사합니다.
  authorEmail: z.string().refine((s) => s.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), {
    message: "올바른 이메일 주소를 입력해주세요",
  }),
  content: z.string().min(1, "댓글 내용을 입력해주세요").max(1000, "댓글은 1000자 이하로 입력해주세요"),
  // 비밀번호는 선택 항목입니다. 비어있으면 허용하고, 입력한 경우 길이를 검사합니다.
  password: z.string().refine((s) => s === "" || (s.length >= 4 && s.length <= 20), {
    message: "비밀번호는 4자 이상 20자 이하로 입력해주세요",
  }),
});

interface Comment {
  id: string;
  author_name: string;
  author_email: string;
  content: string;
  created_at: string;
  password_hash: string;
  ip_address?: string | null;
  deleted_at?: string | null;
  deleted_by_admin?: boolean | null;
  reply_to?: string | null;
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

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyAuthorName, setReplyAuthorName] = useState("");
  const [replyAuthorEmail, setReplyAuthorEmail] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyPassword, setReplyPassword] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyErrors, setReplyErrors] = useState<{ [key: string]: string }>({});
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // IP 마스킹 유틸: IPv4는 마지막 옥텟 전체를 '***'로, IPv6는 마지막 그룹을 '***'로 마스킹합니다.
  const maskIp = (ip?: string | null) => {
    if (!ip) return "";
    // IPv4
    if (ip.includes(".")) {
      const parts = ip.split(".");
      if (parts.length >= 4) {
        parts[parts.length - 1] = "***";
        return parts.join(".");
      }
    }
    // IPv6
    if (ip.includes(":")) {
      const parts = ip.split(":");
      parts[parts.length - 1] = "***";
      return parts.join(":");
    }
    // 기타: 끝의 3문자 마스킹
    return ip.slice(0, Math.max(0, ip.length - 3)) + "***";
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const showDialog = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const fetchComments = async () => {
    // Always fetch all comments for this post, then let the client decide
    // which to display. This allows us to show placeholders for comments
    // soft-deleted by admins (deleted_by_admin = true) while hiding other
    // deleted rows.
    let data: any = null;
    try {
      const res = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      data = res.data;
    } catch (e) {
      data = null;
    }

    if (data) {
      console.log('[fetchComments] raw data count:', data.length, data.find((c: any) => c.id === data[0]?.id));
      // Exclude comments that were deleted by their author (deleted_at set
      // and deleted_by_admin not true). Keep admin-deleted rows so we can
      // render placeholders client-side.
      data = data.filter((c: any) => !(c.deleted_at && !c.deleted_by_admin));
      // Build a nested ordering that supports replies to replies.
      // Create a map of parentId -> children array for efficient lookup,
      // then traverse starting from top-level comments.
      const childrenMap = new Map<string, any[]>();
      const byId = new Map<string, any>();
      data.forEach((c: any) => {
        byId.set(String(c.id), c);
        if (c.reply_to) {
          const key = String(c.reply_to);
          const arr = childrenMap.get(key) || [];
          arr.push(c);
          childrenMap.set(key, arr);
        }
      });

      // Top-level comments (no reply_to), newest last as before
      const topLevel = data.filter((c: any) => !c.reply_to).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const ordered: Comment[] = [];

      const appendWithChildren = (parent: any) => {
        ordered.push(parent);
        const children = (childrenMap.get(String(parent.id)) || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        for (const child of children) {
          appendWithChildren(child);
        }
      };

      for (const parent of topLevel) {
        appendWithChildren(parent);
      }

      // Preserve locally-known admin-deleted flags to avoid flicker where an
      // optimistic UI update is overwritten by a slightly stale server read.
      const prevMap = new Map(comments.map((c) => [c.id, c]));
      const merged = ordered.map((c) => {
        const prev = prevMap.get(c.id);
        if (prev && prev.deleted_by_admin) {
          return { ...c, deleted_by_admin: true, deleted_at: prev.deleted_at || c.deleted_at };
        }
        return c;
      });
      console.log('[fetchComments] merged count:', merged.length, 'sample:', merged.slice(0,3));
      setComments(merged);
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
        credentials: "include",
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

  const insertEmojiAtCaret = (emoji: string) => {
    const el = textareaRef.current
    if (!el) {
      setContent((c) => c + emoji)
      return
    }
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    const newValue = content.slice(0, start) + emoji + content.slice(end)
    setContent(newValue)
    // restore focus and caret after React updates
    setTimeout(() => {
      el.focus()
      const pos = start + emoji.length
      el.selectionStart = el.selectionEnd = pos
    }, 0)
  }

  const insertEmojiAtCaretReply = (emoji: string) => {
    const el = replyTextareaRef.current
    if (!el) {
      setReplyContent((c) => c + emoji)
      return
    }
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    const newValue = replyContent.slice(0, start) + emoji + replyContent.slice(end)
    setReplyContent(newValue)
    setTimeout(() => {
      el.focus()
      const pos = start + emoji.length
      el.selectionStart = el.selectionEnd = pos
    }, 0)
  }

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplyErrors({});

    const validation = commentSchema.safeParse({
      authorName: replyAuthorName.trim(),
      authorEmail: replyAuthorEmail.trim(),
      content: replyContent.trim(),
      password: replyPassword,
    });

    if (!validation.success) {
      const newErrors: { [key: string]: string } = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setReplyErrors(newErrors);
      return;
    }

    setReplyLoading(true);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: postId,
          authorName: validation.data.authorName,
          authorEmail: validation.data.authorEmail,
          content: validation.data.content,
          password: validation.data.password,
          // optional: include parent id as reply_to if backend supports it
          replyTo: replyingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showDialog("오류", data.error || "댓글 작성에 실패했습니다.");
      } else {
        setReplyAuthorName("");
        setReplyAuthorEmail("");
        setReplyContent("");
        setReplyPassword("");
        setReplyingId(null);
        fetchComments();
        showDialog("성공", "댓글이 작성되었습니다.");
      }
    } catch (error) {
      console.error("Reply submit error:", error);
      showDialog("오류", "댓글 작성 중 오류가 발생했습니다.");
    }

    setReplyLoading(false);
  };

  return (
    <div className="mt-8 sm:mt-12 border-t pt-6 sm:pt-8">
      <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">댓글 ({comments.length})</h2>

      <CommentForm
        authorName={authorName}
        setAuthorName={setAuthorName}
        authorEmail={authorEmail}
        setAuthorEmail={setAuthorEmail}
        password={password}
        setPassword={setPassword}
        content={content}
        setContent={setContent}
        errors={errors}
        loading={loading}
        textareaRef={textareaRef}
        insertEmojiAtCaret={insertEmojiAtCaret}
        onSubmit={handleSubmit}
      />

      {/* 댓글 목록 */}
      <div className="space-y-3 sm:space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
            첫 댓글을 작성해보세요!
          </p>
        ) : (
          <>
            {/** Render only top-level comments; replies are handled by CommentItemReplyList */}
            {comments
              .filter((c) => !c.reply_to)
              .map((comment) => (
                <div key={comment.id}>
                  <CommentItem
                    comment={comment}
                    onReply={(id, name) => {
                      setReplyingId(id);
                      setReplyAuthorName("");
                      setReplyAuthorEmail("");
                      setReplyPassword("");
                      setReplyContent(`@${name} `);
                      setTimeout(() => replyTextareaRef.current?.focus(), 0);
                    }}
                    onAdminDelete={async () => {
                      try {
                        const res = await fetch(`/api/comments/${comment.id}`, {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                        });
                        const data = await res.json();
                        if (res.ok) {
                          const payload = data || {};
                          if (payload.comment) {
                            const updated = { ...payload.comment };
                            if (!updated.deleted_by_admin) {
                              updated.deleted_by_admin = true;
                              if (!updated.deleted_at) updated.deleted_at = new Date().toISOString();
                            }
                            setComments((prev) => prev.map((c) => (c.id === comment.id ? updated : c)));
                            setTimeout(() => fetchComments(), 500);
                          } else {
                            setComments((prev) =>
                              prev.map((c) =>
                                c.id === comment.id
                                  ? { ...c, deleted_by_admin: true, deleted_at: new Date().toISOString() }
                                  : c
                              )
                            );
                            setTimeout(() => fetchComments(), 500);
                          }
                          showDialog("성공", "관리자에 의해 삭제 되었습니다");
                        } else {
                          showDialog("오류", data.error || "댓글 삭제에 실패했습니다.");
                        }
                      } catch (err) {
                        console.error("Admin delete error:", err);
                        showDialog("오류", "댓글 삭제 중 오류가 발생했습니다.");
                      }
                    }}
                    onDeleteClick={() => setDeletingId(comment.id)}
                    onCancel={() => {
                      setDeletingId(null);
                      setDeletePassword("");
                    }}
                    deletingId={deletingId}
                    deletePassword={deletePassword}
                    setDeletePassword={setDeletePassword}
                    handleDelete={handleDelete}
                    replyingId={replyingId}
                    setReplyingId={setReplyingId}
                    replyAuthorName={replyAuthorName}
                    setReplyAuthorName={setReplyAuthorName}
                    replyAuthorEmail={replyAuthorEmail}
                    setReplyAuthorEmail={setReplyAuthorEmail}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    replyPassword={replyPassword}
                    setReplyPassword={setReplyPassword}
                    replyLoading={replyLoading}
                    replyErrors={replyErrors}
                    setReplyErrors={setReplyErrors}
                    replyTextareaRef={replyTextareaRef}
                    insertEmojiAtCaretReply={insertEmojiAtCaretReply}
                    handleReplySubmit={handleReplySubmit}
                  />

                  {/** Replies toggle/list */}
                  <CommentItemReplyList
                    parentId={comment.id}
                    comments={comments}
                    onReply={(id, name) => {
                      setReplyingId(id);
                      setReplyAuthorName("");
                      setReplyAuthorEmail("");
                      setReplyPassword("");
                      setReplyContent(`@${name} `);
                      setTimeout(() => replyTextareaRef.current?.focus(), 0);
                    }}
                    onDeleteClick={(id) => setDeletingId(id)}
                    onAdminDelete={async (id) => {
                      try {
                        const res = await fetch(`/api/comments/${id}`, {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setComments((prev) => prev.map((c) => (c.id === id ? { ...c, deleted_by_admin: true, deleted_at: new Date().toISOString() } : c)));
                          setTimeout(() => fetchComments(), 500);
                          showDialog("성공", "관리자에 의해 삭제 되었습니다");
                        } else {
                          showDialog("오류", data.error || "댓글 삭제에 실패했습니다.");
                        }
                      } catch (err) {
                        console.error("Admin delete error:", err);
                        showDialog("오류", "댓글 삭제 중 오류가 발생했습니다.");
                      }
                    }}
                    onCancel={() => {
                      setDeletingId(null);
                      setDeletePassword("");
                    }}
                    deletingId={deletingId}
                    deletePassword={deletePassword}
                    setDeletePassword={setDeletePassword}
                    handleDelete={handleDelete}
                    replyingId={replyingId}
                    setReplyingId={setReplyingId}
                    replyAuthorName={replyAuthorName}
                    setReplyAuthorName={setReplyAuthorName}
                    replyAuthorEmail={replyAuthorEmail}
                    setReplyAuthorEmail={setReplyAuthorEmail}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    replyPassword={replyPassword}
                    setReplyPassword={setReplyPassword}
                    replyLoading={replyLoading}
                    replyErrors={replyErrors}
                    setReplyErrors={setReplyErrors}
                    replyTextareaRef={replyTextareaRef}
                    insertEmojiAtCaretReply={insertEmojiAtCaretReply}
                    handleReplySubmit={handleReplySubmit}
                    depth={1}
                  />

                  {replyingId === comment.id && (
                    <div className="mt-4 pt-6">
                      <CommentForm
                        authorName={replyAuthorName}
                        setAuthorName={setReplyAuthorName}
                        authorEmail={replyAuthorEmail}
                        setAuthorEmail={setReplyAuthorEmail}
                        password={replyPassword}
                        setPassword={setReplyPassword}
                        content={replyContent}
                        setContent={setReplyContent}
                        errors={replyErrors}
                        loading={replyLoading}
                        textareaRef={replyTextareaRef}
                        insertEmojiAtCaret={insertEmojiAtCaretReply}
                        onSubmit={handleReplySubmit}
                        onCancel={() => {
                          setReplyingId(null);
                          setReplyAuthorName("");
                          setReplyAuthorEmail("");
                          setReplyContent("");
                          setReplyPassword("");
                          setReplyErrors({});
                        }}
                      />
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

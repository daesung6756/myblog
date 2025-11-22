"use client";
import React from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import EmojiPicker from "./EmojiPicker";

interface Props {
  authorName: string;
  setAuthorName: (s: string) => void;
  authorEmail: string;
  setAuthorEmail: (s: string) => void;
  password: string;
  setPassword: (s: string) => void;
  content: string;
  setContent: (s: string) => void;
  errors: { [key: string]: string };
  loading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  insertEmojiAtCaret: (emoji: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
}

export default function CommentForm({
  authorName,
  setAuthorName,
  authorEmail,
  setAuthorEmail,
  password,
  setPassword,
  content,
  setContent,
  errors,
  loading,
  textareaRef,
  insertEmojiAtCaret,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
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
            placeholder="이메일 (선택)"
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
          placeholder="비밀번호 (선택, 삭제 시 필요)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 sm:h-11"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password}</p>
        )}
      </div>

      <div>
        <div className="flex items-start gap-2">
          <div className="pt-2">
            <EmojiPicker onSelect={insertEmojiAtCaret} />
          </div>
          <Textarea
            ref={textareaRef}
            placeholder="댓글을 입력하세요 *"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="text-sm sm:text-base"
          />
        </div>
        {errors.content && (
          <p className="mt-1 text-sm text-red-500">{errors.content}</p>
        )}
      </div>

      <div className="flex justify-end">
        {onCancel ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="rounded-full px-4 h-10 sm:h-11"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="accent"
              className="rounded-full px-5 h-10 sm:h-11 shadow-sm"
            >
              <span className="sr-only">댓글 작성</span>
              <span aria-hidden>{loading ? "작성 중..." : "댓글 작성"}</span>
            </Button>
          </div>
        ) : (
          <Button
            type="submit"
            disabled={loading}
            variant="accent"
            className="rounded-full px-5 h-10 sm:h-11 shadow-sm"
          >
            <span className="sr-only">댓글 작성</span>
            <span aria-hidden>{loading ? "작성 중..." : "댓글 작성"}</span>
          </Button>
        )}
      </div>
    </form>
  );
}

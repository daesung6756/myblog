"use client";
import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import timeAgo from "../lib/timeAgo";
import CommentMoreButton from "./CommentMoreButton";
import maskIp from "@/lib/maskIp";

export interface CommentType {
  id: string;
  author_name: string;
  author_email: string;
  content: string;
  created_at: string;
  password_hash?: string;
  ip_address?: string | null;
  deleted_at?: string | null;
  deleted_by_admin?: boolean | null;
  reply_to?: string | null;
}

interface Props {
  comment: CommentType;
  onReply: (id: string, authorName: string) => void;
  onDeleteClick: () => void;
  onAdminDelete?: () => void;
  onCancel: () => void;
  deletingId: string | null;
  deletePassword: string;
  setDeletePassword: (s: string) => void;
  handleDelete: (id: string) => Promise<void>;
  // Optional reply form state forwarded from CommentSection
  replyingId?: string | null;
  setReplyingId?: (id: string | null) => void;
  replyAuthorName?: string;
  setReplyAuthorName?: (s: string) => void;
  replyAuthorEmail?: string;
  setReplyAuthorEmail?: (s: string) => void;
  replyContent?: string;
  setReplyContent?: (s: string) => void;
  replyPassword?: string;
  setReplyPassword?: (s: string) => void;
  replyLoading?: boolean;
  replyErrors?: { [key: string]: string };
  setReplyErrors?: (o: { [key: string]: string }) => void;
  replyTextareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  insertEmojiAtCaretReply?: (emoji: string) => void;
  handleReplySubmit?: (e: React.FormEvent) => Promise<void>;
}

export default function CommentItem({ comment, onReply, onDeleteClick, onAdminDelete, onCancel, deletingId, deletePassword, setDeletePassword, handleDelete }: Props) {
  // Convert comment text with @mentions into React nodes with anchor links.
  const renderContentWithMentions = (text: string) => {
    if (!text) return null;
    const nodes: React.ReactNode[] = [];
    // Match @username where username may include latin, numbers, underscore, hyphen, and Korean chars
    const mentionRegex = /@([a-zA-Z0-9_\-\u3131-\u318E\uAC00-\uD7A3]+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = mentionRegex.exec(text)) !== null) {
      const idx = match.index;
      const before = text.slice(lastIndex, idx);
      if (before) nodes.push(before);
      const username = match[1];
        const href = `#comment-${encodeURIComponent(username)}`;
        nodes.push(
          <a
            key={`mention-${key++}-${idx}`}
            href={href}
            className="text-blue-600 hover:underline"
            aria-label={`@${username} 포커스`}
            onClick={(e) => {
              e.preventDefault();
              // Find the first element with matching data-author-name and scroll to it
              const els = document.querySelectorAll('[data-author-name]');
              for (let i = 0; i < els.length; i++) {
                const el = els[i] as HTMLElement;
                if (el.dataset.authorName === username) {
                  try {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.focus();
                  } catch (err) {
                    // ignore
                  }
                  break;
                }
              }
            }}
          >
            @{username}
          </a>
        );
      lastIndex = idx + match[0].length;
    }
    const rest = text.slice(lastIndex);
    if (rest) nodes.push(rest);
    return nodes;
  };
  return (
      <div id={`comment-${comment.id}`} data-author-name={comment.author_name} tabIndex={-1} className="relative rounded-lg border bg-white p-3 pr-10 sm:p-4 sm:pr-12 dark:bg-zinc-900">
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm sm:text-base">{comment.author_name}</span>
          <span className="text-xs sm:text-sm text-zinc-500">{timeAgo(comment.created_at)}</span>
          {comment.ip_address && (
            <span className="text-xs sm:text-sm text-zinc-500 ml-2">IP: {maskIp(comment.ip_address)}</span>
          )}
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-2">
          {!comment.deleted_by_admin && (
            <CommentMoreButton
              authorName={comment.author_name}
              onReply={() => onReply(comment.id, comment.author_name)}
              onDelete={onDeleteClick}
              onAdminDelete={onAdminDelete}
            />
          )}
        </div>
      </div>

      {comment.deleted_by_admin ? (
        <p className="text-sm sm:text-base italic text-zinc-500">관리자에 의해 삭제된 댓글입니다.</p>
      ) : (
        <p className="whitespace-pre-wrap text-sm sm:text-base dark:text-zinc-300 wrap-break-word">
          {renderContentWithMentions(comment.content)}
        </p>
      )}

      {(!comment.deleted_by_admin && deletingId === comment.id) && (
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
              variant="destructive"
              onClick={() => handleDelete(comment.id)}
              className="flex-1 sm:flex-none h-9 rounded-md bg-red-600 text-white z-10"
            >
              확인
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onCancel()
              }}
              className="flex-1 sm:flex-none h-9 rounded-md"
            >
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState } from "react";
import CommentItemReply from "./CommentItemReply";
import CommentForm from "./CommentForm";

import type { CommentType } from "./CommentItem";

interface Props {
  parentId: string;
  comments: CommentType[];
  onReply: (id: string, authorName: string) => void;
  onDeleteClick: (id: string) => void;
  onAdminDelete?: (id: string) => Promise<void> | void;
  onCancel: () => void;
  deletingId: string | null;
  deletePassword: string;
  setDeletePassword: (s: string) => void;
  handleDelete: (id: string) => Promise<void>;
  // reply form state/handlers (forwarded from CommentSection)
  replyingId: string | null;
  setReplyingId: (id: string | null) => void;
  replyAuthorName: string;
  setReplyAuthorName: (s: string) => void;
  replyAuthorEmail: string;
  setReplyAuthorEmail: (s: string) => void;
  replyContent: string;
  setReplyContent: (s: string) => void;
  replyPassword: string;
  setReplyPassword: (s: string) => void;
  replyLoading: boolean;
  replyErrors: { [key: string]: string };
  setReplyErrors: (o: { [key: string]: string }) => void;
  replyTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  insertEmojiAtCaretReply: (emoji: string) => void;
  handleReplySubmit: (e: React.FormEvent) => Promise<void>;
  depth?: number;
}

export default function CommentItemReplyList({
  parentId,
  comments,
  onReply,
  onDeleteClick,
  onAdminDelete,
  onCancel,
  deletingId,
  deletePassword,
  setDeletePassword,
  handleDelete,
  replyingId,
  setReplyingId,
  replyAuthorName,
  setReplyAuthorName,
  replyAuthorEmail,
  setReplyAuthorEmail,
  replyContent,
  setReplyContent,
  replyPassword,
  setReplyPassword,
  replyLoading,
  replyErrors,
  setReplyErrors,
  replyTextareaRef,
  insertEmojiAtCaretReply,
  handleReplySubmit,
  depth = 1,
}: Props) {
  const [open, setOpen] = useState(false);

  const depthToIndent = (d = 1) => {
    const dd = Math.min(Math.max(d, 1), 2);
    switch (dd) {
      case 1:
        return "ml-4 sm:ml-8";
      case 2:
      default:
        return "ml-8 sm:ml-12";
    }
  };

  const children = comments
    .filter((c: any) => c.reply_to === parentId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (!children || children.length === 0) return null;

  return (
    <div className="mt-2">
      <div className={`${depthToIndent(depth)} relative mt-3 mb-6`}>
        <div
          className="absolute -left-4 sm:-left-8 top-1/2 transform -translate-y-1/2 pointer-events-none"
          aria-hidden
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3 text-zinc-400 dark:text-zinc-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <button
          type="button"
          className="text-sm text-zinc-500 hover:underline relative z-10"
          onClick={() => setOpen((s) => !s)}
          aria-expanded={open}
        >
          {open ? `답글 숨기기` : `답글이 ${children.length}개 있습니다.`}
        </button>
      </div>

      <div className="space-y-2">
        {open ? (
          <div className="transition-opacity duration-200">
            {children.map((c) => (
              <div key={c.id}>
                <CommentItemReply
                  comment={c}
                  depth={depth}
                  onReply={(id, name) => onReply(id, name)}
                  onDeleteClick={() => onDeleteClick(c.id)}
                  onAdminDelete={() => onAdminDelete?.(c.id)}
                  onCancel={onCancel}
                  deletingId={deletingId}
                  deletePassword={deletePassword}
                  setDeletePassword={setDeletePassword}
                  handleDelete={handleDelete}
                />

                {replyingId === c.id && (
                  <div className="mt-2 pt-6">
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

                <CommentItemReplyList
                  parentId={c.id}
                  comments={comments}
                  onReply={onReply}
                  onDeleteClick={onDeleteClick}
                  onAdminDelete={onAdminDelete}
                  onCancel={onCancel}
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
                  depth={Math.min(depth + 1, 2)}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

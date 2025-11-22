"use client";
import React from "react";
import CommentItem, { CommentType } from "./CommentItem";

interface Props {
  comment: CommentType;
  depth?: number;
  onReply: (id: string, authorName: string) => void;
  onDeleteClick: () => void;
  onAdminDelete?: () => void;
  onCancel: () => void;
  deletingId: string | null;
  deletePassword: string;
  setDeletePassword: (s: string) => void;
  handleDelete: (id: string) => Promise<void>;
}

// Maximum visual indent steps: only apply distinct styling up to depth 2
// (reply, reply-to-reply). Deeper replies render using depth 2 styling.
const depthToClass = (depth = 1) => {
  const d = Math.min(Math.max(depth, 1), 2);
  switch (d) {
    case 1:
      return "ml-4 sm:ml-8";
    case 2:
    default:
      return "ml-8 sm:ml-12";
  }
};

// A thin wrapper to render a reply with indentation/styles. Reuses CommentItem.
export default function CommentItemReply({ depth = 1, ...props }: Props) {
  // Compute pixel offset for arrow/line so arrow sits in the left gutter
  const capped = Math.min(Math.max(depth, 1), 4);
  const leftOffset = capped * 12; // px

  return (
    <div className={depthToClass(depth) + " relative"}>
      {/* vertical connector removed per design request */}

      <CommentItem {...(props as any)} />
    </div>
  );
}

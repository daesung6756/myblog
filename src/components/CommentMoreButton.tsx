"use client";
import React, { useEffect, useState } from "react";
import MoreMenu from "./MoreMenu";
import { useAuth } from "./AuthProvider";

interface Props {
  authorName: string;
  onReply?: () => void;
  onDelete?: () => void;
  onAdminDelete?: () => void;
  className?: string;
}

export default function CommentMoreButton({ authorName, onReply, onDelete, onAdminDelete }: Props) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const hasMetaAdmin = !!(user && ((user as any).user_metadata?.is_admin || (user as any).app_metadata?.role === "admin"));
    // If metadata indicates admin use that. Otherwise, show admin actions when
    // a user is present — server will still enforce permissions.
    setIsAdmin(hasMetaAdmin || !!user);
  }, [user]);

  const items = [] as { label: string; onClick: () => void; destructive?: boolean }[];

  if (onReply) {
    items.push({ label: "답글", onClick: onReply });
  }

  if (onDelete) {
    items.push({ label: "삭제", onClick: onDelete, destructive: true });
  }

  if (isAdmin && onAdminDelete) {
    items.push({ label: "관리자 삭제", onClick: onAdminDelete, destructive: true });
  }

  return <MoreMenu items={items} />;
}

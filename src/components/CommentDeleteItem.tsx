"use client";
import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface Props {
  commentId: string;
  password: string;
  setPassword: (s: string) => void;
  onConfirm: (id: string) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CommentDeleteItem({ commentId, password, setPassword, onConfirm, onCancel, loading }: Props) {
  return (
    <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-t pt-3">
      <Input
        type="password"
        placeholder="비밀번호 입력"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="flex-1 h-9"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onConfirm(commentId)}
          className="flex-1 sm:flex-none h-9 rounded-md bg-red-600 text-white z-10"
          disabled={loading}
        >
          확인
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="flex-1 sm:flex-none h-9 rounded-md"
          disabled={loading}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

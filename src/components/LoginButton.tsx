"use client";
import React from "react";

interface Props {
  label?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export default function LoginButton({
  label = "로그인",
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
  icon,
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary:
      "bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500 shadow-sm",
    ghost: "bg-transparent text-sky-600 hover:bg-sky-50 focus:ring-sky-300",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm",
  };

  const cls = `${base} ${variants[variant] ?? variants.primary} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      className={cls}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
      ) : (
        icon && <span className="-ml-1 mr-2 h-5 w-5 inline-flex items-center">{icon}</span>
      )}

      <span>{label}</span>
    </button>
  );
}

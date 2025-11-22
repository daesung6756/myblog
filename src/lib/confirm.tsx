"use client";
import React from "react";
import { createRoot } from "react-dom/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

export function confirm(message: string, title = "확인") {
  return new Promise<boolean>((resolve) => {
    if (typeof document === "undefined") {
      // fallback to native confirm on server (shouldn't normally happen)
      resolve(window.confirm(message));
      return;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const cleanup = () => {
      try {
        root.unmount();
      } catch (e) {
        /* ignore */
      }
      if (container.parentNode) container.parentNode.removeChild(container);
    };

    const ConfirmApp: React.FC = () => {
      const [open, setOpen] = React.useState(true);

      return (
        <AlertDialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); resolve(false); cleanup(); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{message}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => { setOpen(false); resolve(false); cleanup(); }}>
                취소
              </AlertDialogAction>
              <AlertDialogAction onClick={() => { setOpen(false); resolve(true); cleanup(); }}>
                확인
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    };

    root.render(React.createElement(ConfirmApp));
  });
}

export default confirm;

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<{
  show: (kind: ToastKind, message: string) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "toast-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
              toast.kind === "success" &&
                "border-pine-700/20 bg-pine-900 text-white",
              toast.kind === "error" && "border-ember-500/30 bg-white text-ink",
              toast.kind === "info" && "border-slate-line bg-white text-ink",
            )}
          >
            {toast.kind === "success" && (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-court-100" />
            )}
            {toast.kind === "error" && (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" />
            )}
            {toast.kind === "info" && (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-pine-700" />
            )}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="text-current/60 transition hover:text-current"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
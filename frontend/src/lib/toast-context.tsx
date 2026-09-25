"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  notify: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++counter;
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const colors: Record<ToastType, string> = {
    success: "border-l-4 border-[#037f0c] bg-white",
    error: "border-l-4 border-[#d13212] bg-white",
    info: "border-l-4 border-awsBlue bg-white",
    warning: "border-l-4 border-[#a86200] bg-white",
  };

  const icons: Record<ToastType, string> = {
    success: "✅",
    error: "⛔",
    info: "ℹ️",
    warning: "⚠️",
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-96 max-w-[90vw]">
        {toasts.map((t) => (
          <div key={t.id} className={`shadow-lg rounded-[3px] p-3 flex items-start gap-2 ${colors[t.type]}`}>
            <span>{icons[t.type]}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-awsText">{t.title}</p>
              {t.message && <p className="text-xs text-awsGray mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-awsGray hover:text-awsText text-xs">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (input: {
    title: string;
    description?: string;
    variant?: ToastVariant;
  }) => void;
  showToast: (
    variant: ToastVariant,
    title: string,
    description?: string,
  ) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      variant = 'info',
    }: {
      title: string;
      description?: string;
      variant?: ToastVariant;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast],
  );

  const showToast = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      toast({ variant, title, description });
    },
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 9999,
          width: '100%',
          maxWidth: '24rem',
          pointerEvents: 'none',
        }}
        className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => {
          const borderMap: Record<ToastVariant, string> = {
            success: 'border-emerald-500/60 bg-[#171717]',
            error: 'border-red-500/60 bg-[#171717]',
            warning: 'border-amber-500/60 bg-[#171717]',
            info: 'border-[#C7F464]/60 bg-[#171717]',
          };
          const iconMap: Record<ToastVariant, React.ReactNode> = {
            success: (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ),
            error: <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />,
            warning: (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ),
            info: <Info className="w-5 h-5 text-[#C7F464] shrink-0 mt-0.5" />,
          };

          return (
            <div
              key={item.id}
              style={{ pointerEvents: 'auto' }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl transition-all ${borderMap[item.variant]}`}
            >
              {iconMap[item.variant]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="text-[#A1A1AA] hover:text-white p-1 rounded-lg transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000);
  }, [dismiss]);

  const success = useCallback((msg) => push(msg, 'success'), [push]);
  const error = useCallback((msg) => push(msg, 'error'), [push]);

  return (
    <ToastContext.Provider value={{ success, error, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[min(100vw-2rem,360px)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg border animate-slide-up ${
              t.type === 'success'
                ? 'bg-emerald-600/95 text-white border-emerald-500'
                : t.type === 'error'
                  ? 'bg-red-600/95 text-white border-red-500'
                  : 'bg-slate-800 text-white border-slate-600'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

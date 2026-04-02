import { useEffect } from 'react';

export default function Toast({ toast, clearToast }) {
  useEffect(() => {
    if (!toast.message) return;
    const timer = setTimeout(clearToast, 2400);
    return () => clearTimeout(timer);
  }, [toast.message, clearToast]);

  if (!toast.message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div
        className={`rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
}

// components/ui/Toast.jsx
import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const toastConfig = {
  success: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-300', iconColor: 'text-green-500' },
  error: { icon: XCircle, bg: 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-300', iconColor: 'text-red-500' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-300', iconColor: 'text-yellow-500' },
  info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-300', iconColor: 'text-blue-500' },
};

// Single toast item
export function ToastItem({ id, type = 'success', message, onClose, duration = 3500 }) {
  const config = toastConfig[type] ?? toastConfig.success;
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg
        min-w-72 max-w-sm w-full pointer-events-auto
        animate-in slide-in-from-right-4 fade-in duration-300
        ${config.bg}
      `}
    >
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.iconColor}`} />
      <p className={`flex-1 text-sm font-medium ${config.text}`}>{message}</p>
      <button
        onClick={() => onClose(id)}
        className={`shrink-0 ${config.text} opacity-60 hover:opacity-100 transition-opacity`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Toast container (rendered at top-right corner)
export function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}

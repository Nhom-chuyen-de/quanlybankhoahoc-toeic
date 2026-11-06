// hooks/useToast.js
import { useState, useCallback, useMemo } from 'react';

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Hỗ trợ cả gọi trực tiếp: toast('msg'), toast.showToast('msg'), hoặc destructure: { showToast } = useToastContext()
  const toast = useMemo(() => Object.assign(
    (message, type = 'success') => addToast(message, type),
    {
      showToast: (message, type = 'success') => addToast(message, type),
      addToast,
      success: (msg) => addToast(msg, 'success'),
      error: (msg) => addToast(msg, 'error'),
      warning: (msg) => addToast(msg, 'warning'),
      info: (msg) => addToast(msg, 'info'),
      wip: () => addToast('Chức năng sẽ cập nhật sau', 'info'),
    }
  ), [addToast]);

  return { toasts, toast, removeToast, addToast };
}

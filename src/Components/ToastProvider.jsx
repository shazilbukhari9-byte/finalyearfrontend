import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertToast } from './ui/alert-toast';
import { ToastContext } from '../lib/useToast';

const DURATION_MS = { success: 4000, info: 4000, warning: 5500, error: 6500 };
const MAX_VISIBLE = 4;

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (variant, title, description = '') => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { id, variant, title, description }]);
      timers.current.set(id, setTimeout(() => dismiss(id), DURATION_MS[variant]));
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo(
    () => ({
      success: (title, description) => show('success', title, description),
      error: (title, description) => show('error', title, description),
      warning: (title, description) => show('warning', title, description),
      info: (title, description) => show('info', title, description),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-3 px-4"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <AlertToast
              key={toast.id}
              variant={toast.variant}
              title={toast.title}
              description={toast.description}
              onClose={() => dismiss(toast.id)}
              className="pointer-events-auto"
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;

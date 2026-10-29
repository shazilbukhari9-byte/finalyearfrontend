import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

/** toast.success / error / warning / info (title, description?) and toast.dismiss(id) */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

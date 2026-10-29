import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertToastVariants = cva(
  'relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl p-4 shadow-lg',
  {
    variants: {
      variant: {
        success: '',
        warning: '',
        info: '',
        error: '',
      },
      styleVariant: {
        // Card look: readable text in both themes, colour carried by the border and icon.
        default: 'border bg-card text-foreground',
        filled: '',
      },
    },
    compoundVariants: [
      { variant: 'success', styleVariant: 'default', className: 'border-success/40' },
      { variant: 'warning', styleVariant: 'default', className: 'border-warning/60' },
      { variant: 'info', styleVariant: 'default', className: 'border-info/40' },
      { variant: 'error', styleVariant: 'default', className: 'border-destructive/40' },
      { variant: 'success', styleVariant: 'filled', className: 'bg-success text-success-foreground' },
      { variant: 'warning', styleVariant: 'filled', className: 'bg-warning text-warning-foreground' },
      { variant: 'info', styleVariant: 'filled', className: 'bg-info text-info-foreground' },
      { variant: 'error', styleVariant: 'filled', className: 'bg-destructive text-white' },
    ],
    defaultVariants: {
      variant: 'info',
      styleVariant: 'default',
    },
  },
);

const iconMap = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  error: XOctagon,
};

const iconColorClasses = {
  default: {
    success: 'text-success',
    warning: 'text-yellow-600 dark:text-warning',
    info: 'text-info',
    error: 'text-destructive',
  },
  filled: {
    success: 'text-success-foreground',
    warning: 'text-warning-foreground',
    info: 'text-info-foreground',
    error: 'text-white',
  },
};

const AlertToast = forwardRef(function AlertToast(
  { className, variant = 'info', styleVariant = 'default', title, description, onClose, ...props },
  ref,
) {
  const Icon = iconMap[variant];

  return (
    <motion.div
      ref={ref}
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      layout
      initial={{ opacity: 0, y: -24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={cn(alertToastVariants({ variant, styleVariant }), className)}
      {...props}
    >
      <div className="mt-0.5 shrink-0">
        <Icon className={cn('h-5 w-5', iconColorClasses[styleVariant][variant])} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5">{title}</p>
        {description && <p className="mt-0.5 text-sm leading-5 opacity-90">{description}</p>}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className={cn(
          'shrink-0 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          styleVariant === 'default' ? 'hover:bg-muted' : 'hover:bg-black/20',
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
});

export { AlertToast, alertToastVariants };

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
} from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className,
  onClose,
}) => {
  const variantStyles = {
    info: {
      container: 'bg-sky-50 border-sky-200 text-sky-800',
      icon: <Info className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />,
      titleColor: 'text-sky-900',
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: (
        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      ),
      titleColor: 'text-emerald-900',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: (
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      ),
      titleColor: 'text-amber-900',
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: (
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      ),
      titleColor: 'text-red-900',
    },
  };

  const current = variantStyles[variant];

  return (
    <div
      role="alert"
      className={twMerge(
        clsx(
          'flex items-start gap-3 p-4 border rounded-xl shadow-sm text-sm',
          current.container,
          className
        )
      )}
    >
      {current.icon}
      <div className="flex-1">
        {title && (
          <h4
            className={clsx('font-semibold text-sm mb-1', current.titleColor)}
          >
            {title}
          </h4>
        )}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-md transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

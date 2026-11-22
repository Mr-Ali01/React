import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={twMerge(
        clsx('flex flex-col items-center justify-center gap-2 p-4', className)
      )}
    >
      <div
        className={clsx(
          'animate-spin rounded-full border-sky-600 border-t-transparent',
          sizeClasses[size]
        )}
      />
      {text ? (
        <span className="text-xs font-medium text-slate-500 tracking-wide">
          {text}
        </span>
      ) : (
        <span className="sr-only">Loading...</span>
      )}
    </div>
  );
};

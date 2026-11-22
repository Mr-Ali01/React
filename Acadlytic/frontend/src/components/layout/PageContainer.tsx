import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageContainerProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '5xl' | '7xl' | 'full';
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
  children,
  maxWidth = '7xl',
  className,
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '5xl': 'max-w-5xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6',
          maxWidthClasses[maxWidth],
          className
        )
      )}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center space-x-2 text-xs text-slate-500"
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="hover:text-slate-900 transition-colors font-medium"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-semibold">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Page Header */}
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
};

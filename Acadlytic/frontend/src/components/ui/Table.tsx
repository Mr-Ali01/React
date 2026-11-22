import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-lg border border-slate-200">
    <table
      ref={ref}
      className={twMerge(
        clsx('w-full caption-bottom text-sm text-left', className)
      )}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={twMerge(
      clsx(
        'bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600',
        className
      )
    )}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={twMerge(clsx('divide-y divide-slate-100 bg-white', className))}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={twMerge(
      clsx('border-t border-slate-200 bg-slate-50/50 font-medium', className)
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={twMerge(
      clsx(
        'transition-colors hover:bg-slate-50/75 data-[state=selected]:bg-slate-100',
        className
      )
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={twMerge(
      clsx(
        'h-10 px-4 text-left align-middle font-medium text-slate-700 tracking-wider',
        className
      )
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={twMerge(clsx('p-4 align-middle text-slate-800', className))}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={twMerge(clsx('mt-4 text-xs text-slate-500', className))}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export const TableEmpty: React.FC<{ message?: string; colSpan: number }> = ({
  message = 'No data available',
  colSpan,
}) => (
  <tr>
    <td
      colSpan={colSpan}
      className="p-8 text-center text-sm text-slate-500 bg-white"
    >
      {message}
    </td>
  </tr>
);

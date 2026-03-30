'use client';

import { HTMLAttributes, forwardRef, TdHTMLAttributes, ThHTMLAttributes, memo } from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  striped?: boolean;
}

const Table = memo(forwardRef<HTMLTableElement, TableProps>(
  ({ className, striped = true, children, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto">
        <table
          ref={ref}
          className={cn('w-full', striped && 'table-stripe', className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
));

Table.displayName = 'Table';

export default Table;

export const TableHeader = memo(function TableHeader({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-slate-900 text-white', className)} {...props}>
      {children}
    </thead>
  );
});

export const TableBody = memo(function TableBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-slate-100', className)} {...props}>
      {children}
    </tbody>
  );
});

export const TableRow = memo(function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('hover:bg-slate-50 transition-colors duration-150', className)} {...props}>
      {children}
    </tr>
  );
});

export const TableHead = memo(function TableHead({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', className)}
      {...props}
    >
      {children}
    </th>
  );
});

export const TableCell = memo(function TableCell({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3.5 text-sm text-slate-700', className)} {...props}>
      {children}
    </td>
  );
});

'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  ({ className, title, value, icon, variant = 'default', ...props }, ref) => {
    const borderColors = {
      default: 'border-l-slate-400',
      primary: 'border-l-blue-500',
      success: 'border-l-green-500',
      warning: 'border-l-amber-500',
      danger: 'border-l-red-500',
    };

    const iconBgColors = {
      default: 'bg-slate-100 text-slate-600',
      primary: 'bg-blue-100 text-blue-600',
      success: 'bg-green-100 text-green-600',
      warning: 'bg-amber-100 text-amber-600',
      danger: 'bg-red-100 text-red-600',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-xl p-5 border-l-4 shadow-sm transition-all duration-250 ease-out hover:shadow-md',
          borderColors[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          {icon && (
            <div className={cn('p-3 rounded-xl', iconBgColors[variant])}>
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

StatsCard.displayName = 'StatsCard';

export default StatsCard;

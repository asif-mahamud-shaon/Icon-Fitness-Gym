'use client';

import React from 'react';
import {
  Loader2,
  AlertCircle,
  Inbox,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// 1. BUTTON
// ============================================================================
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:
        'ifg-btn-primary bg-[#C7F464] !text-[#090909] font-bold hover:bg-[#d5fb76] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-[0_4px_16px_rgba(199,244,100,0.28)] hover:shadow-[0_10px_28px_rgba(199,244,100,0.52)]',
      secondary:
        'bg-[#242424] text-white border border-[#303030] hover:bg-[#C7F464]/15 hover:border-[#C7F464] hover:text-[#C7F464] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
      outline:
        'bg-transparent text-white border border-[#303030] hover:bg-[#C7F464]/15 hover:border-[#C7F464] hover:text-[#C7F464] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
      ghost:
        'bg-transparent text-[#A1A1AA] hover:text-[#C7F464] hover:bg-[#C7F464]/15 active:scale-[0.98]',
      danger:
        'bg-red-500/15 text-red-400 border border-red-500/40 hover:bg-red-500/25 hover:-translate-y-0.5 active:scale-[0.98]',
    };

    const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'h-9 px-3.5 text-xs rounded-md gap-1.5',
      md: 'h-11 px-5 text-sm rounded-lg gap-2',
      lg: 'h-13 px-7 py-3.5 text-base rounded-lg gap-2.5 uppercase tracking-wider',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'group/btn inline-flex items-center justify-center transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F464] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090909] disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && (
            <span className="inline-flex items-center shrink-0 transition-transform duration-300 ease-out group-hover/btn:scale-110">
              {leftIcon}
            </span>
          )
        )}
        <span className="relative z-10">{children}</span>
        {!isLoading && rightIcon && (
          <span className="relative z-10 inline-flex items-center shrink-0 transition-transform duration-300 ease-out group-hover/btn:translate-x-1">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';

// ============================================================================
// 2. INPUT, TEXTAREA, SELECT
// ============================================================================
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full h-11 px-3.5 rounded-lg bg-[#171717] border border-[#303030] text-base sm:text-sm text-white placeholder:text-[#A1A1AA]/60 focus:outline-none focus:border-[#C7F464] transition-colors',
            error && 'border-red-500 focus:border-red-500',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[#A1A1AA]">{helperText}</p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id || props.name;
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={props.rows || 4}
          className={cn(
            'w-full p-3.5 rounded-lg bg-[#171717] border border-[#303030] text-base sm:text-sm text-white placeholder:text-[#A1A1AA]/60 focus:outline-none focus:border-[#C7F464] transition-colors',
            error && 'border-red-500 focus:border-red-500',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full h-11 px-3.5 rounded-lg bg-[#171717] border border-[#303030] text-base sm:text-sm text-white focus:outline-none focus:border-[#C7F464] transition-colors',
            error && 'border-red-500 focus:border-red-500',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#171717]">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';

// ============================================================================
// 3. CARD & BENTO CARD
// ============================================================================
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-[#141414] border border-[#2C2C2C] rounded-2xl p-4 sm:p-6 transition-colors',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// 4. STATUS BADGE
// ============================================================================
export function StatusBadge({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  const normalized = (status || 'UNKNOWN').toUpperCase();

  let colorClass = 'bg-zinc-800 text-zinc-300 border-zinc-700';
  if (
    [
      'ACTIVE',
      'VERIFIED_PAID',
      'CONFIRMED',
      'PRESENT',
      'APPROVED',
      'PUBLISHED',
      'RESOLVED',
      'COMPLETED',
    ].includes(normalized)
  ) {
    colorClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  } else if (
    ['PENDING', 'PENDING_APPROVAL', 'IN_PROGRESS', 'NEW', 'LATE', 'WAITLISTED'].includes(
      normalized,
    )
  ) {
    colorClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  } else if (
    [
      'EXPIRED',
      'CANCELLED',
      'SUSPENDED',
      'DEACTIVATED',
      'FAILED',
      'ABSENT',
      'NO_SHOW',
    ].includes(normalized)
  ) {
    colorClass = 'bg-red-500/15 text-red-400 border-red-500/30';
  } else if (['SUPER_ADMIN', 'ADMIN', 'FEATURED', 'REFUNDED'].includes(normalized)) {
    colorClass = 'bg-[#C7F464]/15 text-[#C7F464] border-[#C7F464]/30';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border',
        colorClass,
        className,
      )}
    >
      {normalized.replace(/_/g, ' ')}
    </span>
  );
}

// ============================================================================
// 5. STAT CARD (KPI)
// ============================================================================
export function StatCard({
  label,
  value,
  subValue,
  sublabel,
  icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  sublabel?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  const displaySub = subValue || sublabel;
  return (
    <Card
      className={cn(
        'flex flex-col justify-between gap-3',
        accent && 'border-[#C7F464]/60 bg-[#1B2210]',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">
          {label}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-[#171717] border border-[#2C2C2C] flex items-center justify-center text-[#C7F464]">
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums">
          {value}
        </div>
        {displaySub && (
          <p className="text-xs text-[#A1A1AA] mt-1">{displaySub}</p>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// 6. MODAL / DIALOG
// ============================================================================
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  size,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!isOpen) return null;

  const sizeMap: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };
  const resolvedMaxWidth = size ? sizeMap[size] || maxWidth : maxWidth;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 md:backdrop-blur-xs overflow-y-auto"
    >
      <div
        className={cn(
          'relative w-full bg-[#171717] border border-[#303030] rounded-t-2xl sm:rounded-xl shadow-2xl p-4 sm:p-6 max-h-[92dvh] overflow-y-auto sm:my-8 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6',
          resolvedMaxWidth,
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#303030]">
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#A1A1AA] mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#242424]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. LOADING SKELETON, EMPTY STATE & ERROR STATE
// ============================================================================
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-[#242424] border border-[#303030]/50',
        className,
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-[#171717]/70 border border-dashed border-[#303030] rounded-xl">
      <div className="w-12 h-12 rounded-full bg-[#242424] border border-[#303030] flex items-center justify-center text-[#C7F464] mb-4">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h4 className="text-base font-semibold text-white">{title}</h4>
      <p className="text-sm text-[#A1A1AA] max-w-md mt-1.5">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Unable to load data',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6 bg-red-950/20 border border-red-500/30 rounded-xl">
      <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
      <h4 className="text-base font-semibold text-white">{title}</h4>
      <p className="text-sm text-red-200/80 max-w-md mt-1">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4"
        >
          Retry Request
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// 8. SEARCH BAR & PAGINATION
// ============================================================================
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative w-full sm:w-72', className)}>
      <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#171717] border border-[#303030] text-sm text-white placeholder:text-[#A1A1AA]/60 focus:outline-none focus:border-[#C7F464]"
      />
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-[#303030] text-xs text-[#A1A1AA]">
      <span>
        Page <strong className="text-white font-mono">{page}</strong> of{' '}
        <strong className="text-white font-mono">{totalPages}</strong>
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          Prev
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

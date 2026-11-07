import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'inverse';
type Size = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-[background-color,box-shadow,color] duration-150 disabled:cursor-not-allowed disabled:opacity-55';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-700 text-white shadow-[0_10px_24px_-14px_rgba(15,118,110,0.9)] hover:bg-brand-800 active:bg-brand-900',
  secondary:
    'bg-surface text-heading ring-1 ring-[color:var(--color-line)] hover:bg-surface-muted active:bg-surface-muted',
  ghost: 'text-body hover:bg-surface-muted hover:text-heading',
  danger:
    'bg-surface text-risk ring-1 ring-[color:color-mix(in_srgb,var(--color-risk)_38%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--color-risk)_10%,transparent)]',
  subtle: 'bg-brand-50 text-brand-800 hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-100 dark:hover:bg-brand-900/60',
  inverse: 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-[44px] px-3 text-sm',
  md: 'min-h-[44px] px-4 text-sm',
  lg: 'min-h-[48px] px-6 text-base',
};

export function buttonStyles(options: { variant?: Variant; size?: Size; className?: string } = {}): string {
  const { variant = 'primary', size = 'md', className } = options;
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonStyles({ variant, size, className: cn(fullWidth && 'w-full', className) })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin" /> : null}
      {children}
    </button>
  );
});

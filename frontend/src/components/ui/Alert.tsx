import { AlertCircle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'success' | 'error' | 'info' | 'warning';

const TONES: Record<Tone, { wrapper: string; icon: ReactNode }> = {
  success: {
    wrapper:
      'border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-50',
    icon: <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />,
  },
  error: {
    wrapper: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100',
    icon: <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />,
  },
  info: {
    wrapper: 'border-line bg-surface-muted text-body',
    icon: <Info aria-hidden="true" className="h-4 w-4 shrink-0 text-subtle" />,
  },
  warning: {
    wrapper:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
    icon: <ShieldAlert aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />,
  },
};

export function Alert({
  tone = 'info',
  children,
  className,
  role,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  role?: 'alert' | 'status';
}) {
  const config = TONES[tone];
  return (
    <div
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      className={cn('flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm', config.wrapper, className)}
    >
      {config.icon}
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
    </div>
  );
}

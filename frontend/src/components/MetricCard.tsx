import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { formatSignedPercent } from '../lib/format';

export function DeltaBadge({ change, label }: { change: number | null; label?: string }) {
  if (change === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-subtle">
        <Minus aria-hidden="true" className="h-3 w-3" />
        {label ?? 'No prior period'}
      </span>
    );
  }

  const positive = change > 0;
  const flat = change === 0;
  const Icon = flat ? Minus : positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        flat
          ? 'bg-surface-muted text-subtle'
          : positive
            ? 'bg-brand-50 text-positive dark:bg-brand-900/40 dark:text-positive'
            : 'bg-[color:color-mix(in_srgb,var(--color-risk)_10%,transparent)] text-risk',
      )}
    >
      <Icon aria-hidden="true" className="h-3 w-3" />
      <span className="numeric">{formatSignedPercent(change)}</span>
      {label ? <span className="font-normal opacity-80">{label}</span> : null}
    </span>
  );
}

/**
 * Executive metric card. The value carries the weight; everything else is
 * supporting detail, so numbers stay scannable across a row of four.
 */
export function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
  hint,
  icon,
  footer,
  className,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-surface p-5 shadow-soft ring-1 ring-[color:var(--color-line)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="numeric mt-3 font-display text-[27px] leading-none tracking-tight text-heading">{value}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {delta === undefined ? null : <DeltaBadge change={delta} label={deltaLabel} />}
        {hint ? <span className="text-xs leading-snug text-subtle">{hint}</span> : null}
      </div>
      {footer ? <div className="mt-3 border-t border-line pt-3 text-xs text-subtle">{footer}</div> : null}
    </div>
  );
}

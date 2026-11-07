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
            ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100'
            : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
      )}
    >
      <Icon aria-hidden="true" className="h-3 w-3" />
      {formatSignedPercent(change)}
      {label ? <span className="font-normal opacity-80">{label}</span> : null}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
  hint,
  icon,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-subtle">{label}</p>
        {icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-brand-700 dark:text-brand-300">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-heading">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {delta === undefined ? null : <DeltaBadge change={delta} label={deltaLabel} />}
        {hint ? <span className="text-xs text-subtle">{hint}</span> : null}
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Base surface for the workspace. Uses a hairline ring rather than a heavy
 * border so stacked panels do not read as a grid of boxes.
 */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-surface shadow-soft ring-1 ring-[color:var(--color-line)]', className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="space-y-1">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="text-[17px] font-semibold leading-snug text-heading">{title}</h2>
        {description ? <p className="max-w-2xl text-sm leading-relaxed text-body">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

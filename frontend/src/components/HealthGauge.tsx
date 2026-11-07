import type { HealthScore } from '../lib/types';
import { cn } from '../lib/cn';

const ARC_LENGTH = Math.PI * 80;

export type HealthTone = 'positive' | 'attention' | 'risk';

export function healthTone(score: number): HealthTone {
  if (score >= 70) return 'positive';
  if (score >= 45) return 'attention';
  return 'risk';
}

export function healthColor(tone: HealthTone): string {
  if (tone === 'positive') return 'var(--color-positive)';
  if (tone === 'attention') return 'var(--color-attention)';
  return 'var(--color-risk)';
}

export function HealthGauge({ health }: { health: HealthScore }) {
  const clamped = Math.max(0, Math.min(100, health.score));
  const tone = healthTone(clamped);
  const color = healthColor(tone);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 118"
        role="img"
        aria-label={`Business health score ${health.score} out of 100, rated ${health.label}`}
        className="w-full max-w-[260px]"
      >
        <defs>
          <linearGradient id={`healthArc-${tone}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M20 110 A 80 80 0 0 1 180 110"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M20 110 A 80 80 0 0 1 180 110"
          fill="none"
          stroke={`url(#healthArc-${tone})`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * ARC_LENGTH} ${ARC_LENGTH}`}
        />
        <text
          x="100"
          y="86"
          textAnchor="middle"
          style={{ fontSize: 42, fontWeight: 600, fill: 'var(--color-heading)', fontFamily: 'Fraunces, Georgia, serif' }}
        >
          {health.score}
        </text>
        <text
          x="100"
          y="106"
          textAnchor="middle"
          style={{ fontSize: 10, letterSpacing: '0.12em', fill: 'var(--color-subtle)' }}
        >
          OUT OF 100
        </text>
      </svg>
      <span
        className="mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
        style={{ color, backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)' }}
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        {health.label}
      </span>
    </div>
  );
}

export function HealthFactorList({ health }: { health: HealthScore }) {
  return (
    <ul className="space-y-3">
      {health.factors.map((factor) => {
        const ratio = factor.max > 0 ? factor.score / factor.max : 0;
        const tone: HealthTone = ratio >= 0.75 ? 'positive' : ratio >= 0.45 ? 'attention' : 'risk';
        return (
          <li key={factor.label}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-medium text-heading">{factor.label}</span>
              <span className="numeric text-[11px] text-subtle">
                {factor.score}/{factor.max}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.max(0, Math.min(100, ratio * 100))}%`,
                  backgroundColor: healthColor(tone),
                }}
              />
            </div>
            <p className="mt-1 text-[11px] leading-snug text-subtle">{factor.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function HealthFactorSummary({ health, className }: { health: HealthScore; className?: string }) {
  const weakest = [...health.factors].sort((a, b) => a.score / a.max - b.score / b.max)[0];
  if (!weakest) return null;
  return (
    <p className={cn('text-sm leading-relaxed text-body', className)}>
      Biggest drag: <span className="font-medium text-heading">{weakest.label.toLowerCase()}</span> —{' '}
      {weakest.detail.toLowerCase()}.
    </p>
  );
}

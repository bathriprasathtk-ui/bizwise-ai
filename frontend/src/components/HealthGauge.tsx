import type { HealthScore } from '../lib/types';

const ARC_LENGTH = Math.PI * 80;

function scoreColor(score: number): string {
  if (score >= 80) return '#0F766E';
  if (score >= 60) return '#0D9488';
  if (score >= 40) return '#D97706';
  return '#DC2626';
}

export function HealthGauge({ health }: { health: HealthScore }) {
  const clamped = Math.max(0, Math.min(100, health.score));
  const color = scoreColor(clamped);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        role="img"
        aria-label={`Business health score ${health.score} out of 100, rated ${health.label}`}
        className="w-full max-w-[240px]"
      >
        <path
          d="M20 110 A 80 80 0 0 1 180 110"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M20 110 A 80 80 0 0 1 180 110"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * ARC_LENGTH} ${ARC_LENGTH}`}
        />
        <text
          x="100"
          y="88"
          textAnchor="middle"
          style={{ fontSize: 34, fontWeight: 600, fill: 'var(--color-heading)' }}
        >
          {health.score}
        </text>
        <text x="100" y="108" textAnchor="middle" style={{ fontSize: 11, fill: 'var(--color-subtle)' }}>
          out of 100
        </text>
      </svg>
      <span
        className="mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
        style={{ color, backgroundColor: `${color}1a` }}
      >
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
        return (
          <li key={factor.label}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-heading">{factor.label}</span>
              <span className="text-subtle">
                {factor.score}/{factor.max}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] leading-snug text-subtle">{factor.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}

import { Sparkles, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

const SERIES = [
  { label: 'Jan', revenue: 31200 },
  { label: 'Feb', revenue: 33800 },
  { label: 'Mar', revenue: 37100 },
  { label: 'Apr', revenue: 40400 },
  { label: 'May', revenue: 44600 },
  { label: 'Jun', revenue: 48200 },
];

/**
 * Illustrative dashboard shown on the marketing page. It is explicitly labelled as
 * sample data and never reads or implies the visitor's own numbers.
 */
export function DashboardPreview() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-lift sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-sm font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-100">
            AC
          </span>
          <div>
            <p className="text-sm font-semibold text-heading">Acme Coffee Co.</p>
            <p className="text-xs text-subtle">Sample data · illustrative preview</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-100">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden="true" />
          Healthy · 82/100
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border border-line bg-surface-muted/60 p-3">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-subtle">Revenue</dt>
          <dd className="mt-1 text-sm font-semibold text-heading sm:text-base">$48,200</dd>
        </div>
        <div className="rounded-xl border border-line bg-surface-muted/60 p-3">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-subtle">Expenses</dt>
          <dd className="mt-1 text-sm font-semibold text-heading sm:text-base">$31,500</dd>
        </div>
        <div className="rounded-xl border border-line bg-surface-muted/60 p-3">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-subtle">Profit</dt>
          <dd className="mt-1 text-sm font-semibold text-brand-800 dark:text-brand-200 sm:text-base">$16,700</dd>
        </div>
      </dl>

      <div className="mt-4 rounded-xl border border-line p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-heading">Revenue trend</p>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-300">
            <TrendingUp aria-hidden="true" className="h-3.5 w-3.5" />
            Last 6 periods
          </span>
        </div>
        <div className="mt-2 h-[132px] w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SERIES} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="previewRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-series-primary)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-series-primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-series-primary)"
                strokeWidth={2}
                fill="url(#previewRevenue)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="sr-only">
          Illustrative revenue growth from $31,200 in January to $48,200 in June.
        </p>
      </div>

      <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/70 p-3 dark:border-brand-800 dark:bg-brand-900/30">
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-brand-700 dark:text-brand-300" />
          <p className="text-xs font-semibold text-brand-900 dark:text-brand-100">AI insight</p>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-brand-900/90 dark:text-brand-50/90">
          Gross margin is healthy at 34.6%, but operating expenses absorb 26% of revenue. Cutting delivery costs by
          8% would add roughly $2,400 to monthly profit.
        </p>
      </div>
    </div>
  );
}

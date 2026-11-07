import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Gauge,
  Lightbulb,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RevenueProfitChart, Sparkline } from '../../components/charts/FinanceCharts';
import { HealthFactorList, HealthGauge } from '../../components/HealthGauge';
import { MetricCard, DeltaBadge } from '../../components/MetricCard';
import { Alert } from '../../components/ui/Alert';
import { Button, buttonStyles } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { LoadingState, Skeleton } from '../../components/ui/StateViews';
import { api, ApiError } from '../../lib/api';
import { buildChartSeries } from '../../lib/finance';
import { formatCurrency, formatPercent, formatSignedPercent } from '../../lib/format';
import {
  buildGrowthSignals,
  buildRiskSignals,
  greetingFor,
  healthSummary,
  nextBestAction,
} from '../../lib/insights';
import type { BusinessResponse, Insight } from '../../lib/types';
import { cn } from '../../lib/cn';

const INSIGHT_TONES: Record<Insight['tone'], string> = {
  positive: 'bg-brand-50/70 dark:bg-brand-900/25',
  watch: 'bg-[color:color-mix(in_srgb,var(--color-attention)_10%,transparent)]',
  neutral: 'bg-surface-muted/70',
};

export function DashboardPage() {
  const [data, setData] = useState<BusinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [insightStatus, setInsightStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [insightError, setInsightError] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getBusiness());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'We could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function generateInsights() {
    setInsightStatus('loading');
    setInsightError(null);
    try {
      const response = await api.generateInsights();
      setInsights(response.insights);
      setInsightStatus('idle');
    } catch (insightFailure) {
      const notConfigured = insightFailure instanceof ApiError && insightFailure.code === 'AI_NOT_CONFIGURED';
      setAiConfigured(!notConfigured);
      setInsightStatus('error');
      setInsightError(
        insightFailure instanceof Error ? insightFailure.message : 'We could not generate insights right now.',
      );
    }
  }

  const business = data?.business;
  const summary = data?.summary ?? null;
  const entries = data?.entries ?? [];
  const currency = business?.currency ?? 'USD';
  const chartData = useMemo(() => buildChartSeries(entries.slice(-12)), [entries]);

  const growthSignals = useMemo(
    () => (summary ? buildGrowthSignals(summary, entries, currency) : []),
    [summary, entries, currency],
  );
  const riskSignals = useMemo(() => (summary ? buildRiskSignals(summary, currency) : []), [summary, currency]);
  const action = useMemo(() => (summary ? nextBestAction(summary, currency) : null), [summary, currency]);
  // Runway in months only means something while the business burns cash.
  const runwayLabel =
    summary && summary.netProfit >= 0
      ? 'Positive'
      : summary && summary.cashRunwayMonths !== null
        ? `${summary.cashRunwayMonths} mo`
        : '—';
  const cashCoverage =
    summary && summary.totalExpenses > 0 ? summary.cashOnHand / summary.totalExpenses : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Command center</p>
          <h1 className="mt-1.5 text-[26px] leading-tight sm:text-[30px]">
            {greetingFor()}, {business?.name ?? 'founder'}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-body">
            {summary
              ? 'Here is what needs your attention today.'
              : 'Add one period of numbers and this workspace becomes your financial command center.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {summary ? (
            <span className="hidden rounded-full bg-surface px-3 py-1.5 text-xs text-subtle ring-1 ring-[color:var(--color-line)] sm:inline-flex">
              Latest period · <span className="ml-1 font-medium text-heading">{summary.periodLabel}</span>
              <span className="mx-1.5 text-line">|</span>
              {currency}
            </span>
          ) : null}
          <Link to="/app/business" className={buttonStyles({ variant: 'primary' })}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Update numbers
          </Link>
        </div>
      </header>

      {error ? (
        <Alert tone="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-[280px] rounded-2xl lg:col-span-2" />
            <Skeleton className="h-[280px] rounded-2xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-[136px] rounded-2xl" />
            ))}
          </div>
        </div>
      ) : null}

      {!loading && !error && entries.length === 0 ? (
        <Card className="overflow-hidden">
          <div className="relative px-6 py-10 sm:px-10 sm:py-12">
            <div aria-hidden="true" className="subtle-grid absolute inset-0" />
            <div className="relative max-w-2xl">
              <p className="eyebrow">Start here</p>
              <h2 className="mt-2 text-[22px] leading-snug sm:text-[26px]">
                Your command center is waiting for its first period.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                Record one period — revenue, direct costs, operating expenses and cash on hand. BizWise turns it into a
                health score, runway, margin analysis and a clear next move.
              </p>
              <ol className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { step: '01', title: 'Record a period', detail: 'One worksheet, four numbers.' },
                  { step: '02', title: 'Read the health score', detail: 'See what is strong and what drags.' },
                  { step: '03', title: 'Act on one lever', detail: 'Simulate it before you commit.' },
                ].map((item) => (
                  <li key={item.step} className="rounded-xl bg-surface/80 p-4 ring-1 ring-[color:var(--color-line)]">
                    <span className="numeric text-[11px] font-semibold tracking-eyebrow text-brand-700 dark:text-brand-300">
                      {item.step}
                    </span>
                    <p className="mt-1 text-sm font-semibold text-heading">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-subtle">{item.detail}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/app/business" className={buttonStyles()}>
                  Add financial data
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link to="/app/advisor" className={buttonStyles({ variant: 'secondary' })}>
                  Meet the copilot
                </Link>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {!loading && !error && summary && action ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="overflow-hidden lg:col-span-2">
              <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:p-6">
                <div className="flex flex-col items-center sm:border-r sm:border-line sm:pr-6">
                  <p className="eyebrow self-start">Business health</p>
                  <HealthGauge health={summary.health} />
                  <p className="mt-2 max-w-[220px] text-center text-xs leading-relaxed text-subtle">
                    {healthSummary(summary.health.score)}
                  </p>
                  <dl className="mt-4 w-full space-y-2 rounded-xl bg-surface-muted/60 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-[11px] text-subtle">Revenue vs prior</dt>
                      <dd className="numeric text-[12px] font-medium text-heading">
                        {summary.revenueChange === null ? 'Baseline' : formatSignedPercent(summary.revenueChange)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-[11px] text-subtle">Cash covers</dt>
                      <dd className="numeric text-[12px] font-medium text-heading">
                        {cashCoverage === null ? '—' : `${cashCoverage.toFixed(1)}× costs`}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-[17px] font-semibold text-heading">What is shaping the score</h2>
                    <span className="text-xs text-subtle">Weighted from {summary.periodLabel}</span>
                  </div>
                  <div className="mt-4">
                    <HealthFactorList health={summary.health} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-line bg-surface-muted/50 px-5 py-4 sm:px-6">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  <Compass aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-subtle">
                    Recommended next action
                  </p>
                  <p className="mt-0.5 text-sm text-heading">{action.title}</p>
                </div>
                <Link to={action.to} className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                  {action.cta}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </Card>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 p-6 text-white shadow-panel">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/20 blur-2xl"
              />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-white/50">Next best action</p>
                  <Target aria-hidden="true" className="h-4 w-4 text-brand-300" />
                </div>
                <h3 className="mt-3 font-display text-[21px] leading-snug text-white">{action.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{action.detail}</p>
                <dl className="mt-4 space-y-2 rounded-xl bg-white/[0.06] p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-[11px] text-white/45">Cash on hand</dt>
                    <dd className="numeric text-[12px] font-medium text-white">
                      {formatCurrency(summary.cashOnHand, currency)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-[11px] text-white/45">Period profit</dt>
                    <dd className="numeric text-[12px] font-medium text-white">
                      {formatCurrency(summary.netProfit, currency)}
                    </dd>
                  </div>
                </dl>
                <Link
                  to={action.to}
                  className="mt-auto inline-flex min-h-[44px] pt-0 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-medium text-white ring-1 ring-white/15 transition-colors hover:bg-white/15"
                >
                  {action.cta}
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <p className="mt-3 text-[11px] leading-relaxed text-white/40">
                  Calculated from your saved entries — not generated text.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Revenue"
              value={formatCurrency(summary.revenue, currency)}
              delta={summary.revenueChange}
              deltaLabel={summary.previousPeriodLabel ? `vs ${summary.previousPeriodLabel}` : undefined}
              icon={<TrendingUp aria-hidden="true" className="h-4 w-4" />}
              footer={<Sparkline data={chartData} dataKey="revenue" />}
            />
            <MetricCard
              label="Net profit"
              value={formatCurrency(summary.netProfit, currency)}
              delta={summary.profitChange}
              deltaLabel={summary.previousPeriodLabel ? `vs ${summary.previousPeriodLabel}` : undefined}
              hint={`${formatPercent(summary.netMargin)} net margin`}
              icon={<Sparkles aria-hidden="true" className="h-4 w-4" />}
              footer={<Sparkline data={chartData} dataKey="netProfit" tone="secondary" />}
            />
            <MetricCard
              label="Cash position"
              value={formatCurrency(summary.cashOnHand, currency)}
              hint={
                cashCoverage === null
                  ? 'No expenses recorded'
                  : `${cashCoverage.toFixed(1)}× one period of expenses`
              }
              icon={<Wallet aria-hidden="true" className="h-4 w-4" />}
              footer={<Sparkline data={chartData} dataKey="expenses" tone="primary" />}
            />
            <MetricCard
              label="Cash runway"
              value={runwayLabel}
              hint={
                summary.netProfit >= 0
                  ? 'No cash burn this period'
                  : cashCoverage === null
                    ? 'At the current cost base'
                    : `Cash covers ${cashCoverage.toFixed(1)}× one period of costs`
              }
              icon={<Gauge aria-hidden="true" className="h-4 w-4" />}
              footer={
                summary.netProfit >= 0 ? (
                  <span>
                    Cash covers{' '}
                    <span className="font-medium text-heading">
                      {cashCoverage === null ? '—' : `${cashCoverage.toFixed(1)}×`}
                    </span>{' '}
                    one period of costs
                  </span>
                ) : (
                  <span>
                    Burn per period{' '}
                    <span className="font-medium text-heading">
                      {formatCurrency(summary.totalExpenses - summary.revenue, currency)}
                    </span>
                  </span>
                )
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <CardHeader
                eyebrow="Trend"
                title="Revenue against net profit"
                description={
                  summary.previousPeriodLabel
                    ? `Compared with ${summary.previousPeriodLabel}: revenue ${formatSignedPercent(
                        summary.revenueChange ?? 0,
                      )}, profit ${formatSignedPercent(summary.profitChange ?? 0)}.`
                    : 'Your first period sets the baseline. Add a second to compare.'
                }
                action={
                  <Link to="/app/reports" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                    Full reports
                  </Link>
                }
              />
              <div className="mt-4">
                <RevenueProfitChart data={chartData} currency={currency} />
              </div>
            </Card>

            <Card className="p-5">
              <CardHeader eyebrow="This period" title="Financial performance" />
              <dl className="mt-4 space-y-3">
                {[
                  { label: 'Gross profit', value: formatCurrency(summary.grossProfit, currency) },
                  { label: 'Gross margin', value: formatPercent(summary.grossMargin) },
                  { label: 'Net margin', value: formatPercent(summary.netMargin) },
                  { label: 'Expense ratio', value: formatPercent(summary.expenseRatio) },
                  { label: 'Direct costs', value: formatCurrency(summary.cogs, currency) },
                  { label: 'Operating expenses', value: formatCurrency(summary.operatingExpenses, currency) },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-3 border-b border-line pb-2.5 last:border-0 last:pb-0"
                  >
                    <dt className="text-[13px] text-body">{row.label}</dt>
                    <dd className="numeric text-[13px] font-medium text-heading">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-surface-muted/70 px-3 py-2.5">
                <span className="text-xs text-body">Revenue change</span>
                <DeltaBadge change={summary.revenueChange} />
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <CardHeader
                eyebrow="Growth opportunities"
                title="Where the business can move up"
                description="Arithmetic on your own numbers, ranked by impact."
                action={
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                    <Lightbulb aria-hidden="true" className="h-4 w-4" />
                  </span>
                }
              />
              <ul className="mt-4 space-y-3">
                {growthSignals.map((signal) => (
                  <li key={signal.title} className={cn('rounded-xl p-4', INSIGHT_TONES[signal.tone])}>
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0',
                          signal.tone === 'positive' ? 'text-positive' : 'text-attention',
                        )}
                      />
                      <div>
                        <p className="text-sm font-semibold text-heading">{signal.title}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-body">{signal.detail}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <CardHeader
                eyebrow="Risks to watch"
                title="What could cost you next period"
                description="Signals worth a decision, not just a notification."
                action={
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:color-mix(in_srgb,var(--color-attention)_14%,transparent)] text-attention">
                    <ShieldAlert aria-hidden="true" className="h-4 w-4" />
                  </span>
                }
              />
              <ul className="mt-4 space-y-3">
                {riskSignals.map((signal) => (
                  <li key={signal.title} className={cn('rounded-xl p-4', INSIGHT_TONES[signal.tone])}>
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0',
                          signal.tone === 'watch' ? 'text-risk' : 'text-positive',
                        )}
                      />
                      <div>
                        <p className="text-sm font-semibold text-heading">{signal.title}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-body">{signal.detail}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="p-5">
            <CardHeader
              eyebrow="AI deep-dive"
              title="Ask the model to read the period"
              description="Generated on the server from your saved entries. Nothing is invented when the key is missing."
              action={
                <Button
                  onClick={() => void generateInsights()}
                  loading={insightStatus === 'loading'}
                  variant={insights ? 'secondary' : 'primary'}
                >
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  {insights ? 'Regenerate' : 'Generate insights'}
                </Button>
              }
            />

            <div className="mt-4" aria-live="polite">
              {insightStatus === 'loading' ? (
                <LoadingState label="Reading your numbers…" />
              ) : insightStatus === 'error' ? (
                <Alert tone={aiConfigured ? 'error' : 'warning'}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>
                      {aiConfigured
                        ? insightError
                        : 'The AI advisor is not configured on this server yet. Add AI_API_KEY to the backend environment to enable it — your dashboard numbers are unaffected.'}
                    </span>
                    {aiConfigured ? (
                      <Button variant="secondary" size="sm" onClick={() => void generateInsights()}>
                        <RefreshCw aria-hidden="true" className="h-4 w-4" />
                        Try again
                      </Button>
                    ) : null}
                  </div>
                </Alert>
              ) : insights ? (
                <ul className="grid gap-3 md:grid-cols-3">
                  {insights.map((insight) => (
                    <li
                      key={`${insight.title}-${insight.detail.slice(0, 12)}`}
                      className={cn('rounded-xl p-4 ring-1 ring-[color:var(--color-line)]', INSIGHT_TONES[insight.tone])}
                    >
                      <p className="text-sm font-semibold text-heading">{insight.title}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-body">{insight.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col gap-1.5 rounded-xl bg-surface-muted/60 p-5 text-sm text-body">
                  <p className="font-medium text-heading">No AI read yet for {summary.periodLabel}.</p>
                  <p className="text-[13px] leading-relaxed">
                    The model reviews margins, cost control and runway, then returns three grounded observations. Your
                    deterministic signals above stay available either way.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

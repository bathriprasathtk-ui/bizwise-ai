import { ArrowRight, Lightbulb, Plus, RefreshCw, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RevenueProfitChart } from '../../components/charts/FinanceCharts';
import { HealthFactorList, HealthGauge } from '../../components/HealthGauge';
import { MetricCard } from '../../components/MetricCard';
import { Alert } from '../../components/ui/Alert';
import { Button, buttonStyles } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState, LoadingState, Skeleton } from '../../components/ui/StateViews';
import { api } from '../../lib/api';
import { buildChartSeries } from '../../lib/finance';
import { formatCurrency, formatPercent } from '../../lib/format';
import type { BusinessResponse, Insight } from '../../lib/types';

const TONE_STYLES: Record<Insight['tone'], string> = {
  positive: 'border-brand-200 bg-brand-50/70 dark:border-brand-800 dark:bg-brand-900/25',
  watch: 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/25',
  neutral: 'border-line bg-surface-muted',
};

export function DashboardPage() {
  const [data, setData] = useState<BusinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [insightStatus, setInsightStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [insightError, setInsightError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getBusiness();
      setData(response);
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
  const chartData = buildChartSeries(entries.slice(-12));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-subtle">Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-heading">
            {business?.name ?? 'Your business'}
          </h1>
          <p className="mt-1 text-sm text-body">
            {summary
              ? `Latest period · ${summary.periodLabel} · all amounts in ${currency}`
              : `All amounts in ${currency}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/business" className={buttonStyles({ variant: 'secondary' })}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Update Numbers
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
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-[124px] rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-[340px] rounded-2xl lg:col-span-2" />
            <Skeleton className="h-[340px] rounded-2xl" />
          </div>
        </div>
      ) : null}

      {!loading && !error && entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet aria-hidden="true" className="h-5 w-5" />}
            title="Add your first financial entry to see your dashboard come to life."
            description="Record one period of revenue, costs, expenses and cash on hand. BizWise turns those numbers into margins, runway and a health score."
            action={
              <Link to="/app/business" className={buttonStyles()}>
                Add financial data
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            }
          />
        </Card>
      ) : null}

      {!loading && !error && summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Revenue"
              value={formatCurrency(summary.revenue, currency)}
              delta={summary.revenueChange}
              deltaLabel={summary.previousPeriodLabel ? `vs ${summary.previousPeriodLabel}` : undefined}
              icon={<TrendingUp aria-hidden="true" className="h-4 w-4" />}
            />
            <MetricCard
              label="Net profit"
              value={formatCurrency(summary.netProfit, currency)}
              delta={summary.profitChange}
              deltaLabel={summary.previousPeriodLabel ? `vs ${summary.previousPeriodLabel}` : undefined}
              icon={<Sparkles aria-hidden="true" className="h-4 w-4" />}
            />
            <MetricCard
              label="Cash on hand"
              value={formatCurrency(summary.cashOnHand, currency)}
              hint={
                summary.cashRunwayMonths === null
                  ? 'Cash-flow positive in this period'
                  : `${summary.cashRunwayMonths} months of runway`
              }
              icon={<Wallet aria-hidden="true" className="h-4 w-4" />}
            />
            <MetricCard
              label="Gross margin"
              value={formatPercent(summary.grossMargin)}
              hint={`${formatPercent(summary.netMargin)} net margin`}
              icon={<Lightbulb aria-hidden="true" className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <CardHeader
                title="Revenue and profit"
                description="Last saved periods, oldest to newest."
                action={
                  <Link to="/app/reports" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                    View reports
                  </Link>
                }
              />
              <div className="mt-4">
                <RevenueProfitChart data={chartData} currency={currency} />
              </div>
            </Card>

            <Card className="p-5">
              <CardHeader title="Business Health Score" description="Weighted from your latest period." />
              <div className="mt-3">
                <HealthGauge health={summary.health} />
              </div>
              <div className="mt-5">
                <HealthFactorList health={summary.health} />
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <CardHeader
              title="AI Insights"
              description="Generated from your saved numbers — never from a template."
              action={
                <Button
                  onClick={() => void generateInsights()}
                  loading={insightStatus === 'loading'}
                  variant={insights ? 'secondary' : 'primary'}
                >
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  {insights ? 'Regenerate insights' : 'Generate Insights'}
                </Button>
              }
            />

            <div className="mt-4">
              {insightStatus === 'loading' ? (
                <LoadingState label="Reading your numbers…" />
              ) : insightStatus === 'error' ? (
                <Alert tone="error">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>{insightError}</span>
                    <Button variant="secondary" size="sm" onClick={() => void generateInsights()}>
                      <RefreshCw aria-hidden="true" className="h-4 w-4" />
                      Try again
                    </Button>
                  </div>
                </Alert>
              ) : insights ? (
                <ul className="space-y-3">
                  {insights.map((insight) => (
                    <li
                      key={`${insight.title}-${insight.detail.slice(0, 12)}`}
                      className={`rounded-xl border p-4 ${TONE_STYLES[insight.tone]}`}
                    >
                      <p className="text-sm font-semibold text-heading">{insight.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-body">{insight.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col gap-2 rounded-xl border border-dashed border-line bg-surface-muted/60 p-5 text-sm text-body">
                  <p className="font-medium text-heading">No insights generated yet.</p>
                  <p>
                    Generate a short read of your margins, cost control and runway based on{' '}
                    <span className="font-medium text-heading">{summary.periodLabel}</span>.
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

import { ArrowRight, FileText, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExpenseTrendChart,
  MarginTrendChart,
  ProfitHistoryChart,
  RevenueProfitChart,
} from '../../components/charts/FinanceCharts';
import { Alert } from '../../components/ui/Alert';
import { Button, buttonStyles } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState, LoadingState } from '../../components/ui/StateViews';
import { api } from '../../lib/api';
import { buildChartSeries, computeMetrics } from '../../lib/finance';
import { formatCurrency, formatPercent } from '../../lib/format';
import type { BusinessResponse } from '../../lib/types';

const RANGES = [
  { value: '3', label: 'Last 3 periods' },
  { value: '6', label: 'Last 6 periods' },
  { value: '12', label: 'Last 12 periods' },
  { value: 'all', label: 'All periods' },
] as const;

type RangeValue = (typeof RANGES)[number]['value'];

export function ReportsPage() {
  const [data, setData] = useState<BusinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeValue>('6');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getBusiness());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'We could not load your reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = data?.entries ?? [];
  const currency = data?.business.currency ?? 'USD';

  const filtered = useMemo(() => {
    if (range === 'all') return entries;
    return entries.slice(-Number(range));
  }, [entries, range]);

  const series = useMemo(() => buildChartSeries(filtered), [filtered]);

  const totals = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    let marginSum = 0;
    let best: { label: string; profit: number } | null = null;

    for (const entry of filtered) {
      const metrics = computeMetrics(entry);
      revenue += metrics.revenue;
      profit += metrics.netProfit;
      marginSum += metrics.netMargin;
      if (!best || metrics.netProfit > best.profit) {
        best = { label: entry.periodLabel, profit: metrics.netProfit };
      }
    }

    return {
      revenue,
      profit,
      averageMargin: filtered.length > 0 ? marginSum / filtered.length : 0,
      best,
    };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Reports</p>
          <h1 className="mt-1.5 text-[26px] leading-tight sm:text-[30px]">Performance over time</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-body">
            Revenue, profit, expenses and margins across your saved periods — all amounts in {currency}.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="report-range" className="sr-only">
            Period range
          </label>
          <select
            id="report-range"
            value={range}
            onChange={(event) => setRange(event.target.value as RangeValue)}
            className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-heading sm:w-auto"
          >
            {RANGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
        <Card>
          <LoadingState label="Building your report…" />
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText aria-hidden="true" className="h-5 w-5" />}
            title="No financial data to report on yet"
            description="Add your first period and this report fills in automatically: revenue history, profit history, expenses and margins."
            action={
              <Link to="/app/business" className={buttonStyles()}>
                Add financial data
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {filtered.length < 2 ? (
            <Alert tone="info">
              Only one period is in range, so trend lines are flat. Add another entry to compare periods.
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
              <p className="text-xs font-medium uppercase tracking-wide text-subtle">Total revenue</p>
              <p className="mt-3 text-2xl font-semibold text-heading">{formatCurrency(totals.revenue, currency)}</p>
              <p className="mt-1 text-xs text-subtle">
                {filtered.length} {filtered.length === 1 ? 'period' : 'periods'} in range
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
              <p className="text-xs font-medium uppercase tracking-wide text-subtle">Total net profit</p>
              <p
                className={
                  totals.profit >= 0
                    ? 'mt-3 text-2xl font-semibold text-brand-800 dark:text-brand-200'
                    : 'mt-3 text-2xl font-semibold text-red-600 dark:text-red-400'
                }
              >
                {formatCurrency(totals.profit, currency)}
              </p>
              <p className="mt-1 text-xs text-subtle">Sum of period profit</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
              <p className="text-xs font-medium uppercase tracking-wide text-subtle">Average net margin</p>
              <p className="mt-3 text-2xl font-semibold text-heading">{formatPercent(totals.averageMargin)}</p>
              <p className="mt-1 text-xs text-subtle">Mean of the periods shown</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
              <p className="text-xs font-medium uppercase tracking-wide text-subtle">Best period</p>
              <p className="mt-3 truncate text-lg font-semibold text-heading">{totals.best?.label ?? '—'}</p>
              <p className="mt-1 text-xs text-subtle">
                {totals.best ? `${formatCurrency(totals.best.profit, currency)} net profit` : 'No periods'}
              </p>
            </div>
          </div>

          <Card className="p-5">
            <CardHeader
              title="Revenue and profit history"
              description="Revenue as an area, net profit as a dashed line."
            />
            <div className="mt-4">
              <RevenueProfitChart data={series} currency={currency} />
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <CardHeader title="Profit history" description="Net profit per saved period." />
              <div className="mt-4">
                <ProfitHistoryChart data={series} currency={currency} />
              </div>
            </Card>
            <Card className="p-5">
              <CardHeader title="Margin trends" description="Gross and net margin percentages." />
              <div className="mt-4">
                <MarginTrendChart data={series} />
              </div>
            </Card>
            <Card className="p-5 lg:col-span-2">
              <CardHeader
                title="Expense trends"
                description="Cost of goods sold and operating expenses stacked per period."
              />
              <div className="mt-4">
                <ExpenseTrendChart data={series} currency={currency} />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

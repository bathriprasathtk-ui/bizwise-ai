/**
 * Client-side mirror of backend/src/services/finance.ts.
 * The backend stays authoritative for saved results; these helpers power instant
 * previews and chart series. Keep the formulas identical.
 */
import type {
  FinancialEntry,
  HealthScore,
  SimulationInputs,
  SimulationResult,
  Summary,
} from './types';

export interface EntryNumbers {
  periodLabel: string;
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  cashOnHand: number;
  createdAt?: string;
}

export interface Metrics {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  totalExpenses: number;
  cashOnHand: number;
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  expenseRatio: number;
  cashRunwayMonths: number | null;
}

const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const safeDivide = (numerator: number, denominator: number): number =>
  denominator > 0 ? numerator / denominator : 0;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous === 0) return null;
  return round((current - previous) / Math.abs(previous), 4);
}

export function computeMetrics(entry: EntryNumbers): Metrics {
  const revenue = round(entry.revenue, 2);
  const cogs = round(entry.cogs, 2);
  const operatingExpenses = round(entry.operatingExpenses, 2);
  const totalExpenses = round(cogs + operatingExpenses, 2);
  const grossProfit = round(revenue - cogs, 2);
  const netProfit = round(revenue - totalExpenses, 2);

  return {
    revenue,
    cogs,
    operatingExpenses,
    totalExpenses,
    cashOnHand: round(entry.cashOnHand, 2),
    grossProfit,
    netProfit,
    grossMargin: round(safeDivide(grossProfit, revenue), 4),
    netMargin: round(safeDivide(netProfit, revenue), 4),
    expenseRatio: round(safeDivide(totalExpenses, revenue), 4),
    // Runway only means something while the period burns cash. When revenue covers
    // every cost there is no burn, so the value is null and callers show "cash-flow positive".
    cashRunwayMonths:
      totalExpenses > revenue && totalExpenses > 0
        ? round(entry.cashOnHand / (totalExpenses - revenue), 1)
        : null,
  };
}

export function healthScore(metrics: Metrics): HealthScore {
  const profitability = round(clamp01(metrics.netMargin / 0.2) * 30, 1);
  const gross = round(clamp01(metrics.grossMargin / 0.5) * 20, 1);
  const efficiency = round(clamp01((0.95 - metrics.expenseRatio) / 0.35) * 20, 1);
  const runway = round(
    metrics.cashRunwayMonths === null
      ? metrics.netProfit > 0
        ? 15
        : 0
      : clamp01(metrics.cashRunwayMonths / 6) * 15,
    1,
  );
  const profitable = metrics.netProfit > 0 ? 15 : 0;

  const score = round(profitability + gross + efficiency + runway + profitable, 0);
  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'Stable' : score >= 40 ? 'Needs attention' : 'At risk';

  return {
    score,
    label,
    factors: [
      { label: 'Net margin', score: profitability, max: 30, detail: 'How much of each sale is profit' },
      { label: 'Gross margin', score: gross, max: 20, detail: 'Profit after the cost of goods' },
      { label: 'Cost control', score: efficiency, max: 20, detail: 'Share of revenue spent on costs' },
      {
        label: 'Cash runway',
        score: runway,
        max: 15,
        detail:
          metrics.cashRunwayMonths === null
            ? 'No cash burn this period'
            : 'Months of cash at this burn rate',
      },
      { label: 'Profitability', score: profitable, max: 15, detail: 'Profitable in the latest period' },
    ],
  };
}

export function summarizeEntries(entries: EntryNumbers[]): Summary | null {
  if (entries.length === 0) return null;

  const latest = entries[entries.length - 1];
  if (!latest) return null;
  const previous = entries.length > 1 ? entries[entries.length - 2] : undefined;

  const metrics = computeMetrics(latest);
  const previousMetrics = previous ? computeMetrics(previous) : null;

  return {
    ...metrics,
    periodLabel: latest.periodLabel,
    asOf: latest.createdAt ?? null,
    previousPeriodLabel: previous?.periodLabel ?? null,
    revenueChange: previous ? percentChange(metrics.revenue, previous.revenue) : null,
    profitChange: previousMetrics ? percentChange(metrics.netProfit, previousMetrics.netProfit) : null,
    health: healthScore(metrics),
  };
}

export function formatMoneyCompact(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  } catch {
    return `${Math.round(value).toLocaleString('en-US')} ${currency}`;
  }
}

function buildRecommendation(args: {
  currency: string;
  base: Metrics;
  projected: SimulationResult['projected'];
  targetProfit: number | null;
  targetGap: number | null;
}): string {
  const { currency, base, projected, targetProfit, targetGap } = args;
  const money = (value: number) => formatMoneyCompact(value, currency);
  const pct = (value: number) => `${round(value * 100, 1).toFixed(1)}%`;

  if (targetProfit !== null && targetGap !== null && targetGap > 0) {
    const bestCaseProfit = projected.revenue - projected.cogs;
    if (targetProfit > bestCaseProfit) {
      return `A ${money(targetProfit)} profit target is out of reach in this scenario: even with zero operating expenses the business would earn about ${money(bestCaseProfit)}. Raise prices or volume before cutting costs.`;
    }
    const priceUplift = projected.revenue > 0 ? targetGap / projected.revenue : 0;
    const opexCutShare = projected.operatingExpenses > 0 ? targetGap / projected.operatingExpenses : null;
    if (opexCutShare !== null && opexCutShare <= 0.25) {
      return `You are ${money(targetGap)} short of the target. Cutting operating expenses by ${pct(opexCutShare)} (about ${money(targetGap)}) closes the gap without touching prices.`;
    }
    return `You are ${money(targetGap)} short of the target. A ${pct(priceUplift)} price increase adds roughly ${money(targetGap)} of profit and closes the gap faster than trimming costs.`;
  }

  if (projected.netProfit < 0) {
    return 'This scenario loses money. Cut operating expenses or the cost of goods before pushing volume, then run the simulation again.';
  }

  if (projected.netProfit > base.netProfit) {
    return `Profit improves by ${money(projected.netProfit - base.netProfit)} versus the current period. Lock in these price and cost assumptions, then compare your next entry against them.`;
  }

  if (projected.netProfit === base.netProfit) {
    return 'Profit is unchanged. Try a small price increase or a targeted cost reduction to find a scenario that actually moves profit.';
  }

  return `Profit falls by ${money(base.netProfit - projected.netProfit)}. Check whether the cost or expense increase is avoidable before committing to it.`;
}

export function runSimulation(
  base: EntryNumbers,
  inputs: SimulationInputs,
  currency: string,
): SimulationResult {
  const current = computeMetrics(base);

  const priceFactor = 1 + inputs.priceChange / 100;
  const volumeFactor = 1 + inputs.volumeChange / 100;
  const costFactor = 1 + inputs.costChange / 100;
  const opexFactor = 1 + inputs.opexChange / 100;

  const projectedRevenue = round(base.revenue * priceFactor * volumeFactor, 2);
  const projectedCogs = round(base.cogs * volumeFactor * costFactor, 2);
  const projectedOpex = round(base.operatingExpenses * opexFactor, 2);
  const projectedExpenses = round(projectedCogs + projectedOpex, 2);
  const projectedNetProfit = round(projectedRevenue - projectedExpenses, 2);
  const projectedNetMargin = round(safeDivide(projectedNetProfit, projectedRevenue), 4);

  const targetProfit = inputs.targetProfit;
  const targetGap = targetProfit === null ? null : round(targetProfit - projectedNetProfit, 2);

  const projected = {
    revenue: projectedRevenue,
    cogs: projectedCogs,
    operatingExpenses: projectedOpex,
    expenses: projectedExpenses,
    netProfit: projectedNetProfit,
    netMargin: projectedNetMargin,
  };

  return {
    basePeriodLabel: base.periodLabel,
    current: {
      revenue: current.revenue,
      expenses: current.totalExpenses,
      netProfit: current.netProfit,
      netMargin: current.netMargin,
    },
    projected,
    differenceFromCurrent: round(projectedNetProfit - current.netProfit, 2),
    differencePercent: percentChange(projectedNetProfit, current.netProfit),
    targetProfit,
    targetGap,
    targetAchieved: targetGap === null ? null : targetGap <= 0,
    recommendedAction: buildRecommendation({ currency, base: current, projected, targetProfit, targetGap }),
  };
}

export interface ChartPoint {
  label: string;
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  expenses: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
}

export function buildChartSeries(entries: FinancialEntry[]): ChartPoint[] {
  return entries.map((entry) => {
    const metrics = computeMetrics(entry);
    return {
      label: entry.periodLabel,
      revenue: metrics.revenue,
      cogs: metrics.cogs,
      operatingExpenses: metrics.operatingExpenses,
      expenses: metrics.totalExpenses,
      netProfit: metrics.netProfit,
      grossMargin: round(metrics.grossMargin * 100, 1),
      netMargin: round(metrics.netMargin * 100, 1),
    };
  });
}

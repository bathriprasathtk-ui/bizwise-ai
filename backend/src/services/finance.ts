/**
 * Finance logic shared by the dashboard summary, the advisor context and the simulator.
 * Keep these formulas in sync with frontend/src/lib/finance.ts.
 */

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
  /** Months of cash left if the latest period repeats. null when the period was cash-flow positive. */
  cashRunwayMonths: number | null;
}

export interface HealthFactor {
  label: string;
  score: number;
  max: number;
  detail: string;
}

export interface HealthScore {
  score: number;
  label: string;
  factors: HealthFactor[];
}

export interface Summary extends Metrics {
  periodLabel: string;
  asOf: string | null;
  previousPeriodLabel: string | null;
  revenueChange: number | null;
  profitChange: number | null;
  health: HealthScore;
}

export interface SimulationInputs {
  priceChange: number;
  volumeChange: number;
  costChange: number;
  opexChange: number;
  targetProfit: number | null;
}

export interface SimulationResult {
  basePeriodLabel: string;
  current: {
    revenue: number;
    expenses: number;
    netProfit: number;
    netMargin: number;
  };
  projected: {
    revenue: number;
    cogs: number;
    operatingExpenses: number;
    expenses: number;
    netProfit: number;
    netMargin: number;
  };
  differenceFromCurrent: number;
  differencePercent: number | null;
  targetProfit: number | null;
  targetGap: number | null;
  targetAchieved: boolean | null;
  recommendedAction: string;
}

const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const roundMoney = (value: number): number => round(value, 2);
export const roundRatio = (value: number): number => round(value, 4);

const safeDivide = (numerator: number, denominator: number): number =>
  denominator > 0 ? numerator / denominator : 0;

export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous === 0) return null;
  return roundRatio((current - previous) / Math.abs(previous));
}

export function computeMetrics(entry: EntryNumbers): Metrics {
  const revenue = roundMoney(entry.revenue);
  const cogs = roundMoney(entry.cogs);
  const operatingExpenses = roundMoney(entry.operatingExpenses);
  const totalExpenses = roundMoney(cogs + operatingExpenses);
  const grossProfit = roundMoney(revenue - cogs);
  const netProfit = roundMoney(revenue - totalExpenses);
  const cashRunwayMonths = totalExpenses > 0 ? round(entry.cashOnHand / totalExpenses, 1) : null;

  return {
    revenue,
    cogs,
    operatingExpenses,
    totalExpenses,
    cashOnHand: roundMoney(entry.cashOnHand),
    grossProfit,
    netProfit,
    grossMargin: roundRatio(safeDivide(grossProfit, revenue)),
    netMargin: roundRatio(safeDivide(netProfit, revenue)),
    expenseRatio: roundRatio(safeDivide(totalExpenses, revenue)),
    cashRunwayMonths,
  };
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function healthScore(metrics: Metrics): HealthScore {
  const profitability = round(clamp01(metrics.netMargin / 0.2) * 30, 1);
  const gross = round(clamp01(metrics.grossMargin / 0.5) * 20, 1);
  const efficiency = round(clamp01((0.95 - metrics.expenseRatio) / 0.35) * 20, 1);
  const runway = round(
    metrics.cashRunwayMonths === null ? (metrics.netProfit > 0 ? 15 : 0) : clamp01(metrics.cashRunwayMonths / 6) * 15,
    1,
  );
  const profitable = metrics.netProfit > 0 ? 15 : 0;

  const score = round(profitability + gross + efficiency + runway + profitable, 0);
  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'Stable' : score >= 40 ? 'Needs attention' : 'At risk';

  return {
    score,
    label,
    factors: [
      {
        label: 'Net margin',
        score: profitability,
        max: 30,
        detail: `${formatRatio(metrics.netMargin)} net margin`,
      },
      {
        label: 'Gross margin',
        score: gross,
        max: 20,
        detail: `${formatRatio(metrics.grossMargin)} gross margin`,
      },
      {
        label: 'Cost control',
        score: efficiency,
        max: 20,
        detail: `${formatRatio(metrics.expenseRatio)} of revenue goes to costs`,
      },
      {
        label: 'Cash runway',
        score: runway,
        max: 15,
        detail:
          metrics.cashRunwayMonths === null
            ? 'No cash burn in the latest period'
            : `${metrics.cashRunwayMonths} months of cash`,
      },
      {
        label: 'Profitability',
        score: profitable,
        max: 15,
        detail: metrics.netProfit > 0 ? 'Profitable' : 'Not profitable yet',
      },
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

export function formatRatio(value: number): string {
  return `${round(value * 100, 1).toFixed(1)}%`;
}

function formatMoney(value: number, currency: string): string {
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
  const money = (value: number) => formatMoney(value, currency);

  if (targetProfit !== null && targetGap !== null && targetGap > 0) {
    const bestCaseProfit = projected.revenue - projected.cogs;
    if (targetProfit > bestCaseProfit) {
      return `A ${money(targetProfit)} profit target is out of reach in this scenario: even with zero operating expenses the business would earn about ${money(bestCaseProfit)}. Raise prices or volume before cutting costs.`;
    }
    const priceUplift = projected.revenue > 0 ? targetGap / projected.revenue : 0;
    const opexCutShare = projected.operatingExpenses > 0 ? targetGap / projected.operatingExpenses : null;
    if (opexCutShare !== null && opexCutShare <= 0.25) {
      return `You are ${money(targetGap)} short of the target. Cutting operating expenses by ${formatRatio(opexCutShare)} (about ${money(targetGap)}) closes the gap without touching prices.`;
    }
    return `You are ${money(targetGap)} short of the target. A ${formatRatio(priceUplift)} price increase adds roughly ${money(targetGap)} of profit and closes the gap faster than trimming costs.`;
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

export function runSimulation(base: EntryNumbers, inputs: SimulationInputs, currency: string): SimulationResult {
  const current = computeMetrics(base);

  const priceFactor = 1 + inputs.priceChange / 100;
  const volumeFactor = 1 + inputs.volumeChange / 100;
  const costFactor = 1 + inputs.costChange / 100;
  const opexFactor = 1 + inputs.opexChange / 100;

  const projectedRevenue = roundMoney(base.revenue * priceFactor * volumeFactor);
  const projectedCogs = roundMoney(base.cogs * volumeFactor * costFactor);
  const projectedOpex = roundMoney(base.operatingExpenses * opexFactor);
  const projectedExpenses = roundMoney(projectedCogs + projectedOpex);
  const projectedNetProfit = roundMoney(projectedRevenue - projectedExpenses);
  const projectedNetMargin = roundRatio(safeDivide(projectedNetProfit, projectedRevenue));

  const targetProfit = inputs.targetProfit;
  const targetGap = targetProfit === null ? null : roundMoney(targetProfit - projectedNetProfit);

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
    differenceFromCurrent: roundMoney(projectedNetProfit - current.netProfit),
    differencePercent: percentChange(projectedNetProfit, current.netProfit),
    targetProfit,
    targetGap,
    targetAchieved: targetGap === null ? null : targetGap <= 0,
    recommendedAction: buildRecommendation({ currency, base: current, projected, targetProfit, targetGap }),
  };
}

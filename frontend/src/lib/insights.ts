/**
 * Deterministic business signals.
 *
 * These are arithmetic on the owner's own saved entries — never presented as
 * AI output. The AI advisor lives in the backend and is labelled separately.
 */
import type { FinancialEntry, Summary } from './types';
import { formatCurrency, formatPercent, formatSignedPercent } from './format';

export type SignalTone = 'positive' | 'watch' | 'neutral';

export interface GrowthSignal {
  title: string;
  detail: string;
  tone: SignalTone;
}

export interface NextAction {
  title: string;
  detail: string;
  cta: string;
  to: string;
}

const pct = (value: number) => formatPercent(value);

function revenueTrend(entries: FinancialEntry[]): number | null {
  if (entries.length < 2) return null;
  const latest = entries[entries.length - 1];
  const previous = entries[entries.length - 2];
  if (!latest || !previous || previous.revenue === 0) return null;
  return (latest.revenue - previous.revenue) / Math.abs(previous.revenue);
}

export function buildGrowthSignals(
  summary: Summary,
  entries: FinancialEntry[],
  currency = 'USD',
): GrowthSignal[] {
  const signals: GrowthSignal[] = [];
  const trend = revenueTrend(entries);

  if (summary.grossMargin >= 0.45) {
    signals.push({
      title: 'Room to raise prices without losing the plot',
      detail: `Gross margin is ${pct(summary.grossMargin)}, so a 3% price rise on the same volume adds roughly ${formatCurrency(summary.revenue * 0.03, currency)} of gross profit a period.`,
      tone: 'positive',
    });
  } else if (summary.grossMargin > 0) {
    signals.push({
      title: 'Delivery cost is eating your pricing power',
      detail: `Every ${formatCurrency(100, currency)} of revenue carries ${formatCurrency(100 * (1 - summary.grossMargin), currency)} of direct cost. Renegotiate the largest supplier line before adding volume.`,
      tone: 'watch',
    });
  }

  if (trend !== null) {
    signals.push(
      trend > 0
        ? {
            title: 'Demand is compounding',
            detail: `Revenue is up ${formatSignedPercent(trend)} on the previous period. Protect what is working: repeat the acquisition channel that produced it before widening spend.`,
            tone: 'positive',
          }
        : {
            title: 'Growth stalled last period',
            detail: `Revenue fell ${formatSignedPercent(trend)} against the prior period. Win back existing customers before paying for new ones — retention is usually cheaper.`,
            tone: 'watch',
          },
    );
  }

  if (summary.cashRunwayMonths === null) {
    signals.push({
      title: 'Profitable enough to self-fund a test',
      detail: `The latest period is cash-flow positive. Fund one small, measurable experiment — a new price point or product bundle — from this period's profit.`,
      tone: 'positive',
    });
  } else if (summary.cashOnHand > 0) {
    signals.push({
      title: `${summary.cashRunwayMonths} months of runway to deploy`,
      detail: `With ${formatCurrency(summary.cashOnHand, currency)} on hand, a controlled spend of one month of expenses is affordable — keep the rest untouched.`,
      tone: summary.cashRunwayMonths >= 6 ? 'positive' : 'neutral',
    });
  }

  if (summary.netMargin < 0.1 && summary.netMargin >= 0) {
    signals.push({
      title: 'Margin headroom is the fastest lever',
      detail: `Net margin is only ${pct(summary.netMargin)}. A one-point margin gain on this revenue is worth about ${formatCurrency(summary.revenue * 0.01, currency)} per period, with no extra customers.`,
      tone: 'watch',
    });
  }

  return signals.slice(0, 3);
}

export function buildRiskSignals(summary: Summary, currency = 'USD'): GrowthSignal[] {
  const risks: GrowthSignal[] = [];

  if (summary.netProfit < 0) {
    risks.push({
      title: 'The latest period lost money',
      detail: `Costs exceeded revenue by ${formatCurrency(Math.abs(summary.netProfit), currency)}. Set a date to fix or exit the least profitable line.`,
      tone: 'watch',
    });
  }

  if (summary.cashRunwayMonths !== null && summary.cashRunwayMonths < 3) {
    risks.push({
      title: 'Runway is under a quarter',
      detail: `${summary.cashRunwayMonths} months of expenses remain at the current burn. Either cut fixed costs or collect receivables this month.`,
      tone: 'watch',
    });
  }

  if (summary.expenseRatio >= 0.7) {
    risks.push({
      title: 'Expenses are consuming most of revenue',
      detail: `The expense ratio is ${pct(summary.expenseRatio)}. Anything above 70% leaves very little buffer for a slow month.`,
      tone: 'watch',
    });
  }

  if (summary.revenueChange !== null && summary.revenueChange < -0.05) {
    risks.push({
      title: 'Revenue is contracting',
      detail: `Revenue is down ${formatSignedPercent(summary.revenueChange)} period over period. Check whether a lost account or a price change explains it.`,
      tone: 'watch',
    });
  }

  if (summary.cashOnHand < summary.totalExpenses && summary.netProfit < 0) {
    risks.push({
      title: 'Cash is below one period of costs',
      detail: `Cash on hand (${formatCurrency(summary.cashOnHand, currency)}) is less than one period of total expenses. Prioritise collections over new spend.`,
      tone: 'watch',
    });
  }

  if (risks.length === 0) {
    risks.push({
      title: 'No structural risks in this period',
      detail: 'Margins, cost control and runway all sit inside healthy ranges. Keep the next period honest so this stays true.',
      tone: 'positive',
    });
  }

  return risks.slice(0, 3);
}

export function nextBestAction(summary: Summary, currency = 'USD'): NextAction {

  if (summary.cashRunwayMonths !== null && summary.cashRunwayMonths < 3) {
    return {
      title: 'Extend runway before chasing growth',
      detail: `At ${summary.cashRunwayMonths} months of runway, trim the largest operating expense by 10% — that alone buys about ${formatCurrency(summary.operatingExpenses * 0.1, currency)} of breathing room.`,
      cta: 'Model the cut',
      to: '/app/simulator',
    };
  }

  if (summary.netProfit < 0) {
    return {
      title: 'Find the line that turns the period positive',
      detail: `You are ${formatCurrency(Math.abs(summary.netProfit), currency)} short of break-even. Simulate a 5% price rise and a 5% COGS reduction to see which closes the gap first.`,
      cta: 'Run a scenario',
      to: '/app/simulator',
    };
  }

  if (summary.netMargin < 0.12) {
    return {
      title: 'Convert revenue into margin',
      detail: `Net margin is ${pct(summary.netMargin)}. A 2% price increase with unchanged volume adds about ${formatCurrency(summary.revenue * 0.02, currency)} of profit — test it with your next customer cohort.`,
      cta: 'Ask the copilot',
      to: '/app/advisor',
    };
  }

  if (summary.grossMargin >= 0.45) {
    return {
      title: 'Reinvest a slice of the margin',
      detail: `Gross margin of ${pct(summary.grossMargin)} gives you room to fund one acquisition experiment worth up to ${formatCurrency(summary.grossProfit * 0.1, currency)} this period.`,
      cta: 'Open reports',
      to: '/app/reports',
    };
  }

  return {
    title: 'Tighten cost of goods at the source',
    detail: `Direct costs take ${pct(1 - summary.grossMargin)} of revenue. Get one supplier quote this week; a 2-point improvement is ${formatCurrency(summary.revenue * 0.02, currency)} per period.`,
    cta: 'Update numbers',
    to: '/app/business',
  };
}

export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function healthSummary(score: number): string {
  if (score >= 70) return 'Your fundamentals are holding. Protect them while you grow.';
  if (score >= 45) return 'The business works, but one or two numbers need attention this month.';
  return 'Several fundamentals are under strain. Fix the weakest factor first.';
}

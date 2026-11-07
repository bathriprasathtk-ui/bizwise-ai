import type { Business, FinancialEntry } from '../types';
import { computeMetrics, formatRatio, type Summary } from './finance';

const number = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);

/**
 * Compact, factual snapshot of the owner's saved numbers. The AI only ever sees this
 * text (never raw database rows or other users' data).
 */
export function buildFinancialContext(
  business: Business,
  entries: FinancialEntry[],
  summary: Summary | null,
): string {
  if (!summary || entries.length === 0) {
    return `Business: ${business.name} (${business.currency}). No financial entries have been recorded yet.`;
  }

  const lines: string[] = [];
  lines.push(`Business: ${business.name}`);
  lines.push(`Currency: ${business.currency}`);
  lines.push(`Periods on record: ${entries.length}`);
  lines.push('');
  lines.push(`Latest period: ${summary.periodLabel}`);
  lines.push(`- Revenue: ${number(summary.revenue)}`);
  lines.push(`- Cost of goods sold: ${number(summary.cogs)}`);
  lines.push(`- Operating expenses: ${number(summary.operatingExpenses)}`);
  lines.push(`- Net profit: ${number(summary.netProfit)}`);
  lines.push(`- Gross margin: ${formatRatio(summary.grossMargin)}`);
  lines.push(`- Net margin: ${formatRatio(summary.netMargin)}`);
  lines.push(`- Expense ratio: ${formatRatio(summary.expenseRatio)}`);
  lines.push(`- Cash on hand: ${number(summary.cashOnHand)}`);
  lines.push(
    `- Cash runway: ${summary.cashRunwayMonths === null ? 'not applicable (no cash burn in this period)' : `${summary.cashRunwayMonths} months`}`,
  );
  lines.push(
    `- Revenue change vs ${summary.previousPeriodLabel ?? 'previous period'}: ${
      summary.revenueChange === null ? 'not available' : formatRatio(summary.revenueChange)
    }`,
  );
  lines.push(
    `- Profit change vs ${summary.previousPeriodLabel ?? 'previous period'}: ${
      summary.profitChange === null ? 'not available' : formatRatio(summary.profitChange)
    }`,
  );
  lines.push(`- Business health score: ${summary.health.score}/100 (${summary.health.label})`);

  const recent = entries.slice(-6);
  if (recent.length > 1) {
    lines.push('');
    lines.push('History (oldest to newest, revenue / net profit / cash on hand):');
    for (const entry of recent) {
      const metrics = computeMetrics(entry);
      lines.push(
        `- ${entry.periodLabel}: revenue ${number(metrics.revenue)}, net profit ${number(metrics.netProfit)}, cash ${number(metrics.cashOnHand)}`,
      );
    }
  }

  lines.push('');
  lines.push('All amounts above are in ' + business.currency + '.');

  return lines.join('\n');
}

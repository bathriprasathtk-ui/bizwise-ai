import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactCurrency, formatCurrency, formatPercent } from '../../lib/format';
import type { ChartPoint } from '../../lib/finance';

const AXIS_TICK = { fill: 'var(--color-chart-tick)', fontSize: 11 };
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-line)',
  borderRadius: 12,
  color: 'var(--color-heading)',
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 18px 40px -28px rgba(8,27,36,0.6)',
};
const LEGEND_STYLE = { fontSize: 11, color: 'var(--color-body)', paddingTop: 8 };
// Recharts colours legend labels with the series by default, which fails contrast
// for light series colours. Keep the swatch coloured, render the label in body text.
const legendFormatter = (value: string) => <span style={{ color: 'var(--color-body)' }}>{value}</span>;

const SERIES = {
  primary: 'var(--color-series-primary)',
  secondary: 'var(--color-series-secondary)',
  muted: 'var(--color-chart-grid)',
};

function grid() {
  return <CartesianGrid strokeDasharray="2 4" stroke="var(--color-chart-grid)" vertical={false} />;
}

function xAxis() {
  return <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />;
}

function moneyAxis(currency: string) {
  return (
    <YAxis
      tick={AXIS_TICK}
      axisLine={false}
      tickLine={false}
      width={64}
      tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
    />
  );
}

export function RevenueProfitChart({ data, currency }: { data: ChartPoint[]; currency: string }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES.primary} stopOpacity={0.24} />
              <stop offset="100%" stopColor={SERIES.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {grid()}
          {xAxis()}
          {moneyAxis(currency)}
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [formatCurrency(Number(value), currency), name as string]}
          />
          <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={7} formatter={legendFormatter} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke={SERIES.primary}
            strokeWidth={2.2}
            fill="url(#revenueFill)"
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="netProfit"
            name="Net profit"
            stroke={SERIES.secondary}
            strokeWidth={2}
            strokeDasharray="5 4"
            fill="transparent"
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpenseTrendChart({ data, currency }: { data: ChartPoint[]; currency: string }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cogsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES.primary} stopOpacity={0.28} />
              <stop offset="100%" stopColor={SERIES.primary} stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="opexFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-subtle)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--color-subtle)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          {grid()}
          {xAxis()}
          {moneyAxis(currency)}
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [formatCurrency(Number(value), currency), name as string]}
          />
          <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={7} formatter={legendFormatter} />
          <Area
            type="monotone"
            dataKey="cogs"
            name="Cost of goods"
            stackId="expenses"
            stroke={SERIES.primary}
            strokeWidth={1.5}
            fill="url(#cogsFill)"
          />
          <Area
            type="monotone"
            dataKey="operatingExpenses"
            name="Operating expenses"
            stackId="expenses"
            stroke="var(--color-subtle)"
            strokeWidth={1.5}
            fill="url(#opexFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProfitHistoryChart({ data, currency }: { data: ChartPoint[]; currency: string }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {grid()}
          {xAxis()}
          {moneyAxis(currency)}
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [formatCurrency(Number(value), currency), 'Net profit']}
          />
          <Bar dataKey="netProfit" name="Net profit" fill={SERIES.primary} radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MarginTrendChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {grid()}
          {xAxis()}
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(value) => `${Math.round(Number(value))}%`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [formatPercent(Number(value) / 100), name as string]}
          />
          <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={7} formatter={legendFormatter} />
          <Line
            type="monotone"
            dataKey="grossMargin"
            name="Gross margin"
            stroke={SERIES.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="netMargin"
            name="Net margin"
            stroke={SERIES.secondary}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tiny trend used inside metric cards. No axes, no tooltip, no chrome. */
export function Sparkline({
  data,
  dataKey = 'revenue',
  tone = 'primary',
  height = 40,
}: {
  data: ChartPoint[];
  dataKey?: keyof ChartPoint;
  tone?: 'primary' | 'secondary' | 'risk';
  height?: number;
}) {
  const stroke = tone === 'risk' ? 'var(--color-risk)' : tone === 'secondary' ? SERIES.secondary : SERIES.primary;
  const gradientId = `spark-${String(dataKey)}-${tone}`;

  return (
    <div style={{ height }} className="w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={1.8} fill={`url(#${gradientId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

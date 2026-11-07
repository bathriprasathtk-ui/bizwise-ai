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

const AXIS_TICK = { fill: 'var(--color-chart-tick)', fontSize: 12 };
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-line)',
  borderRadius: 12,
  color: 'var(--color-heading)',
  fontSize: 12,
  padding: '8px 12px',
};
const LEGEND_STYLE = { fontSize: 12, color: 'var(--color-body)' };

function grid() {
  return <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" vertical={false} />;
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
      width={68}
      tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
    />
  );
}

export function RevenueProfitChart({ data, currency }: { data: ChartPoint[]; currency: string }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F766E" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#0F766E" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {grid()}
          {xAxis()}
          {moneyAxis(currency)}
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [formatCurrency(Number(value), currency), name as string]}
          />
          <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={8} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#0F766E"
            strokeWidth={2}
            fill="url(#revenueFill)"
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="netProfit"
            name="Net profit"
            stroke="#0EA5A4"
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
              <stop offset="0%" stopColor="#115E59" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#115E59" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="opexFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          {grid()}
          {xAxis()}
          {moneyAxis(currency)}
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [formatCurrency(Number(value), currency), name as string]}
          />
          <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={8} />
          <Area
            type="monotone"
            dataKey="cogs"
            name="Cost of goods"
            stackId="expenses"
            stroke="#115E59"
            strokeWidth={1.5}
            fill="url(#cogsFill)"
          />
          <Area
            type="monotone"
            dataKey="operatingExpenses"
            name="Operating expenses"
            stackId="expenses"
            stroke="#94A3B8"
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
          <Bar dataKey="netProfit" name="Net profit" fill="#0F766E" radius={[6, 6, 0, 0]} maxBarSize={44} />
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
            width={56}
            tickFormatter={(value) => `${Math.round(Number(value))}%`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [formatPercent(Number(value) / 100), name as string]}
          />
          <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={8} />
          <Line
            type="monotone"
            dataKey="grossMargin"
            name="Gross margin"
            stroke="#0F766E"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="netMargin"
            name="Net margin"
            stroke="#0EA5A4"
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

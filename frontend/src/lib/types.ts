export interface Business {
  id: string;
  name: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialEntry {
  id: string;
  periodLabel: string;
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  cashOnHand: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface Summary {
  periodLabel: string;
  asOf: string | null;
  previousPeriodLabel: string | null;
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
  revenueChange: number | null;
  profitChange: number | null;
  health: HealthScore;
}

export interface BusinessResponse {
  business: Business;
  entries: FinancialEntry[];
  summary: Summary | null;
}

export interface EntryPayload {
  periodLabel: string;
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  cashOnHand: number;
  notes?: string | null;
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

export interface Scenario {
  id: string;
  name: string;
  inputs: SimulationInputs;
  results: SimulationResult | Record<string, unknown>;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Insight {
  title: string;
  detail: string;
  tone: 'positive' | 'watch' | 'neutral';
}

export interface InsightsResponse {
  insights: Insight[];
  generatedAt: string;
  provider: string;
  model: string;
}

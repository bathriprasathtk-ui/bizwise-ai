export interface AuthUser {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

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

export interface SimulationInputs {
  priceChange: number;
  volumeChange: number;
  costChange: number;
  opexChange: number;
  targetProfit: number | null;
}

export interface Scenario {
  id: string;
  name: string;
  inputs: SimulationInputs;
  results: unknown;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface TokenClaims {
  sub: string;
  email: string;
}

import { supabase } from './supabase';
import type {
  Business,
  BusinessResponse,
  ChatMessage,
  EntryPayload,
  InsightsResponse,
  Scenario,
  SimulationInputs,
  SimulationResult,
  Summary,
} from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(code: string, status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function asApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError('REQUEST_ABORTED', 0, 'The request was cancelled.');
  }
  return new ApiError('NETWORK_ERROR', 0, 'We could not reach the server. Check your connection and try again.');
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new ApiError('AUTH_REQUIRED', 401, 'Your session has expired. Please sign in again.');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    throw asApiError(error);
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text.length > 0) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const record = (payload ?? {}) as {
      error?: { code?: string; message?: string; details?: { field?: string; message?: string }[] };
    };
    const details = record.error?.details ?? [];
    const fieldErrors: Record<string, string> = {};
    for (const detail of details) {
      if (detail.field && detail.message && !fieldErrors[detail.field]) {
        fieldErrors[detail.field] = detail.message;
      }
    }
    throw new ApiError(
      record.error?.code ?? 'REQUEST_FAILED',
      response.status,
      record.error?.message ?? 'Something went wrong. Please try again.',
      fieldErrors,
    );
  }

  return payload as T;
}

export const api = {
  getBusiness(): Promise<BusinessResponse> {
    return request<BusinessResponse>('/business');
  },

  updateBusiness(payload: { name?: string; currency?: string }): Promise<{ business: Business }> {
    return request<{ business: Business }>('/business', { method: 'POST', body: payload });
  },

  createEntry(payload: EntryPayload): Promise<{ entry: unknown; summary: Summary | null }> {
    return request<{ entry: unknown; summary: Summary | null }>('/business/entries', {
      method: 'POST',
      body: payload,
    });
  },

  updateEntry(id: string, payload: EntryPayload): Promise<{ entry: unknown; summary: Summary | null }> {
    return request<{ entry: unknown; summary: Summary | null }>(`/business/entries/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  deleteEntry(id: string): Promise<{ success: boolean; summary: Summary | null }> {
    return request<{ success: boolean; summary: Summary | null }>(`/business/entries/${id}`, {
      method: 'DELETE',
    });
  },

  generateInsights(): Promise<InsightsResponse> {
    return request<InsightsResponse>('/business/insights', { method: 'POST', body: {} });
  },

  simulate(payload: SimulationInputs & { name?: string; save?: boolean }): Promise<{
    result: SimulationResult;
    scenario: Scenario | null;
    currency: string;
  }> {
    return request('/simulate', { method: 'POST', body: payload });
  },

  getScenarios(): Promise<{ scenarios: Scenario[]; currency: string }> {
    return request<{ scenarios: Scenario[]; currency: string }>('/simulate/history');
  },

  deleteScenario(id: string): Promise<{ success: boolean; scenarios: Scenario[] }> {
    return request<{ success: boolean; scenarios: Scenario[] }>(`/simulate/${id}`, { method: 'DELETE' });
  },

  getChat(): Promise<{ messages: ChatMessage[] }> {
    return request<{ messages: ChatMessage[] }>('/ai/chat');
  },

  sendChat(message: string): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    return request<{ userMessage: ChatMessage; assistantMessage: ChatMessage }>('/ai/chat', {
      method: 'POST',
      body: { message },
    });
  },
};

import { databaseError, notFound } from '../lib/errors';
import type { Business, ChatMessage, FinancialEntry, Scenario, SimulationInputs } from '../types';
import { getAdminClient } from './supabase';

const BUSINESS_COLUMNS = 'id, user_id, name, currency, created_at, updated_at';
const ENTRY_COLUMNS =
  'id, period_label, revenue, cogs, operating_expenses, cash_on_hand, notes, created_at, updated_at';
const SCENARIO_COLUMNS = 'id, name, inputs, results, created_at';
const MESSAGE_COLUMNS = 'id, role, content, created_at';

interface BusinessRow {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface EntryRow {
  id: string;
  period_label: string;
  revenue: number | string;
  cogs: number | string;
  operating_expenses: number | string;
  cash_on_hand: number | string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ScenarioRow {
  id: string;
  name: string;
  inputs: unknown;
  results: unknown;
  created_at: string;
}

interface MessageRow {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

function toNumber(value: number | string | null): number {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : value ?? 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEntry(row: EntryRow): FinancialEntry {
  return {
    id: row.id,
    periodLabel: row.period_label,
    revenue: toNumber(row.revenue),
    cogs: toNumber(row.cogs),
    operatingExpenses: toNumber(row.operating_expenses),
    cashOnHand: toNumber(row.cash_on_hand),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapScenario(row: ScenarioRow): Scenario {
  return {
    id: row.id,
    name: row.name,
    inputs: row.inputs as SimulationInputs,
    results: row.results,
    createdAt: row.created_at,
  };
}

function mapMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role === 'assistant' ? 'assistant' : 'user',
    content: row.content,
    createdAt: row.created_at,
  };
}

/**
 * Returns the caller's business, creating it lazily if the signup trigger has not run.
 * Every lookup is scoped by user_id.
 */
export async function ensureBusiness(userId: string): Promise<Business> {
  const supabase = getAdminClient();

  const existing = await supabase.from('businesses').select(BUSINESS_COLUMNS).eq('user_id', userId).maybeSingle();
  if (existing.error) throw databaseError();
  if (existing.data) return mapBusiness(existing.data as BusinessRow);

  const created = await supabase
    .from('businesses')
    .insert({ user_id: userId, name: 'My Business', currency: 'USD' })
    .select(BUSINESS_COLUMNS)
    .single();

  if (created.error) {
    // Another request may have created it between the select and the insert.
    const retry = await supabase.from('businesses').select(BUSINESS_COLUMNS).eq('user_id', userId).maybeSingle();
    if (retry.data) return mapBusiness(retry.data as BusinessRow);
    throw databaseError();
  }

  return mapBusiness(created.data as BusinessRow);
}

export async function updateBusiness(
  businessId: string,
  userId: string,
  patch: { name?: string; currency?: string },
): Promise<Business> {
  const supabase = getAdminClient();
  const update: Record<string, string> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.currency !== undefined) update.currency = patch.currency;

  if (Object.keys(update).length === 0) {
    throw databaseError();
  }

  const { data, error } = await supabase
    .from('businesses')
    .update(update)
    .eq('id', businessId)
    .eq('user_id', userId)
    .select(BUSINESS_COLUMNS)
    .maybeSingle();

  if (error) throw databaseError();
  if (!data) throw notFound('We could not find your business profile.');
  return mapBusiness(data as BusinessRow);
}

export async function listEntries(businessId: string, userId: string, limit = 120): Promise<FinancialEntry[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('financial_entries')
    .select(ENTRY_COLUMNS)
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw databaseError();
  return (data ?? []).map((row) => mapEntry(row as EntryRow)).reverse();
}

export interface EntryPayload {
  periodLabel: string;
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  cashOnHand: number;
  notes?: string | null;
}

export async function createEntry(businessId: string, userId: string, payload: EntryPayload): Promise<FinancialEntry> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('financial_entries')
    .insert({
      business_id: businessId,
      user_id: userId,
      period_label: payload.periodLabel,
      revenue: payload.revenue,
      cogs: payload.cogs,
      operating_expenses: payload.operatingExpenses,
      cash_on_hand: payload.cashOnHand,
      notes: payload.notes ?? null,
    })
    .select(ENTRY_COLUMNS)
    .single();

  if (error) throw databaseError();
  return mapEntry(data as EntryRow);
}

export async function updateEntry(
  entryId: string,
  businessId: string,
  userId: string,
  payload: Partial<EntryPayload>,
): Promise<FinancialEntry> {
  const supabase = getAdminClient();
  const update: Record<string, string | number | null> = {};
  if (payload.periodLabel !== undefined) update.period_label = payload.periodLabel;
  if (payload.revenue !== undefined) update.revenue = payload.revenue;
  if (payload.cogs !== undefined) update.cogs = payload.cogs;
  if (payload.operatingExpenses !== undefined) update.operating_expenses = payload.operatingExpenses;
  if (payload.cashOnHand !== undefined) update.cash_on_hand = payload.cashOnHand;
  if (payload.notes !== undefined) update.notes = payload.notes;

  if (Object.keys(update).length === 0) throw notFound('Nothing to update.');

  const { data, error } = await supabase
    .from('financial_entries')
    .update(update)
    .eq('id', entryId)
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .select(ENTRY_COLUMNS)
    .maybeSingle();

  if (error) throw databaseError();
  if (!data) throw notFound('That entry no longer exists.');
  return mapEntry(data as EntryRow);
}

export async function deleteEntry(entryId: string, businessId: string, userId: string): Promise<void> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('financial_entries')
    .delete()
    .eq('id', entryId)
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .select('id');

  if (error) throw databaseError();
  if (!data || data.length === 0) throw notFound('That entry no longer exists.');
}

export async function listScenarios(businessId: string, userId: string, limit = 30): Promise<Scenario[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('simulations')
    .select(SCENARIO_COLUMNS)
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw databaseError();
  return (data ?? []).map((row) => mapScenario(row as ScenarioRow));
}

export async function createScenario(
  businessId: string,
  userId: string,
  name: string,
  inputs: SimulationInputs,
  results: unknown,
): Promise<Scenario> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('simulations')
    .insert({ business_id: businessId, user_id: userId, name, inputs, results })
    .select(SCENARIO_COLUMNS)
    .single();

  if (error) throw databaseError();
  return mapScenario(data as ScenarioRow);
}

export async function deleteScenario(scenarioId: string, businessId: string, userId: string): Promise<void> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('simulations')
    .delete()
    .eq('id', scenarioId)
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .select('id');

  if (error) throw databaseError();
  if (!data || data.length === 0) throw notFound('That scenario no longer exists.');
}

export async function listChatMessages(
  businessId: string,
  userId: string,
  limit = 40,
): Promise<ChatMessage[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .select(MESSAGE_COLUMNS)
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .order('seq', { ascending: false })
    .limit(limit);

  if (error) throw databaseError();
  return (data ?? []).map((row) => mapMessage(row as MessageRow)).reverse();
}

export async function insertChatMessage(
  businessId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<ChatMessage> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ business_id: businessId, user_id: userId, role, content })
    .select(MESSAGE_COLUMNS)
    .single();

  if (error) throw databaseError();
  return mapMessage(data as MessageRow);
}

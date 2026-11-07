import { BookOpen, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { TextArea, TextInput } from '../../components/ui/Field';
import { EmptyState, LoadingState } from '../../components/ui/StateViews';
import { api, ApiError } from '../../lib/api';
import { computeMetrics, summarizeEntries } from '../../lib/finance';
import { formatCurrency, formatPercent, formatSignedPercent } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { BusinessResponse, FinancialEntry } from '../../lib/types';
import {
  emptyEntryForm,
  toAmount,
  validateEntryForm,
  type EntryFormState,
  type FormErrors,
} from '../../lib/validation';

const EXPLAINERS = [
  {
    term: 'Gross margin',
    body: 'What is left from each sale after direct costs. It shows how much pricing power you have.',
  },
  {
    term: 'Net margin',
    body: 'What the business actually keeps once every cost is paid. This is the real bottom line.',
  },
  {
    term: 'Expense ratio',
    body: 'The share of revenue consumed by all costs. Lower means a leaner operation.',
  },
  {
    term: 'Cash runway',
    body: 'How many months your cash on hand covers at this period’s burn rate.',
  },
];

function WorksheetGroup({
  index,
  title,
  description,
  children,
}: {
  index: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-5 first:border-0 first:pt-0">
      <div className="flex items-start gap-3">
        <span className="numeric mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-[11px] font-semibold text-subtle">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-heading">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-subtle">{description}</p>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-0 last:pb-0">
      <dt className="text-[13px] text-body">{label}</dt>
      <dd className={cn('numeric text-[13px]', emphasis ? 'font-semibold text-heading' : 'font-medium text-heading')}>
        {value}
      </dd>
    </div>
  );
}

export function BusinessPage() {
  const [data, setData] = useState<BusinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<EntryFormState>(emptyEntryForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setData(await api.getBusiness());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'We could not load your financial data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = data?.entries ?? [];
  const currency = data?.business.currency ?? 'USD';
  const latestSummary = entries.length > 0 ? summarizeEntries(entries) : null;

  const worksheetHasInput =
    form.revenue.trim() !== '' ||
    form.cogs.trim() !== '' ||
    form.operatingExpenses.trim() !== '' ||
    form.cashOnHand.trim() !== '';

  const liveMetrics = useMemo(() => {
    if (!worksheetHasInput) return null;
    return computeMetrics({
      periodLabel: form.periodLabel.trim() || 'This period',
      revenue: toAmount(form.revenue),
      cogs: toAmount(form.cogs),
      operatingExpenses: toAmount(form.operatingExpenses),
      cashOnHand: toAmount(form.cashOnHand),
    });
  }, [form, worksheetHasInput]);

  function updateField<K extends keyof EntryFormState>(field: K, value: EntryFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSuccessMessage(null);
  }

  function startEdit(entry: FinancialEntry) {
    setEditingId(entry.id);
    setForm({
      periodLabel: entry.periodLabel,
      revenue: String(entry.revenue),
      cogs: String(entry.cogs),
      operatingExpenses: String(entry.operatingExpenses),
      cashOnHand: String(entry.cashOnHand),
      notes: entry.notes ?? '',
    });
    setFormErrors({});
    setFormError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyEntryForm());
    setFormErrors({});
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateEntryForm(form);
    setFormErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const payload = {
      periodLabel: form.periodLabel.trim(),
      revenue: toAmount(form.revenue),
      cogs: toAmount(form.cogs),
      operatingExpenses: toAmount(form.operatingExpenses),
      cashOnHand: toAmount(form.cashOnHand),
      notes: form.notes.trim() ? form.notes.trim() : null,
    };

    setSaving(true);
    setFormError(null);
    setSuccessMessage(null);
    try {
      if (editingId) {
        await api.updateEntry(editingId, payload);
        setSuccessMessage('Entry updated. Your dashboard and copilot now use these numbers.');
      } else {
        await api.createEntry(payload);
        setSuccessMessage('Entry saved. Your dashboard and copilot now use these numbers.');
      }
      setEditingId(null);
      setForm(emptyEntryForm());
      await load();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        setFormErrors(error.fieldErrors);
      }
      setFormError(error instanceof Error ? error.message : 'We could not save this entry.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: string) {
    setDeletingId(entryId);
    setDeleteError(null);
    try {
      await api.deleteEntry(entryId);
      setConfirmDeleteId(null);
      setSuccessMessage('Entry deleted.');
      if (editingId === entryId) cancelEdit();
      await load();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'We could not delete that entry.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Business analysis</p>
        <h1 className="mt-1.5 text-[26px] leading-tight sm:text-[30px]">Financial worksheet</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-body">
          Record each period once, in plain business language. Margins, runway, the health score and the copilot all
          read from this worksheet.
        </p>
      </header>

      {loadError ? (
        <Alert tone="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{loadError}</span>
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </Alert>
      ) : null}

      {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}
      {deleteError ? <Alert tone="error">{deleteError}</Alert> : null}

      {loading ? (
        <Card>
          <LoadingState label="Loading your entries…" />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="p-5 sm:p-6">
            <CardHeader
              eyebrow={editingId ? 'Editing a saved period' : 'New period'}
              title={editingId ? 'Update this entry' : 'Add financial entry'}
              description={`All amounts in ${currency}. Enter 0 where a line does not apply.`}
              action={
                editingId ? (
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X aria-hidden="true" className="h-4 w-4" />
                    Cancel
                  </Button>
                ) : null
              }
            />

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
              {formError ? <Alert tone="error">{formError}</Alert> : null}

              <WorksheetGroup index="01" title="Period" description="Label the month or quarter this worksheet covers.">
                <TextInput
                  id="period-label"
                  label="Period label"
                  required
                  value={form.periodLabel}
                  onChange={(event) => updateField('periodLabel', event.target.value)}
                  error={formErrors.periodLabel}
                  placeholder="March 2026"
                  hint="Keep the same format each period so trends stay comparable."
                  maxLength={60}
                />
              </WorksheetGroup>

              <WorksheetGroup
                index="02"
                title="Revenue"
                description="Everything you invoiced or collected in this period, before any costs."
              >
                <TextInput
                  id="revenue"
                  label={`Revenue (${currency})`}
                  required
                  inputMode="decimal"
                  value={form.revenue}
                  onChange={(event) => updateField('revenue', event.target.value)}
                  error={formErrors.revenue}
                  placeholder="48200"
                />
              </WorksheetGroup>

              <WorksheetGroup
                index="03"
                title="Direct costs"
                description="What it costs to deliver what you sold — materials, supplier bills, delivery."
              >
                <TextInput
                  id="cogs"
                  label={`Cost of goods sold (${currency})`}
                  required
                  inputMode="decimal"
                  value={form.cogs}
                  onChange={(event) => updateField('cogs', event.target.value)}
                  error={formErrors.cogs}
                  placeholder="18500"
                />
              </WorksheetGroup>

              <WorksheetGroup
                index="04"
                title="Operating expenses"
                description="The cost of running the business: rent, salaries, software, marketing."
              >
                <TextInput
                  id="operating-expenses"
                  label={`Operating expenses (${currency})`}
                  required
                  inputMode="decimal"
                  value={form.operatingExpenses}
                  onChange={(event) => updateField('operatingExpenses', event.target.value)}
                  error={formErrors.operatingExpenses}
                  placeholder="13000"
                />
              </WorksheetGroup>

              <WorksheetGroup
                index="05"
                title="Cash"
                description="What was actually in the bank at the end of the period, not profit."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput
                    id="cash-on-hand"
                    label={`Cash on hand (${currency})`}
                    required
                    inputMode="decimal"
                    value={form.cashOnHand}
                    onChange={(event) => updateField('cashOnHand', event.target.value)}
                    error={formErrors.cashOnHand}
                    placeholder="54000"
                    hint="Drives the runway estimate."
                  />
                </div>
              </WorksheetGroup>

              <WorksheetGroup index="06" title="Notes" description="Context the numbers cannot carry.">
                <TextArea
                  id="notes"
                  label="Notes"
                  optionalLabel="(optional)"
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  error={formErrors.notes}
                  placeholder="One-off purchase, a price change, a lost account…"
                  maxLength={500}
                />
              </WorksheetGroup>

              <div className="flex flex-wrap gap-2 border-t border-line pt-5">
                <Button type="submit" loading={saving}>
                  {editingId ? 'Save changes' : 'Save entry'}
                </Button>
                {editingId ? (
                  <Button variant="secondary" onClick={cancelEdit}>
                    Discard
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>

          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="p-5">
              <CardHeader
                eyebrow={liveMetrics ? 'Live preview' : 'Latest saved period'}
                title={liveMetrics ? 'This worksheet' : latestSummary ? latestSummary.periodLabel : 'No entries yet'}
                description={
                  liveMetrics
                    ? 'Recalculated as you type. Nothing is saved until you press Save.'
                    : latestSummary
                      ? 'Your last saved period, used across the workspace.'
                      : 'Fill the worksheet to see the effect instantly.'
                }
              />

              {liveMetrics ? (
                <dl className="mt-4">
                  <SummaryRow label="Revenue" value={formatCurrency(liveMetrics.revenue, currency)} />
                  <SummaryRow label="Gross profit" value={formatCurrency(liveMetrics.grossProfit, currency)} />
                  <SummaryRow label="Gross margin" value={formatPercent(liveMetrics.grossMargin)} />
                  <SummaryRow label="Total costs" value={formatCurrency(liveMetrics.totalExpenses, currency)} />
                  <SummaryRow
                    label="Net profit"
                    value={formatCurrency(liveMetrics.netProfit, currency)}
                    emphasis
                  />
                  <SummaryRow label="Net margin" value={formatPercent(liveMetrics.netMargin)} />
                  <SummaryRow label="Expense ratio" value={formatPercent(liveMetrics.expenseRatio)} />
                  <SummaryRow
                    label="Runway"
                    value={
                      liveMetrics.cashRunwayMonths === null
                        ? 'No burn'
                        : `${liveMetrics.cashRunwayMonths} months`
                    }
                  />
                </dl>
              ) : latestSummary ? (
                <dl className="mt-4">
                  <SummaryRow label="Net profit" value={formatCurrency(latestSummary.netProfit, currency)} />
                  <SummaryRow label="Gross margin" value={formatPercent(latestSummary.grossMargin)} />
                  <SummaryRow label="Net margin" value={formatPercent(latestSummary.netMargin)} />
                  <SummaryRow label="Expense ratio" value={formatPercent(latestSummary.expenseRatio)} />
                  <SummaryRow
                    label="Cash runway"
                    value={
                      latestSummary.cashRunwayMonths === null
                        ? 'Cash-flow positive'
                        : `${latestSummary.cashRunwayMonths} months`
                    }
                  />
                  <SummaryRow
                    label="Revenue change"
                    value={
                      latestSummary.revenueChange === null
                        ? 'First period'
                        : formatSignedPercent(latestSummary.revenueChange)
                    }
                  />
                  <SummaryRow
                    label="Profit change"
                    value={
                      latestSummary.profitChange === null
                        ? 'First period'
                        : formatSignedPercent(latestSummary.profitChange)
                    }
                  />
                </dl>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-body">
                  Save your first period and this panel becomes your live read of the business.
                </p>
              )}

              {liveMetrics && liveMetrics.netProfit < 0 ? (
                <Alert tone="warning" className="mt-4">
                  This period spends more than it earns. Check direct costs before pushing volume.
                </Alert>
              ) : null}
            </Card>

            <Card className="p-5">
              <CardHeader
                eyebrow="Plain English"
                title="What these numbers mean"
                action={
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-subtle">
                    <BookOpen aria-hidden="true" className="h-4 w-4" />
                  </span>
                }
              />
              <dl className="mt-4 space-y-3">
                {EXPLAINERS.map((item) => (
                  <div key={item.term} className="rounded-xl bg-surface-muted/60 p-3">
                    <dt className="text-[13px] font-semibold text-heading">{item.term}</dt>
                    <dd className="mt-0.5 text-xs leading-relaxed text-subtle">{item.body}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6">
          <CardHeader
            eyebrow="History"
            title="Saved periods"
            description={
              entries.length > 0
                ? `${entries.length} ${entries.length === 1 ? 'period' : 'periods'} recorded, oldest first.`
                : 'Your saved periods will appear here.'
            }
          />
        </div>

        {!loading && entries.length === 0 ? (
          <EmptyState
            icon={<Plus aria-hidden="true" className="h-5 w-5" />}
            title="No entries yet"
            description="Start with the period you know best — last month is usually enough. Every calculation in BizWise begins here."
          />
        ) : null}

        {entries.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_0.9fr_1fr_auto] gap-3 border-y border-line bg-surface-muted/50 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-eyebrow text-subtle sm:px-6">
                <span>Period</span>
                <span className="text-right">Revenue</span>
                <span className="text-right">Net profit</span>
                <span className="text-right">Net margin</span>
                <span className="text-right">Cash</span>
                <span className="text-right">Actions</span>
              </div>
              <ul>
                {entries.map((entry) => {
                  const metrics = computeMetrics(entry);
                  const isConfirming = confirmDeleteId === entry.id;
                  return (
                    <li
                      key={entry.id}
                      className={cn(
                        'grid grid-cols-1 gap-2 border-b border-line px-5 py-4 transition-colors last:border-0 hover:bg-surface-muted/40 sm:grid-cols-[1.5fr_1fr_1fr_0.9fr_1fr_auto] sm:items-center sm:gap-3 sm:px-6',
                        editingId === entry.id && 'bg-brand-50/40 dark:bg-brand-900/20',
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-heading">{entry.periodLabel}</p>
                        <p className="text-xs text-subtle">
                          COGS {formatCurrency(entry.cogs, currency)} · Opex{' '}
                          {formatCurrency(entry.operatingExpenses, currency)}
                        </p>
                        {entry.notes ? <p className="mt-1 line-clamp-2 text-xs text-subtle">{entry.notes}</p> : null}
                      </div>
                      <div className="flex items-baseline justify-between gap-2 sm:block sm:text-right">
                        <span className="text-xs text-subtle sm:hidden">Revenue</span>
                        <span className="numeric text-sm text-heading">{formatCurrency(entry.revenue, currency)}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2 sm:block sm:text-right">
                        <span className="text-xs text-subtle sm:hidden">Net profit</span>
                        <span
                          className={cn(
                            'numeric text-sm font-medium',
                            metrics.netProfit >= 0 ? 'text-positive' : 'text-risk',
                          )}
                        >
                          {formatCurrency(metrics.netProfit, currency)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2 sm:block sm:text-right">
                        <span className="text-xs text-subtle sm:hidden">Net margin</span>
                        <span className="numeric text-sm text-heading">{formatPercent(metrics.netMargin)}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2 sm:block sm:text-right">
                        <span className="text-xs text-subtle sm:hidden">Cash</span>
                        <span className="numeric text-sm text-heading">{formatCurrency(entry.cashOnHand, currency)}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap justify-end gap-2 sm:mt-0">
                        {isConfirming ? (
                          <>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={deletingId === entry.id}
                              onClick={() => void handleDelete(entry.id)}
                            >
                              Confirm delete
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => startEdit(entry)}>
                              <Pencil aria-hidden="true" className="h-4 w-4" />
                              <span className="sr-only sm:not-sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setConfirmDeleteId(entry.id);
                                setDeleteError(null);
                              }}
                            >
                              <Trash2 aria-hidden="true" className="h-4 w-4" />
                              <span className="sr-only sm:not-sr-only">Delete</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

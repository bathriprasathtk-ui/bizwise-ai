import { Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
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
        setSuccessMessage('Entry updated. Your dashboard and advisor now use these numbers.');
      } else {
        await api.createEntry(payload);
        setSuccessMessage('Entry saved. Your dashboard and advisor now use these numbers.');
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
        <p className="text-xs font-medium uppercase tracking-wide text-subtle">Business Analysis</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-heading">Financial entries</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-body">
          Record each period once. Everything else — margins, runway, health score, advisor context — is calculated
          from these numbers.
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="p-5">
            <CardHeader
              title={editingId ? 'Edit entry' : 'Add financial entry'}
              description={
                editingId
                  ? 'Update the period and save to recalculate your dashboard.'
                  : 'All amounts in ' + currency + '. Enter 0 where a line does not apply.'
              }
              action={
                editingId ? (
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X aria-hidden="true" className="h-4 w-4" />
                    Cancel
                  </Button>
                ) : null
              }
            />

            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
              {formError ? <Alert tone="error">{formError}</Alert> : null}

              <TextInput
                id="period-label"
                label="Period label"
                required
                value={form.periodLabel}
                onChange={(event) => updateField('periodLabel', event.target.value)}
                error={formErrors.periodLabel}
                placeholder="March 2026"
                hint="Use the same label format each period so trends stay readable."
                maxLength={60}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  id="revenue"
                  label="Revenue"
                  required
                  inputMode="decimal"
                  value={form.revenue}
                  onChange={(event) => updateField('revenue', event.target.value)}
                  error={formErrors.revenue}
                  placeholder="48200"
                />
                <TextInput
                  id="cogs"
                  label="Cost of goods sold"
                  required
                  inputMode="decimal"
                  value={form.cogs}
                  onChange={(event) => updateField('cogs', event.target.value)}
                  error={formErrors.cogs}
                  placeholder="18500"
                />
                <TextInput
                  id="operating-expenses"
                  label="Operating expenses"
                  required
                  inputMode="decimal"
                  value={form.operatingExpenses}
                  onChange={(event) => updateField('operatingExpenses', event.target.value)}
                  error={formErrors.operatingExpenses}
                  placeholder="13000"
                />
                <TextInput
                  id="cash-on-hand"
                  label="Cash on hand"
                  required
                  inputMode="decimal"
                  value={form.cashOnHand}
                  onChange={(event) => updateField('cashOnHand', event.target.value)}
                  error={formErrors.cashOnHand}
                  placeholder="54000"
                />
              </div>

              <TextArea
                id="notes"
                label="Notes"
                optionalLabel="(optional)"
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                error={formErrors.notes}
                placeholder="Anything that explains this period — a one-off purchase, a price change…"
                maxLength={500}
              />

              <div className="flex flex-wrap gap-2">
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

          <Card className="h-fit p-5">
            <CardHeader
              title="Latest period"
              description={latestSummary ? latestSummary.periodLabel : 'No entries yet'}
            />
            {latestSummary ? (
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  { label: 'Net profit', value: formatCurrency(latestSummary.netProfit, currency) },
                  { label: 'Gross margin', value: formatPercent(latestSummary.grossMargin) },
                  { label: 'Net margin', value: formatPercent(latestSummary.netMargin) },
                  { label: 'Expense ratio', value: formatPercent(latestSummary.expenseRatio) },
                  {
                    label: 'Cash runway',
                    value:
                      latestSummary.cashRunwayMonths === null
                        ? 'Not burning cash'
                        : `${latestSummary.cashRunwayMonths} months`,
                  },
                  {
                    label: 'Revenue change',
                    value:
                      latestSummary.revenueChange === null
                        ? 'First period'
                        : formatSignedPercent(latestSummary.revenueChange),
                  },
                  {
                    label: 'Profit change',
                    value:
                      latestSummary.profitChange === null
                        ? 'First period'
                        : formatSignedPercent(latestSummary.profitChange),
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                    <dt className="text-body">{row.label}</dt>
                    <dd className="font-medium text-heading">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-body">
                Save your first entry to see calculated margins, runway and period-over-period change here.
              </p>
            )}
          </Card>
        </div>
      )}

      <Card>
        <div className="p-5">
          <CardHeader
            title="Financial entry history"
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
            description="Add your first period using the form above. Every calculation in BizWise starts here."
          />
        ) : null}

        {entries.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_auto] gap-3 border-y border-line bg-surface-muted/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-subtle sm:grid">
                <span>Period</span>
                <span className="text-right">Revenue</span>
                <span className="text-right">Net profit</span>
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
                        'grid grid-cols-1 gap-2 border-b border-line px-5 py-4 last:border-0 sm:grid-cols-[1.6fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-3',
                        editingId === entry.id && 'bg-brand-50/40 dark:bg-brand-900/20',
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-heading">{entry.periodLabel}</p>
                        <p className="text-xs text-subtle">
                          COGS {formatCurrency(entry.cogs, currency)} · Opex{' '}
                          {formatCurrency(entry.operatingExpenses, currency)}
                        </p>
                        {entry.notes ? (
                          <p className="mt-1 line-clamp-2 text-xs text-subtle">{entry.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex items-baseline justify-between gap-2 sm:block sm:text-right">
                        <span className="text-xs text-subtle sm:hidden">Revenue</span>
                        <span className="text-sm text-heading">{formatCurrency(entry.revenue, currency)}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2 sm:block sm:text-right">
                        <span className="text-xs text-subtle sm:hidden">Net profit</span>
                        <span
                          className={cn(
                            'text-sm font-medium',
                            metrics.netProfit >= 0
                              ? 'text-brand-800 dark:text-brand-200'
                              : 'text-red-600 dark:text-red-400',
                          )}
                        >
                          {formatCurrency(metrics.netProfit, currency)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2 sm:block sm:text-right">
                        <span className="text-xs text-subtle sm:hidden">Cash</span>
                        <span className="text-sm text-heading">{formatCurrency(entry.cashOnHand, currency)}</span>
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

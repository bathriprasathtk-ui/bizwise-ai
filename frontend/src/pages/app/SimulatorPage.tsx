import { ArrowRight, RefreshCw, Save, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button, buttonStyles } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState, LoadingState } from '../../components/ui/StateViews';
import { api } from '../../lib/api';
import { runSimulation } from '../../lib/finance';
import { formatCurrency, formatDate, formatPercent } from '../../lib/format';
import type { FinancialEntry, Scenario, SimulationInputs, SimulationResult } from '../../lib/types';

const clampPercent = (value: number): number => Math.max(-100, Math.min(300, Math.round(value)));

function SimulatorControl({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-heading">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            aria-label={`${label} percentage value`}
            value={value}
            onChange={(event) => onChange(clampPercent(Number(event.target.value)))}
            className="h-11 w-20 rounded-xl border border-line bg-surface px-2 text-right text-sm text-heading"
          />
          <span aria-hidden="true" className="text-sm text-subtle">
            %
          </span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={-50}
        max={50}
        step={1}
        value={Math.max(-50, Math.min(50, value))}
        aria-valuetext={`${value} percent`}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 h-11 w-full cursor-pointer accent-brand-700"
      />
      <p className="text-xs text-subtle">{hint}</p>
    </div>
  );
}

function scenarioProjectedProfit(results: Scenario['results']): number | null {
  const projected = (results as SimulationResult | null)?.projected;
  return projected && typeof projected.netProfit === 'number' ? projected.netProfit : null;
}

export function SimulatorPage() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [priceChange, setPriceChange] = useState(5);
  const [volumeChange, setVolumeChange] = useState(0);
  const [costChange, setCostChange] = useState(0);
  const [opexChange, setOpexChange] = useState(0);
  const [targetProfitInput, setTargetProfitInput] = useState('');

  const [scenarioName, setScenarioName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [serverResult, setServerResult] = useState<SimulationResult | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [business, history] = await Promise.all([api.getBusiness(), api.getScenarios()]);
      setEntries(business.entries);
      setCurrency(business.business.currency);
      setScenarios(history.scenarios);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'We could not load your simulator data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;

  const inputs = useMemo<SimulationInputs>(() => {
    const parsedTarget = targetProfitInput.trim() === '' ? null : Number(targetProfitInput);
    return {
      priceChange,
      volumeChange,
      costChange,
      opexChange,
      targetProfit: parsedTarget !== null && Number.isFinite(parsedTarget) ? parsedTarget : null,
    };
  }, [priceChange, volumeChange, costChange, opexChange, targetProfitInput]);

  const preview = latestEntry ? runSimulation(latestEntry, inputs, currency) : null;
  const result = serverResult ?? preview;

  function resetServerResult() {
    setServerResult(null);
    setSaveSuccess(null);
    setSaveError(null);
  }

  async function handleSave() {
    if (!latestEntry) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const response = await api.simulate({ ...inputs, name: scenarioName.trim(), save: true });
      setServerResult(response.result);
      if (response.scenario) setScenarios((current) => [response.scenario as Scenario, ...current]);
      setSaveSuccess(`Scenario “${scenarioName.trim()}” saved.`);
      setScenarioName('');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'We could not save this scenario.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteScenario(id: string) {
    setDeletingId(id);
    setSaveError(null);
    try {
      const response = await api.deleteScenario(id);
      setScenarios(response.scenarios);
      setSaveSuccess('Scenario deleted.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'We could not delete that scenario.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-subtle">Simulator</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-heading">What-if simulator</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-body">
          Projections start from your latest saved period. Move one assumption at a time to see which lever actually
          changes profit.
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

      {loading ? (
        <Card>
          <LoadingState label="Loading your latest numbers…" />
        </Card>
      ) : !latestEntry ? (
        <Card>
          <EmptyState
            icon={<SlidersHorizontal aria-hidden="true" className="h-5 w-5" />}
            title="Add financial data first"
            description="The simulator projects from your latest saved period, so it needs one entry to work with."
            action={
              <Link to="/app/business" className={buttonStyles()}>
                Add financial data
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <Card className="h-fit p-5">
              <CardHeader
                title="Assumptions"
                description={`Base period: ${latestEntry.periodLabel} · ${currency}`}
              />
              <div className="mt-5 space-y-5">
                <SimulatorControl
                  id="price-change"
                  label="Price change"
                  hint="Selling price per unit or service."
                  value={priceChange}
                  onChange={(next) => {
                    setPriceChange(next);
                    resetServerResult();
                  }}
                />
                <SimulatorControl
                  id="volume-change"
                  label="Sales volume change"
                  hint="Units sold. Scales revenue and cost of goods."
                  value={volumeChange}
                  onChange={(next) => {
                    setVolumeChange(next);
                    resetServerResult();
                  }}
                />
                <SimulatorControl
                  id="cost-change"
                  label="Cost change"
                  hint="Supplier or production cost per unit."
                  value={costChange}
                  onChange={(next) => {
                    setCostChange(next);
                    resetServerResult();
                  }}
                />
                <SimulatorControl
                  id="opex-change"
                  label="Operating expense change"
                  hint="Rent, salaries, software, marketing."
                  value={opexChange}
                  onChange={(next) => {
                    setOpexChange(next);
                    resetServerResult();
                  }}
                />

                <div>
                  <label htmlFor="target-profit" className="text-sm font-medium text-heading">
                    Target profit <span className="text-xs font-normal text-subtle">(optional)</span>
                  </label>
                  <input
                    id="target-profit"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={targetProfitInput}
                    onChange={(event) => {
                      setTargetProfitInput(event.target.value);
                      resetServerResult();
                    }}
                    placeholder="20000"
                    className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-heading placeholder:text-subtle"
                  />
                  <p className="mt-1 text-xs text-subtle">
                    Compare the projection against a profit number you want to reach.
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <CardHeader
                  title="Projected outcome"
                  description={
                    result
                      ? `Compared with ${formatCurrency(result.current.netProfit, currency)} profit in ${result.basePeriodLabel}.`
                      : undefined
                  }
                />
                {result ? (
                  <>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { label: 'Projected revenue', value: formatCurrency(result.projected.revenue, currency) },
                        { label: 'Projected expenses', value: formatCurrency(result.projected.expenses, currency) },
                        {
                          label: 'Projected net profit',
                          value: formatCurrency(result.projected.netProfit, currency),
                          emphasis: true,
                        },
                        { label: 'Projected profit margin', value: formatPercent(result.projected.netMargin) },
                        {
                          label: 'Difference from current profit',
                          value: `${result.differenceFromCurrent >= 0 ? '+' : '-'}${formatCurrency(
                            Math.abs(result.differenceFromCurrent),
                            currency,
                          )}`,
                          tone: result.differenceFromCurrent >= 0 ? 'positive' : 'negative',
                        },
                        {
                          label: 'Target profit',
                          value:
                            result.targetProfit === null
                              ? 'Not set'
                              : result.targetAchieved
                                ? 'On track'
                                : `Short by ${formatCurrency(Math.abs(result.targetGap ?? 0), currency)}`,
                          tone: result.targetProfit === null ? undefined : result.targetAchieved ? 'positive' : 'negative',
                        },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-line bg-surface-muted/60 p-3">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-subtle">{item.label}</dt>
                          <dd
                            className={
                              item.label === 'Projected net profit'
                                ? 'mt-1 text-lg font-semibold text-brand-800 dark:text-brand-200'
                                : item.tone === 'negative'
                                  ? 'mt-1 text-sm font-semibold text-red-600 dark:text-red-400'
                                  : item.tone === 'positive'
                                    ? 'mt-1 text-sm font-semibold text-brand-800 dark:text-brand-200'
                                    : 'mt-1 text-sm font-semibold text-heading'
                            }
                          >
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/70 p-4 dark:border-brand-800 dark:bg-brand-900/25">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-800 dark:text-brand-200">
                        Recommended action
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-brand-900 dark:text-brand-50">
                        {result.recommendedAction}
                      </p>
                    </div>
                  </>
                ) : null}
              </Card>

              <Card className="p-5">
                <CardHeader title="Save this scenario" description="Keep the assumptions for later comparison." />
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label htmlFor="scenario-name" className="text-sm font-medium text-heading">
                      Scenario name
                    </label>
                    <input
                      id="scenario-name"
                      value={scenarioName}
                      onChange={(event) => setScenarioName(event.target.value)}
                      maxLength={80}
                      placeholder="Raise prices 5% in spring"
                      className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-heading placeholder:text-subtle"
                    />
                  </div>
                  <Button onClick={() => void handleSave()} loading={saving} disabled={scenarioName.trim().length === 0}>
                    <Save aria-hidden="true" className="h-4 w-4" />
                    Save scenario
                  </Button>
                </div>
                {saveError ? (
                  <Alert tone="error" className="mt-3">
                    {saveError}
                  </Alert>
                ) : null}
                {saveSuccess ? (
                  <Alert tone="success" className="mt-3">
                    {saveSuccess}
                  </Alert>
                ) : null}
              </Card>
            </div>
          </div>

          <Card>
            <div className="p-5">
              <CardHeader
                title="Saved scenarios"
                description={
                  scenarios.length > 0
                    ? 'Only you can see and delete these.'
                    : 'Scenarios you save will appear here.'
                }
              />
            </div>
            {scenarios.length === 0 ? (
              <EmptyState
                icon={<Save aria-hidden="true" className="h-5 w-5" />}
                title="No saved scenarios"
                description="Name a scenario and save it to keep the assumptions and projected profit."
              />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {scenarios.map((scenario) => {
                  const projectedProfit = scenarioProjectedProfit(scenario.results);
                  return (
                    <li key={scenario.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-heading">{scenario.name}</p>
                        <p className="mt-0.5 text-xs text-subtle">
                          {formatDate(scenario.createdAt)} · price {scenario.inputs.priceChange}% · volume{' '}
                          {scenario.inputs.volumeChange}% · cost {scenario.inputs.costChange}% · opex{' '}
                          {scenario.inputs.opexChange}%
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {projectedProfit !== null ? (
                          <span className="text-sm font-medium text-heading">
                            {formatCurrency(projectedProfit, currency)}
                          </span>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={deletingId === scenario.id}
                          onClick={() => void handleDeleteScenario(scenario.id)}
                          aria-label={`Delete scenario ${scenario.name}`}
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

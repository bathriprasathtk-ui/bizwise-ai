import { Building2, KeyRound, LogOut, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { SelectInput, TextInput } from '../../components/ui/Field';
import { LoadingState } from '../../components/ui/StateViews';
import { ThemeSegmentedControl } from '../../components/ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Business } from '../../lib/types';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED', 'ZAR', 'JPY', 'NZD', 'CHF'];

export function SettingsPage() {
  const { user, requestPasswordReset, signOut } = useAuth();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [resetSending, setResetSending] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await api.getBusiness();
      setBusiness(response.business);
      setName(response.business.name);
      setCurrency(response.business.currency);
      setDirty(false);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'We could not load your settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setNameError('Business name is required.');
      return;
    }
    if (trimmed.length > 120) {
      setNameError('Keep the business name under 120 characters.');
      return;
    }
    setNameError(undefined);
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const response = await api.updateBusiness({ name: trimmed, currency });
      setBusiness(response.business);
      setName(response.business.name);
      setCurrency(response.business.currency);
      setDirty(false);
      setSaveSuccess('Business profile saved. Your dashboard, reports and copilot now use it.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'We could not save your settings.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    setResetSending(true);
    setResetMessage(null);
    setResetError(null);
    try {
      await requestPasswordReset(user.email);
      setResetMessage(`Password reset link sent to ${user.email}. Check your inbox.`);
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'We could not send the reset email.');
    } finally {
      setResetSending(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'We could not sign you out.');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Settings</p>
        <h1 className="mt-1.5 text-[26px] leading-tight sm:text-[30px]">Business and account</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-body">
          How your business is presented across the workspace, plus the security and appearance of your account.
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
          <LoadingState label="Loading settings…" />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <Card className="p-5 sm:p-6">
            <CardHeader
              eyebrow="Profile"
              title="Business profile"
              description="The name greets you on the dashboard; the currency formats every amount."
              action={
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  <Building2 aria-hidden="true" className="h-4 w-4" />
                </span>
              }
            />

            {saveSuccess ? (
              <Alert tone="success" className="mt-4">
                {saveSuccess}
              </Alert>
            ) : null}
            {saveError ? (
              <Alert tone="error" className="mt-4">
                {saveError}
              </Alert>
            ) : null}

            <form onSubmit={handleSave} noValidate className="mt-5 space-y-4">
              <TextInput
                id="business-name"
                label="Business name"
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameError(undefined);
                  setSaveSuccess(null);
                  setDirty(true);
                }}
                error={nameError}
                maxLength={120}
                hint="Use the name your customers know — it appears in the dashboard greeting."
              />
              <SelectInput
                id="business-currency"
                label="Reporting currency"
                value={currency}
                onChange={(event) => {
                  setCurrency(event.target.value);
                  setSaveSuccess(null);
                  setDirty(true);
                }}
                hint="Used for every amount, chart and simulation. Changing it does not convert historical numbers."
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </SelectInput>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" loading={saving} disabled={!dirty && !saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
                {dirty ? <span className="text-xs text-attention">Unsaved changes</span> : null}
              </div>

              {business ? (
                <p className="text-xs text-subtle">Last updated {new Date(business.updatedAt).toLocaleString('en-US')}</p>
              ) : null}
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
              <CardHeader
                eyebrow="Appearance"
                title="Theme"
                description="Follow your system, or pin the workspace to light or dark."
              />
              <div className="mt-4">
                <ThemeSegmentedControl />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-subtle">
                The choice is stored in this browser and applied before the page paints.
              </p>
            </Card>

            <Card className="p-5 sm:p-6">
              <CardHeader
                eyebrow="Account"
                title="Sign-in and security"
                action={
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-subtle">
                    <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                  </span>
                }
              />

              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-surface-muted/60 p-3.5">
                <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-subtle">Signed in as</p>
                  <p className="truncate text-sm font-medium text-heading" title={user?.email ?? undefined}>
                    {user?.email ?? '—'}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <Button variant="secondary" onClick={() => void handlePasswordReset()} loading={resetSending}>
                  <KeyRound aria-hidden="true" className="h-4 w-4" />
                  Send password reset email
                </Button>
                <p className="text-xs leading-relaxed text-subtle">
                  We email a one-time link that expires shortly. Your current password keeps working until you use it.
                </p>
                {resetMessage ? <Alert tone="success">{resetMessage}</Alert> : null}
                {resetError ? <Alert tone="error">{resetError}</Alert> : null}
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <Button variant="ghost" onClick={() => void handleLogout()} loading={loggingOut}>
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  Log out
                </Button>
                {logoutError ? (
                  <Alert tone="error" className="mt-3">
                    {logoutError}
                  </Alert>
                ) : null}
              </div>

              {user?.id ? (
                <details className="mt-4 border-t border-line pt-3">
                  <summary className="cursor-pointer text-[11px] font-medium text-subtle">Technical details</summary>
                  <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-subtle">Account ID: {user.id}</p>
                </details>
              ) : null}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

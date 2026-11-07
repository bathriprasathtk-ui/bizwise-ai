import { KeyRound, LogOut, Moon, RefreshCw, Sun } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { SelectInput, TextInput } from '../../components/ui/Field';
import { LoadingState } from '../../components/ui/StateViews';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import { cn } from '../../lib/cn';
import type { Business } from '../../lib/types';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED', 'ZAR', 'JPY', 'NZD', 'CHF'];

export function SettingsPage() {
  const { user, requestPasswordReset, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      setSaveSuccess('Settings saved.');
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
      setResetMessage(`Password reset link sent to ${user.email}.`);
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
        <p className="text-xs font-medium uppercase tracking-wide text-subtle">Settings</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-heading">Business and account</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-body">
          Update how your business appears across the dashboard, reports and advisor.
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
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <CardHeader title="Business profile" description="Shown on your dashboard and used for all amounts." />
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
            <form onSubmit={handleSave} noValidate className="mt-4 space-y-4">
              <TextInput
                id="business-name"
                label="Business name"
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameError(undefined);
                  setSaveSuccess(null);
                }}
                error={nameError}
                maxLength={120}
              />
              <SelectInput
                id="business-currency"
                label="Default currency"
                value={currency}
                onChange={(event) => {
                  setCurrency(event.target.value);
                  setSaveSuccess(null);
                }}
                hint="Used for every amount in the dashboard, reports and simulations."
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </SelectInput>
              <Button type="submit" loading={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              {business ? (
                <p className="text-xs text-subtle">
                  Last updated {new Date(business.updatedAt).toLocaleString('en-US')}
                </p>
              ) : null}
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <CardHeader title="Account" description="Sign-in details for this session." />
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                  <dt className="text-body">Email</dt>
                  <dd className="font-medium text-heading">{user?.email ?? '—'}</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="text-body">User ID</dt>
                  <dd className="max-w-[60%] truncate font-mono text-xs text-subtle">{user?.id ?? '—'}</dd>
                </div>
              </dl>

              <div className="mt-4 space-y-3">
                <Button variant="secondary" onClick={() => void handlePasswordReset()} loading={resetSending}>
                  <KeyRound aria-hidden="true" className="h-4 w-4" />
                  Send password reset email
                </Button>
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
            </Card>

            <Card className="p-5">
              <CardHeader title="Appearance" description="Dark mode applies to this browser." />
              <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-line bg-surface-muted/60 p-4">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon aria-hidden="true" className="h-4 w-4 text-brand-700 dark:text-brand-300" />
                  ) : (
                    <Sun aria-hidden="true" className="h-4 w-4 text-brand-700 dark:text-brand-300" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-heading">Dark mode</p>
                    <p className="text-xs text-subtle">Currently {theme === 'dark' ? 'on' : 'off'}.</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={theme === 'dark'}
                  aria-label="Dark mode"
                  onClick={toggleTheme}
                  className={cn(
                    'relative inline-flex h-11 w-[60px] shrink-0 items-center rounded-full border transition-colors',
                    theme === 'dark' ? 'border-brand-700 bg-brand-700' : 'border-line bg-surface',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform',
                      theme === 'dark' ? 'translate-x-[26px]' : 'translate-x-1.5',
                    )}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

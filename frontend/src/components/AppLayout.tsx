import {
  FileText,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Settings,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';
import { BrandMark } from './BrandMark';
import { Button } from './ui/Button';
import { ThemeIconButton } from './ui/ThemeToggle';

const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'Command center' },
  { to: '/app/business', label: 'Business Analysis', icon: LineChart, hint: 'Financial entries' },
  { to: '/app/advisor', label: 'AI Advisor', icon: Sparkles, hint: 'Business copilot' },
  { to: '/app/simulator', label: 'Simulator', icon: SlidersHorizontal, hint: 'What-if scenarios' },
  { to: '/app/reports', label: 'Reports', icon: FileText, hint: 'Performance' },
  { to: '/app/settings', label: 'Settings', icon: Settings, hint: 'Business & account' },
];

function navLinkClasses(isActive: boolean, tone: 'sidebar' | 'sheet'): string {
  return cn(
    'group relative flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
    tone === 'sidebar'
      ? isActive
        ? 'bg-white/10 text-white'
        : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
      : isActive
        ? 'bg-brand-50 text-brand-900 dark:bg-brand-900/40 dark:text-brand-50'
        : 'text-body hover:bg-surface-muted hover:text-heading',
  );
}

function NavItems({ tone, onNavigate }: { tone: 'sidebar' | 'sheet'; onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) => navLinkClasses(isActive, tone)}
        >
          {({ isActive }) => (
            <>
              {tone === 'sidebar' ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-300 transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
              ) : null}
              <item.icon
                aria-hidden="true"
                className={cn(
                  'h-[18px] w-[18px] shrink-0',
                  tone === 'sidebar' ? (isActive ? 'text-brand-300' : 'text-white/50') : '',
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {tone === 'sheet' ? <span className="text-[11px] text-subtle">{item.hint}</span> : null}
            </>
          )}
        </NavLink>
      ))}
    </>
  );
}

function AccountBlock({
  email,
  onLogout,
  loggingOut,
  logoutError,
  tone,
}: {
  email?: string;
  onLogout: () => void;
  loggingOut: boolean;
  logoutError: string | null;
  tone: 'sidebar' | 'sheet';
}) {
  const initials = (email ?? 'BZ').slice(0, 2).toUpperCase();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
            tone === 'sidebar' ? 'bg-white/10 text-white' : 'bg-brand-50 text-brand-800 dark:bg-brand-900/40',
          )}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className={cn('truncate text-xs font-medium', tone === 'sidebar' ? 'text-white/80' : 'text-heading')} title={email}>
            {email ?? 'Signed in'}
          </p>
          <p className={cn('text-[11px]', tone === 'sidebar' ? 'text-white/45' : 'text-subtle')}>Founder workspace</p>
        </div>
      </div>
      {logoutError ? (
        <p role="alert" className={cn('text-xs', tone === 'sidebar' ? 'text-rose-200' : 'text-risk')}>
          {logoutError}
        </p>
      ) : null}
      <Button
        variant={tone === 'sidebar' ? 'inverse' : 'ghost'}
        className="w-full justify-start"
        onClick={onLogout}
        loading={loggingOut}
      >
        <LogOut aria-hidden="true" className="h-[18px] w-[18px]" />
        Logout
      </Button>
    </div>
  );
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'We could not sign you out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-heading focus:shadow-lift"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col bg-gradient-to-b from-ink-900 via-ink-900 to-ink-950 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top_left,rgba(20,160,140,0.22),transparent_65%)]"
        />
        <div className="relative px-5 pb-5 pt-6">
          <BrandMark to="/app/dashboard" tone="inverse" />
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-eyebrow text-white/35">
            Founder workspace
          </p>
        </div>

        <nav aria-label="Main navigation" className="relative flex-1 space-y-1 overflow-y-auto px-3">
          <NavItems tone="sidebar" />
        </nav>

        <div className="relative border-t border-white/10 px-4 py-4">
          <div className="mb-3 flex items-center justify-between rounded-xl bg-white/[0.04] px-2 py-1.5">
            <span className="pl-1 text-[11px] font-medium text-white/55">Appearance</span>
            <ThemeIconButton tone="inverse" className="h-9 w-9" />
          </div>
          <AccountBlock
            email={user?.email}
            onLogout={handleLogout}
            loggingOut={loggingOut}
            logoutError={logoutError}
            tone="sidebar"
          />
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-page/85 px-4 py-3 backdrop-blur lg:hidden">
          <BrandMark to="/app/dashboard" />
          <div className="flex items-center gap-2">
            <ThemeIconButton />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label="Open navigation menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-heading ring-1 ring-[color:var(--color-line)] hover:bg-surface-muted"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-content px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          <Outlet />
        </main>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" aria-hidden="true" onClick={() => setMenuOpen(false)} />
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-surface shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <BrandMark to="/app/dashboard" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-heading ring-1 ring-[color:var(--color-line)] hover:bg-surface-muted"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
              <NavItems tone="sheet" onNavigate={() => setMenuOpen(false)} />
            </nav>
            <div className="border-t border-line px-4 py-4">
              <AccountBlock
                email={user?.email}
                onLogout={handleLogout}
                loggingOut={loggingOut}
                logoutError={logoutError}
                tone="sheet"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

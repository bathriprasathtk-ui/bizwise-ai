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

const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/business', label: 'Business Analysis', icon: LineChart },
  { to: '/app/advisor', label: 'AI Advisor', icon: Sparkles },
  { to: '/app/simulator', label: 'Simulator', icon: SlidersHorizontal },
  { to: '/app/reports', label: 'Reports', icon: FileText },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

function navLinkClasses(isActive: boolean): string {
  return cn(
    'flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100'
      : 'text-body hover:bg-surface-muted hover:text-heading',
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
    <div className="min-h-screen bg-page">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-heading focus:shadow-lift"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-[264px] flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 py-6">
          <BrandMark to="/app/dashboard" />
        </div>
        <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClasses(isActive)}>
              <item.icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line px-3 py-4">
          {user?.email ? (
            <p className="mb-2 truncate px-3 text-xs text-subtle" title={user.email}>
              {user.email}
            </p>
          ) : null}
          {logoutError ? (
            <p role="alert" className="mb-2 px-3 text-xs text-red-600 dark:text-red-400">
              {logoutError}
            </p>
          ) : null}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
            loading={loggingOut}
          >
            <LogOut aria-hidden="true" className="h-[18px] w-[18px]" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
          <BrandMark to="/app/dashboard" />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Open navigation menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-heading hover:bg-surface-muted"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-content px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col border-l border-line bg-surface shadow-lift"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <BrandMark to="/app/dashboard" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-heading hover:bg-surface-muted"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClasses(isActive)}>
                  <item.icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-line px-3 py-4">
              {user?.email ? (
                <p className="mb-2 truncate px-3 text-xs text-subtle" title={user.email}>
                  {user.email}
                </p>
              ) : null}
              {logoutError ? (
                <p role="alert" className="mb-2 px-3 text-xs text-red-600 dark:text-red-400">
                  {logoutError}
                </p>
              ) : null}
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout} loading={loggingOut}>
                <LogOut aria-hidden="true" className="h-[18px] w-[18px]" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

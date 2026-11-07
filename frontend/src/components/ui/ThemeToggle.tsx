import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeMode } from '../../context/ThemeContext';
import { cn } from '../../lib/cn';

const OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: 'light', label: 'Light', Icon: Sun },
  { mode: 'dark', label: 'Dark', Icon: Moon },
  { mode: 'system', label: 'System', Icon: Monitor },
];

/** Compact icon control for the top bar. Cycles light → dark → system. */
export function ThemeIconButton({ className, tone = 'default' }: { className?: string; tone?: 'default' | 'inverse' }) {
  const { mode, theme, setMode } = useTheme();
  const next: ThemeMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
  const Icon = mode === 'dark' ? Moon : mode === 'system' ? Monitor : Sun;

  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      aria-label={`Theme: ${mode === 'system' ? 'follows your system' : mode}. Switch to ${next}.`}
      title={`Appearance: ${mode}`}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
        tone === 'inverse'
          ? 'text-white/70 hover:bg-white/10 hover:text-white'
          : 'text-body ring-1 ring-[color:var(--color-line)] hover:bg-surface-muted hover:text-heading',
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
      <span className="sr-only">
        Current theme: {theme}. Press to switch to {next}.
      </span>
    </button>
  );
}

/** Full segmented control used in Settings. */
export function ThemeSegmentedControl({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference"
      className={cn(
        'grid grid-cols-3 gap-1 rounded-xl bg-surface-muted p-1 ring-1 ring-[color:var(--color-line)]',
        className,
      )}
    >
      {OPTIONS.map(({ mode: option, label, Icon }) => {
        const selected = mode === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setMode(option)}
            className={cn(
              'flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
              selected ? 'bg-surface text-heading shadow-soft' : 'text-body hover:text-heading',
            )}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

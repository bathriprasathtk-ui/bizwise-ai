import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';

function Glyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className="h-[18px] w-[18px]" fill="none">
      <path
        d="M6 26.5 14 18l6.5 6.5L34 9"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M25 9h9v9" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BrandMark({
  className,
  to = '/',
  tone = 'default',
}: {
  className?: string;
  to?: string;
  tone?: 'default' | 'inverse';
}) {
  return (
    <Link
      to={to}
      className={cn('inline-flex min-h-[44px] items-center gap-2.5 rounded-xl', className)}
      aria-label="BizWise AI home"
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-[11px] shadow-soft',
          tone === 'inverse'
            ? 'bg-gradient-to-br from-brand-400 to-brand-700 text-ink-950'
            : 'bg-gradient-to-br from-brand-700 to-brand-900 text-white',
        )}
      >
        <Glyph />
      </span>
      <span
        className={cn(
          'text-[15px] font-semibold tracking-tight',
          tone === 'inverse' ? 'text-white' : 'text-heading',
        )}
      >
        BizWise <span className={tone === 'inverse' ? 'text-brand-300' : 'text-brand-700'}>AI</span>
      </span>
    </Link>
  );
}

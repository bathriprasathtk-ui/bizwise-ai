import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';

export function BrandMark({ className, to = '/' }: { className?: string; to?: string }) {
  return (
    <Link
      to={to}
      className={cn('inline-flex items-center gap-2.5 rounded-xl', className)}
      aria-label="BizWise AI home"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-soft">
        <TrendingUp aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-heading">BizWise AI</span>
    </Link>
  );
}

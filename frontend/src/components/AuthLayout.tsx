import { ArrowLeft, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { Card } from './ui/Card';

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <BrandMark />
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-body hover:bg-surface-muted hover:text-heading"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">
            <Card className="p-6 sm:p-8">
              <h1 className="text-xl font-semibold tracking-tight text-heading sm:text-2xl">{title}</h1>
              {description ? <p className="mt-2 text-sm leading-relaxed text-body">{description}</p> : null}
              <div className="mt-6">{children}</div>
            </Card>

            <div className="mt-5 flex items-start gap-2 px-1 text-xs leading-relaxed text-subtle">
              <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />
              <p>Your financial data is private to your account and protected by row level security.</p>
            </div>

            {footer ? <div className="mt-6 text-center text-sm text-body">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

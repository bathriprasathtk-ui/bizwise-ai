import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Gauge,
  Lightbulb,
  Lock,
  MessageSquare,
  PenLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../../components/BrandMark';
import { buttonStyles } from '../../components/ui/Button';
import { DashboardPreview } from './DashboardPreview';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#advisor', label: 'AI Advisor' },
  { href: '#simulator', label: 'Simulator' },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Business Dashboard',
    description: 'Revenue, profit, cash and margin in one calm view that updates as soon as you save a period.',
  },
  {
    icon: Sparkles,
    title: 'AI Advisor',
    description: 'Ask questions in plain English and get answers grounded in the numbers you actually recorded.',
  },
  {
    icon: Lightbulb,
    title: 'Smart Insights',
    description: 'An automatic read of margins, cost control and runway so you know what to fix first.',
  },
  {
    icon: SlidersHorizontal,
    title: 'What-if Simulator',
    description: 'Move price, volume, cost and expenses to see projected profit before you commit to a change.',
  },
  {
    icon: ShieldCheck,
    title: 'Private Data',
    description: 'Real accounts with row level security: every entry is scoped to the person who saved it.',
  },
  {
    icon: TrendingUp,
    title: 'Track Over Time',
    description: 'Period-by-period history shows whether your changes actually moved revenue and profit.',
  },
];

const STEPS = [
  {
    icon: PenLine,
    title: 'Enter your numbers',
    description:
      'Record revenue, cost of goods sold, operating expenses and cash on hand for a period. Five fields, no spreadsheet.',
  },
  {
    icon: Gauge,
    title: 'See your health score',
    description:
      'BizWise calculates margins, runway and period-over-period change, then scores the business out of 100.',
  },
  {
    icon: MessageSquare,
    title: 'Get grounded advice',
    description:
      'Ask the advisor what to improve. It sees your real figures, so the recommendation names the number to change.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <BrandMark />
          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-body transition-colors hover:bg-surface-muted hover:text-heading"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
              Log in
            </Link>
            <Link to="/signup" className={buttonStyles({ size: 'sm' })}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-line">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.02fr_1fr] lg:items-center lg:gap-12 lg:px-8 lg:py-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-brand-800 dark:text-brand-200">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                Built for small-business owners
              </p>
              <h1 className="mt-5 text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-heading sm:text-5xl lg:text-[3.4rem]">
                Make smarter business decisions with AI.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-body sm:text-lg">
                BizWise AI turns your business numbers into clear insights, practical recommendations, and smarter
                financial decisions.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/signup" className={buttonStyles({ size: 'lg' })}>
                  Get Started Free
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <a href="#preview" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
                  Explore Demo
                </a>
              </div>
              <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-body">
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-brand-700 dark:text-brand-300" />
                  Free to start
                </li>
                <li className="inline-flex items-center gap-2">
                  <Lock aria-hidden="true" className="h-4 w-4 text-brand-700 dark:text-brand-300" />
                  Private by default
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-brand-700 dark:text-brand-300" />
                  No spreadsheets to maintain
                </li>
              </ul>
            </div>
            <div id="preview" className="scroll-mt-24">
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 border-b border-line py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                Features
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Everything you need to understand the numbers.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-body">
                No accounting jargon and no dashboards you have to assemble yourself. Record a period, and the
                analysis follows.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                    <feature.icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-heading">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-body">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-b border-line bg-surface py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                How it works
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Three steps, about two minutes a month.
              </h2>
            </div>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-line bg-page p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
                      <step.icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-subtle">0{index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-heading">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-body">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="advisor" className="scroll-mt-20 border-b border-line py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                AI Advisor
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Advice that knows your actual numbers.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-body">
                Generic AI answers are not useful when it does not know your revenue, margins or cash position.
                BizWise sends your saved financial context from the server to the advisor, so every answer refers to
                real figures — and if the data is missing, it tells you what to record.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-body">
                <li className="flex gap-3">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />
                  Your Gemini key stays on the backend. The browser never sees it.
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />
                  Conversations are stored in your account so you can pick them up later.
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />
                  Suggested questions cover performance, margin and what to improve this month.
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft sm:p-5">
              <p className="text-xs font-medium text-subtle">Illustrative conversation</p>
              <div className="mt-3 space-y-3">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand-700 px-3.5 py-2.5 text-sm text-white">
                  How is my business performing?
                </div>
                <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-page px-3.5 py-3 text-sm leading-relaxed text-body">
                  Revenue is $48,200, up 4.2% on the previous period, and net margin holds at 12.4%. The constraint is
                  cost control: operating expenses are 26% of revenue, well above the 20% you would expect for a
                  business at this size. Trimming $1,200 from monthly expenses would lift net profit to about $17,900
                  without touching prices.
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand-700 px-3.5 py-2.5 text-sm text-white">
                  What happens if revenue drops by 10%?
                </div>
                <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-page px-3.5 py-3 text-sm leading-relaxed text-body">
                  With costs unchanged, a 10% revenue drop takes profit from $16,700 to roughly $11,900 — a 29% fall.
                  Your simulator would show the same result; try it before deciding how much buffer you need.
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-subtle">
                Sample exchange for a fictional business, shown for illustration only.
              </p>
            </div>
          </div>
        </section>

        <section id="simulator" className="scroll-mt-20 border-b border-line bg-surface py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div className="order-2 rounded-2xl border border-line bg-page p-4 shadow-soft sm:p-5 lg:order-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-subtle">Illustrative scenario</p>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-100">
                  Sample
                </span>
              </div>
              <dl className="mt-3 space-y-2.5">
                {[
                  { label: 'Price change', value: '+5%' },
                  { label: 'Sales volume change', value: '-2%' },
                  { label: 'Cost of goods change', value: '-3%' },
                  { label: 'Operating expense change', value: '-4%' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
                    <dt className="text-sm text-body">{row.label}</dt>
                    <dd className="text-sm font-semibold text-heading">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-line bg-surface p-3">
                  <p className="text-[11px] uppercase tracking-wide text-subtle">Projected profit</p>
                  <p className="mt-1 text-lg font-semibold text-brand-800 dark:text-brand-200">$18,240</p>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3">
                  <p className="text-[11px] uppercase tracking-wide text-subtle">Difference</p>
                  <p className="mt-1 text-lg font-semibold text-heading">+$1,540</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                What-if Simulator
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Test a decision before it costs you.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-body">
                Raise prices, lose a little volume, negotiate a better supplier price — see the projected revenue,
                expenses, profit and margin for each combination. Save the scenarios that are worth revisiting.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-body">
                The simulator always starts from your latest saved period, so the projection is tied to numbers you
                recorded, not to a template.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-brand-800 bg-brand-900 px-6 py-10 text-center sm:px-10 sm:py-14">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Know your numbers. Make the next move with confidence.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-100 sm:text-base">
                Set up your business, add one period of numbers, and let BizWise show you where the profit is.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className={buttonStyles({
                    size: 'lg',
                    className: 'bg-white text-brand-900 hover:bg-brand-50',
                  })}
                >
                  Create your free account
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className={buttonStyles({
                    variant: 'secondary',
                    size: 'lg',
                    className: 'border-brand-700 bg-transparent text-white hover:bg-brand-800',
                  })}
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <BrandMark />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-body">
                AI-powered financial clarity for small-business owners who would rather run the business than
                build another spreadsheet.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">Product</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="rounded text-body hover:text-heading hover:underline">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">Account</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link to="/login" className="rounded text-body hover:text-heading hover:underline">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="rounded text-body hover:text-heading hover:underline">
                    Get started
                  </Link>
                </li>
                <li>
                  <Link to="/forgot-password" className="rounded text-body hover:text-heading hover:underline">
                    Reset password
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">Security</h3>
              <p className="mt-3 text-sm leading-relaxed text-body">
                Each account only reaches its own rows, enforced in the database with row level security. Encryption
                keys and the AI provider key stay server-side.
              </p>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} BizWise AI. All rights reserved.</p>
            <p>Illustrative figures on this page are sample data, not customer results.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

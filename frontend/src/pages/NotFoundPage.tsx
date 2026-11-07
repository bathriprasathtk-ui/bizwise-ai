import { Link } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { buttonStyles } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-page px-4 py-8 sm:px-6">
      <BrandMark />
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-700 dark:text-brand-300">404</p>
          <h1 className="mt-2 text-2xl font-semibold text-heading">We could not find that page</h1>
          <p className="mt-2 text-sm leading-relaxed text-body">
            The link may be out of date. Head back to the dashboard or return to the marketing site.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/app/dashboard" className={buttonStyles()}>
              Go to dashboard
            </Link>
            <Link to="/" className={buttonStyles({ variant: 'secondary' })}>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

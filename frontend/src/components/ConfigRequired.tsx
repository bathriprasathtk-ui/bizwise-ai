import { Settings2 } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { Card } from './ui/Card';

const VARIABLES = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_API_BASE_URL'];

export function ConfigRequired() {
  return (
    <div className="min-h-screen bg-page px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-xl">
        <BrandMark />
        <Card className="mt-8 p-6 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
            <Settings2 aria-hidden="true" className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-heading">Configuration needed</h1>
          <p className="mt-2 text-sm leading-relaxed text-body">
            This deployment is missing its environment variables, so sign-in and saving data cannot work yet.
            Add the following values in Vercel (or in <code className="rounded bg-surface-muted px-1">frontend/.env</code>{' '}
            for local development) and redeploy.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {VARIABLES.map((name) => (
              <li key={name} className="rounded-xl border border-line bg-surface-muted px-3 py-2 font-mono text-xs text-heading">
                {name}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-subtle">
            Use only the Supabase anon/publishable key in the frontend. The service role key and the Gemini key
            belong to the backend project.
          </p>
        </Card>
      </div>
    </div>
  );
}

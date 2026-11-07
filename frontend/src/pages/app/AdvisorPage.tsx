import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  Lock,
  RefreshCw,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button, buttonStyles } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState, LoadingState, Spinner } from '../../components/ui/StateViews';
import { api, ApiError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../lib/format';
import type { BusinessResponse, ChatMessage } from '../../lib/types';

/** The model is asked for plain text; strip stray emphasis markers anyway. */
function plainText(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '');
}

const SUGGESTIONS = [
  'What should I focus on this week?',
  'What is hurting my profit margin?',
  'How can I improve my cash runway?',
  'What happens if sales fall by 10%?',
  'What is my biggest growth opportunity?',
];

export function AdvisorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [aiMissing, setAiMissing] = useState(false);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const [noFinancialData, setNoFinancialData] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessResponse | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const response = await api.getChat();
      setMessages(response.messages);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'We could not load your conversation history.');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Read-only context for the grounding panel. Failure here must not hide chat.
  useEffect(() => {
    let cancelled = false;
    api
      .getBusiness()
      .then((response) => {
        if (cancelled) return;
        setBusinessData(response);
        if (response.entries.length === 0) setNoFinancialData(true);
      })
      .catch(() => {
        /* The grounding panel simply stays in its unknown state. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, sending]);

  const send = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (question.length === 0 || sending || noFinancialData) return;

      const optimisticId = `pending-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        role: 'user',
        content: question,
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => [...current, optimistic]);
      setInput('');
      setSending(true);
      setSendError(null);
      setLastFailed(null);

      try {
        const response = await api.sendChat(question);
        setMessages((current) => [
          ...current.filter((message) => message.id !== optimisticId),
          response.userMessage,
          response.assistantMessage,
        ]);
        setAiMissing(false);
      } catch (error) {
        setMessages((current) => current.filter((message) => message.id !== optimisticId));
        setInput(question);
        setLastFailed(question);
        if (error instanceof ApiError) {
          if (error.code === 'NO_FINANCIAL_DATA') setNoFinancialData(true);
          if (error.code === 'AI_NOT_CONFIGURED') setAiMissing(true);
        }
        setSendError(error instanceof Error ? error.message : 'The copilot could not answer. Please try again.');
      } finally {
        setSending(false);
      }
    },
    [noFinancialData, sending],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send(input);
    }
  }

  const summary = businessData?.summary ?? null;
  const currency = businessData?.business.currency ?? 'USD';
  const entryCount = businessData?.entries.length ?? 0;
  const grounded = entryCount > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">AI advisor</p>
          <h1 className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[26px] leading-tight sm:text-[30px]">
            Business Copilot
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-eyebrow text-brand-800 dark:bg-brand-900/40 dark:text-brand-100">
              <Sparkles aria-hidden="true" className="h-3 w-3" />
              Gemini
            </span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-body">
            A second opinion on your numbers — grounded in the periods you saved, answered on the server, and never
            shared with another business.
          </p>
        </div>
      </header>

      {noFinancialData ? (
        <Alert tone="warning">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              The copilot needs at least one saved period before it can ground its advice in real numbers.
            </span>
            <Link to="/app/business" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
              Add financial data
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex min-h-[560px] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white">
                <Bot aria-hidden="true" className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-sm font-semibold text-heading">Copilot session</p>
                <p className="text-[11px] text-subtle">History saved to your account</p>
              </div>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
                grounded
                  ? 'bg-brand-50 text-positive dark:bg-brand-900/40'
                  : 'bg-surface-muted text-subtle',
              )}
            >
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-1.5 rounded-full', grounded ? 'bg-positive' : 'bg-subtle')}
              />
              {grounded ? `Using ${entryCount} saved ${entryCount === 1 ? 'period' : 'periods'}` : 'No data yet'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:max-h-[54vh] sm:px-5">
            {loadingHistory ? (
              <LoadingState label="Loading your conversation…" />
            ) : historyError ? (
              <Alert tone="error">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>{historyError}</span>
                  <Button variant="secondary" size="sm" onClick={() => void loadHistory()}>
                    <RefreshCw aria-hidden="true" className="h-4 w-4" />
                    Retry
                  </Button>
                </div>
              </Alert>
            ) : messages.length === 0 ? (
              <EmptyState
                icon={<Sparkles aria-hidden="true" className="h-5 w-5" />}
                title="Ask your first question"
                description={
                  grounded
                    ? 'Start with one of the prompts below, or ask anything about margins, costs, pricing or cash.'
                    : 'Save a financial period first, then come back and ask about it.'
                }
              />
            ) : (
              <ul className="space-y-4">
                {messages.map((message) => (
                  <li key={message.id} className={cn('flex gap-2.5', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {message.role === 'assistant' ? (
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                        <Bot aria-hidden="true" className="h-4 w-4" />
                      </span>
                    ) : null}
                    <div
                      className={cn(
                        'max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%]',
                        message.role === 'user'
                          ? 'rounded-br-md bg-brand-700 text-white'
                          : 'rounded-bl-md bg-surface-muted text-body ring-1 ring-[color:var(--color-line)]',
                      )}
                    >
                      <span className="sr-only">{message.role === 'user' ? 'You said: ' : 'Copilot said: '}</span>
                      {message.role === 'assistant' ? plainText(message.content) : message.content}
                    </div>
                    {message.role === 'user' ? (
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-subtle">
                        <User aria-hidden="true" className="h-4 w-4" />
                      </span>
                    ) : null}
                  </li>
                ))}
                {sending ? (
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                      <Bot aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-surface-muted px-4 py-3 text-sm text-body ring-1 ring-[color:var(--color-line)]">
                      <Spinner className="h-4 w-4" />
                      Reading your saved numbers…
                    </div>
                  </li>
                ) : null}
              </ul>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-line px-4 py-4 sm:px-5">
            {sendError ? (
              <Alert tone={aiMissing ? 'warning' : 'error'} className="mb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    {aiMissing
                      ? 'The copilot is not configured on this server yet. Add AI_API_KEY to the backend environment and restart the API — your saved history stays intact.'
                      : sendError}
                  </span>
                  {lastFailed && !aiMissing ? (
                    <Button variant="secondary" size="sm" onClick={() => void send(lastFailed)}>
                      <RefreshCw aria-hidden="true" className="h-4 w-4" />
                      Try again
                    </Button>
                  ) : null}
                </div>
              </Alert>
            ) : null}

            {!sending ? (
              <div className="mb-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-subtle">
                  Suggested questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      disabled={sending || noFinancialData}
                      className="min-h-[44px] rounded-full bg-surface px-3.5 text-left text-xs font-medium text-body ring-1 ring-[color:var(--color-line)] transition-colors hover:bg-surface-muted hover:text-heading disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="advisor-input" className="sr-only">
                  Your question
                </label>
                <textarea
                  id="advisor-input"
                  rows={2}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending || noFinancialData}
                  maxLength={2000}
                  placeholder={
                    noFinancialData
                      ? 'Add a financial period to start asking questions.'
                      : 'Ask about margins, pricing, costs or cash…'
                  }
                  className="min-h-[44px] w-full resize-y rounded-xl bg-surface px-3 py-2.5 text-sm text-heading ring-1 ring-[color:var(--color-line)] placeholder:text-subtle focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-surface-muted"
                />
                <p className="mt-1 text-[11px] text-subtle">Enter to send · Shift + Enter for a new line</p>
              </div>
              <Button type="submit" loading={sending} disabled={input.trim().length === 0 || noFinancialData}>
                <Send aria-hidden="true" className="h-4 w-4" />
                Send
              </Button>
            </form>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader eyebrow="Grounding" title="What the copilot can see" />
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <Database aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />
                <div>
                  <p className="text-[13px] font-medium text-heading">
                    {entryCount > 0 ? `${entryCount} saved ${entryCount === 1 ? 'period' : 'periods'}` : 'No periods yet'}
                  </p>
                  <p className="text-xs leading-relaxed text-subtle">
                    {summary
                      ? `Latest: ${summary.periodLabel} · ${formatCurrency(summary.revenue, currency)} revenue`
                      : 'The copilot stays quiet until a period exists.'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />
                <div>
                  <p className="text-[13px] font-medium text-heading">Your data only</p>
                  <p className="text-xs leading-relaxed text-subtle">
                    Each answer is built from your authenticated business. The AI key stays on the server.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />
                <div>
                  <p className="text-[13px] font-medium text-heading">No invented figures</p>
                  <p className="text-xs leading-relaxed text-subtle">
                    If the numbers are missing, the copilot says so instead of guessing.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader eyebrow="Better questions" title="How to get a sharp answer" />
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-body">
              <li>Name the period you mean when comparing.</li>
              <li>Ask for one decision at a time.</li>
              <li>Follow up with “what would that cost?”</li>
            </ul>
            <Link
              to="/app/simulator"
              className={buttonStyles({ variant: 'secondary', size: 'sm', className: 'mt-4 w-full' })}
            >
              Test an idea in the simulator
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

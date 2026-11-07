import { ArrowRight, RefreshCw, Send, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { Button, buttonStyles } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState, LoadingState, Spinner } from '../../components/ui/StateViews';
import { api, ApiError } from '../../lib/api';
import { cn } from '../../lib/cn';
import type { ChatMessage } from '../../lib/types';

const SUGGESTIONS = [
  'How is my business performing?',
  'What should I improve this month?',
  'What happens if revenue drops by 10%?',
  'How can I improve my profit margin?',
];

export function AdvisorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const [noFinancialData, setNoFinancialData] = useState(false);
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
      } catch (error) {
        setMessages((current) => current.filter((message) => message.id !== optimisticId));
        setInput(question);
        setLastFailed(question);
        if (error instanceof ApiError && error.code === 'NO_FINANCIAL_DATA') {
          setNoFinancialData(true);
        }
        setSendError(error instanceof Error ? error.message : 'The advisor could not answer. Please try again.');
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

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-subtle">AI Advisor</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-heading">Ask about your numbers</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-body">
          Answers are generated on the server from your saved financial entries. The advisor never sees another
          business&apos;s data and the AI key never reaches your browser.
        </p>
      </header>

      {noFinancialData ? (
        <Alert tone="warning">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              The advisor needs at least one financial entry before it can ground its advice in real numbers.
            </span>
            <Link to="/app/business" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
              Add financial data
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </Alert>
      ) : null}

      <Card className="flex flex-col overflow-hidden">
        <div className="border-b border-line p-5">
          <CardHeader
            title="Conversation"
            description="Stored in your account so you can continue later."
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-100">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                Grounded in your data
              </span>
            }
          />
        </div>

        <div className="min-h-[320px] flex-1 overflow-y-auto px-5 py-5 sm:max-h-[52vh]">
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
              title="No conversation yet"
              description="Start with a suggested question below, or ask anything about your margins, costs or cash position."
            />
          ) : (
            <ul className="space-y-4">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%]',
                      message.role === 'user'
                        ? 'rounded-br-md bg-brand-700 text-white'
                        : 'rounded-bl-md border border-line bg-surface-muted text-body',
                    )}
                  >
                    <span className="sr-only">{message.role === 'user' ? 'You said: ' : 'Advisor said: '}</span>
                    {message.content}
                  </div>
                </li>
              ))}
              {sending ? (
                <li className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-line bg-surface-muted px-4 py-3 text-sm text-body">
                    <Spinner className="h-4 w-4" />
                    Reading your numbers…
                  </div>
                </li>
              ) : null}
            </ul>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-line p-4 sm:p-5">
          {sendError ? (
            <Alert tone="error" className="mb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{sendError}</span>
                {lastFailed ? (
                  <Button variant="secondary" size="sm" onClick={() => void send(lastFailed)}>
                    <RefreshCw aria-hidden="true" className="h-4 w-4" />
                    Try again
                  </Button>
                ) : null}
              </div>
            </Alert>
          ) : null}

          {messages.length === 0 && !loadingHistory && !historyError ? (
            <div className="mb-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    disabled={sending || noFinancialData}
                    className="min-h-[44px] rounded-full border border-line bg-surface px-3.5 text-left text-xs font-medium text-body transition-colors hover:border-brand-300 hover:bg-surface-muted hover:text-heading disabled:cursor-not-allowed disabled:opacity-60"
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
                    ? 'Add a financial entry to start asking questions.'
                    : 'Ask about your margins, costs or cash position…'
                }
                className="min-h-[44px] w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-heading placeholder:text-subtle disabled:cursor-not-allowed disabled:bg-surface-muted"
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
    </div>
  );
}

# BizWise AI

AI-powered business finance for small-business owners. Record a period of numbers, and BizWise AI turns it into
margins, cash runway, a health score, what-if projections and grounded advice from an AI advisor.

This is a working full-stack application: real Supabase authentication, real database persistence with row level
security, real finance calculations, and an Express backend that is the only thing allowed to talk to Gemini.

> **Status:** the repository builds locally (`frontend` and `backend`), CI is configured, and both migrations are
> applied to a live Supabase project. Authentication, persistence, row level security isolation, entry CRUD, the
> simulator, reports and the Gemini advisor were exercised end to end against it, including the advisor's failure and
> retry states. The app is **not deployed** yet: publishing the two Vercel projects is a manual step (see
> [Vercel deployment](#vercel-deployment)). The advisor stays disabled until a Gemini key is set — it returns
> `503 AI_NOT_CONFIGURED` rather than inventing advice (see [Gemini setup](#gemini-setup)).

---

## Table of contents

- [Product overview](#product-overview)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Repository structure](#repository-structure)
- [Local setup](#local-setup)
- [Gemini setup](#gemini-setup)
- [Supabase setup](#supabase-setup)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [How the AI stays grounded](#how-the-ai-stays-grounded)
- [Security guidance](#security-guidance)
- [Vercel deployment](#vercel-deployment)
- [CI](#ci)
- [Troubleshooting](#troubleshooting)

---

## Product overview

Small-business owners know their revenue but rarely know which number to change. BizWise AI asks for five inputs per
period — period label, revenue, cost of goods sold, operating expenses and cash on hand — then does the analysis:

- net profit, gross margin, net margin, expense ratio and cash runway
- period-over-period change for revenue and profit

Cash runway is cash on hand divided by the period's cash burn (costs minus revenue). A period that covers all of its
costs has no burn, so the app reports "cash-flow positive" instead of inventing a month count.
- a weighted business health score out of 100
- a what-if simulator for price, volume, cost and expense changes
- an AI advisor that answers questions using those saved numbers

The marketing page uses illustrative sample data for a fictional business ("Acme Coffee Co.") and labels it as such.
Signed-in users only ever see rows they own.

## Features

**Public site** — landing page with features, how it works, AI advisor explanation, simulator explanation, an
illustrative dashboard preview, and a final call to action.

**Authentication** — Supabase email/password sign-up, sign-in, sign-out, forgot password, reset password, persistent
sessions, protected routes and friendly validation and error states.

**Dashboard** — greeting with the business name, a business health score out of 100 with its weighted factors and a
recommended next action, revenue / net profit / cash position / runway cards, a revenue-versus-profit trend chart with
period-over-period comparison, deterministic growth and risk signals computed from your own entries, and AI insights
with an explicit generate/regenerate action. A dedicated empty state explains the first three steps when nothing is
saved yet.

**Business analysis** — a worksheet grouped into period, revenue, direct costs, operating expenses, cash and notes,
with a live preview beside the form, plain-English explanations of each ratio, saved history, and edit and delete for
your own entries only.

**AI advisor** — a business copilot with five suggested questions, a visible grounding panel (which periods the model
can see), stored conversation history, a retry button after a failed request, explicit no-data and not-configured
states, and server-side Gemini calls that receive your financial context.

**Simulator** — price, volume, cost and operating-expense changes with an optional target profit, projected revenue,
expenses, profit, margin, difference from current profit, a rule-based recommended action, named saved scenarios and
deletion of your own scenarios.

**Reports** — revenue history, profit history, expense trends, margin trends, summary cards and period filtering.

**Settings** — business name, default currency, account email, password reset email, a light / dark / system
appearance control and logout. Save confirmations are inline; technical identifiers stay out of the way.

**Appearance** — light and dark themes share one token layer, follow the OS when set to system, and are applied before
first paint so there is no flash of the wrong theme.

## Technology stack

| Layer      | Choice                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite 5, Tailwind CSS 3, React Router 6           |
| UI         | Lucide React icons, Recharts charts                                    |
| Backend    | Node.js 20, Express 4, TypeScript, Zod validation                      |
| Database   | Supabase Postgres with row level security                              |
| Auth       | Supabase Auth (email + password, JWT verification on the backend)      |
| AI         | Google Gemini, called only from the Express backend                    |
| Deployment | Vercel (two independent projects: `frontend` and `backend`)            |
| CI         | GitHub Actions, Node 20, frontend production build + backend `tsc`     |

## Repository structure

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml                 # Node 20: frontend build + backend build
├── backend/
│   ├── api/
│   │   └── index.ts               # Vercel serverless entry (exports the Express app)
│   ├── src/
│   │   ├── app.ts                 # Express app factory (CORS, JSON limit, routes)
│   │   ├── config.ts              # Environment parsing, no secret logging
│   │   ├── index.ts               # Local app.listen() only
│   │   ├── lib/                   # ApiError, async wrapper, Zod helpers
│   │   ├── middleware/            # Supabase JWT verification, JSON error handler
│   │   ├── routes/                # health, business, simulate, ai
│   │   └── services/              # data access, finance maths, AI provider, prompt context
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json                # /health -> /api/health
├── frontend/
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── components/            # layout, guards, charts, UI primitives
│   │   ├── context/               # AuthContext, ThemeContext
│   │   ├── lib/                   # api client, finance maths, formatting, validation, supabase
│   │   ├── pages/
│   │   │   ├── app/               # dashboard, business, advisor, simulator, reports, settings
│   │   │   ├── auth/              # login, signup, forgot password, reset password
│   │   │   └── landing/           # public marketing page
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vercel.json                # SPA rewrites to index.html
│   └── vite.config.ts
├── supabase/
│   ├── migrations/
│   │   ├── 20260101000100_init.sql   # tables, constraints, indexes, triggers, signup bootstrap
│   │   └── 20260101000200_rls.sql    # RLS enablement + ownership policies
│   └── README.md
├── .gitignore
└── README.md
```

## Local setup

Requirements: Node.js 20+, npm 10+, a Supabase project and a Gemini API key.

```bash
git clone https://github.com/bathriprasathtk-ui/bizwise-ai.git
cd bizwise-ai
```

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values
npm run dev               # http://localhost:8787
```

The backend refuses to start a protected request without Supabase credentials (it returns a clear 503 instead of
crashing), and returns a 503 with `AI_NOT_CONFIGURED` for advisor requests when `AI_API_KEY` is missing.

Useful commands:

```bash
npm run build       # tsc -> dist/
npm start           # node dist/src/index.js
npm run typecheck   # tsc --noEmit
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:5173
```

`VITE_API_BASE_URL` can stay blank locally: Vite proxies `/api` to `http://localhost:8787`.

### 3. First run

1. Open <http://localhost:5173>.
2. Create an account (the signup form also creates your business row through the database trigger).
3. Confirm your email if Supabase email confirmation is enabled.
4. Add one financial entry in **Business Analysis**.
5. The dashboard, advisor and simulator now have data to work with.

## Gemini setup

The advisor and the dashboard insights are served by Google Gemini through the Express backend. The browser never sees
the key: it is read from `AI_API_KEY` on the server and every request is scoped to the signed-in user.

1. Create a key at <https://aistudio.google.com/app/apikey>. The free tier is enough to try the app.
2. Put these three lines in `backend/.env` (never in `frontend/.env`, never committed):

   ```bash
   AI_PROVIDER=gemini
   AI_API_KEY=<your key>
   AI_MODEL=gemini-3.5-flash
   AI_MODEL_FALLBACK=gemini-3.5-flash-lite
   ```

3. Restart the backend. `GET /api/health` returning `200` and a successful advisor reply confirm the wiring; until
then the app shows a friendly in-app message instead of fake advice.

Notes on models and limits:

- `gemini-3.5-flash` is the default: it is a current free-tier model, fast enough for chat, and produced grounded
  answers on the seeded data. Older names such as `gemini-2.5-flash` are rejected for new API keys with a 404, which
the backend maps to `AI_MODEL_UNAVAILABLE`.
- `AI_MODEL_FALLBACK` (default `gemini-3.5-flash-lite`) is tried automatically when the primary model returns 429
  (quota) or 5xx (high demand). The backend retries once with a short backoff, then switches models, and logs which
  model answered — no key or user data is ever logged.
- Gemini 3.x spends part of the output budget on internal reasoning, so the backend requests a larger token budget
  (2048 for insights, 1800 for chat) and reports an empty `MAX_TOKENS` reply as `AI_TRUNCATED` instead of returning a
  half sentence.
- Free-tier quota is per day and per model. If both models are exhausted the advisor returns a retryable error and the
  UI offers **Try again**; the app keeps working, only the AI actions pause.

## Supabase setup

Full instructions live in [`supabase/README.md`](supabase/README.md). In short:

1. Create a Supabase project.
2. Apply the migrations in order — with the CLI (`supabase link` then `supabase db push`) or by pasting
   `supabase/migrations/20260101000100_init.sql` and then `20260101000200_rls.sql` into the SQL editor.
3. Add your site URLs (including `http://localhost:5173` and `<frontend-url>/reset-password`) to
   **Authentication → URL Configuration**.
4. Copy the Project URL, the anon/publishable key (frontend) and the service role key (backend only).
5. Run the Supabase **Security Advisor** and **Performance Advisor** after applying the schema.

Schema summary:

| Table               | Purpose                        | Ownership                          |
| ------------------- | ------------------------------ | ---------------------------------- |
| `businesses`        | one profile per account        | `user_id = auth.uid()` (unique)    |
| `financial_entries` | period snapshots               | `user_id` + parent business owned  |
| `simulations`       | saved what-if scenarios        | `user_id` + parent business owned  |
| `chat_messages`     | advisor conversation history   | `user_id` + parent business owned  |

Every table has RLS enabled and forced, no access for `anon`, and policies for select/insert/update/delete scoped to
the owning user. `handle_new_user()` is a `security definer` trigger function whose `execute` privilege is revoked
from `public`, `anon` and `authenticated`, so it cannot be called through the REST API.

## Environment variables

### Frontend (`frontend/.env`, `frontend/.env.example`)

| Name                     | Required | Notes                                                      |
| ------------------------ | -------- | ---------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | yes      | Supabase project URL                                       |
| `VITE_SUPABASE_ANON_KEY` | yes      | anon / publishable key — safe for browsers                 |
| `VITE_API_BASE_URL`      | prod     | deployed backend origin, no trailing slash                 |

### Backend (`backend/.env`, `backend/.env.example`)

| Name                          | Required | Notes                                                        |
| ----------------------------- | -------- | ------------------------------------------------------------ |
| `SUPABASE_URL`                | yes      | Supabase project URL                                         |
| `SUPABASE_SERVICE_ROLE_KEY`   | yes      | server-only, bypasses RLS — never expose or commit           |
| `AI_PROVIDER`                 | yes      | `gemini` (the only supported provider)                       |
| `AI_API_KEY`                  | yes      | Gemini API key, server-only                                  |
| `CORS_ORIGIN`                 | yes      | comma-separated allowed browser origins                      |
| `PORT`                        | no       | local port, defaults to `8787`                               |
| `AI_MODEL`                    | no       | defaults to `gemini-3.5-flash`                               |
| `AI_MODEL_FALLBACK`           | no       | defaults to `gemini-3.5-flash-lite`, used on 429 / 5xx        |

## API reference

All protected routes require `Authorization: Bearer <supabase-access-token>`. The backend verifies the token with
Supabase Auth and scopes every query by the verified user id.

| Method   | Path                          | Auth | Purpose                                                   |
| -------- | ----------------------------- | ---- | --------------------------------------------------------- |
| `GET`    | `/health`, `/api/health`      | no   | service status                                            |
| `GET`    | `/api/business`               | yes  | business profile, entries and computed summary            |
| `POST`   | `/api/business`               | yes  | update business name / currency                           |
| `POST`   | `/api/business/entries`       | yes  | create a financial entry                                  |
| `PATCH`  | `/api/business/entries/:id`   | yes  | update your own entry                                     |
| `DELETE` | `/api/business/entries/:id`   | yes  | delete your own entry                                     |
| `POST`   | `/api/business/insights`      | yes  | generate AI insights from your saved numbers              |
| `POST`   | `/api/simulate`               | yes  | run a projection (optionally save it as a scenario)       |
| `GET`    | `/api/simulate/history`       | yes  | your saved scenarios                                      |
| `DELETE` | `/api/simulate/:id`           | yes  | delete your own scenario                                  |
| `GET`    | `/api/ai/chat`                | yes  | your advisor conversation history                         |
| `POST`   | `/api/ai/chat`                | yes  | ask the advisor (stores both turns on success)            |

Errors always use a stable shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Enter a valid amount.", "details": [{ "field": "revenue", "message": "Enter a valid amount." }] } }
```

## How the AI stays grounded

1. The route loads only the caller's business and entries (scoped by the verified user id).
2. `buildFinancialContext()` renders those numbers — latest period metrics, health score and the last six periods —
   into a compact text block.
3. `generateAdvice()` / `generateInsights()` sends that block plus the recent conversation to Gemini with a system
   prompt that forbids inventing figures and requires saying what data is missing.
4. Only the AI's text response is stored; the context block is not persisted.
5. With no financial entries the advisor returns `409 NO_FINANCIAL_DATA` instead of hallucinating advice.

The Gemini key and the Supabase service role key never leave the backend. The browser only holds the Supabase anon
key and the user's own session token.

## Security guidance

- Keep `SUPABASE_SERVICE_ROLE_KEY` and `AI_API_KEY` in the backend host only (Vercel → backend project → Environment
  Variables). Never add them to `frontend/.env`, and never prefix them with `VITE_` — Vite inlines those into the
  bundle.
- Never commit `.env`, `.env.local`, keys or tokens. `.gitignore` excludes them; only `.env.example` files are tracked.
- The backend verifies every JWT with Supabase Auth; it never trusts a user id supplied by the client.
- Entry, scenario and message reads and writes are scoped by `user_id` and the parent `business_id`.
- RLS is enabled **and forced** on all four tables; `anon` has no table privileges.
- Backend request bodies are limited to 32 KB and validated with Zod; the frontend validates the same fields.
- CORS is an explicit allowlist from `CORS_ORIGIN`; unknown origins get a 403.
- API responses set `Cache-Control: no-store` because they are per-user.
- Errors return stable codes and human-readable messages; the error handler logs only the error class, never request
  bodies, headers or secrets.

## Vercel deployment

Two independent Vercel projects from the same repository.

### Backend project

1. **Add New → Project**, import the repo, set **Root Directory** to `backend`.
2. Framework preset: **Other** (no build command is required; Vercel detects `api/index.ts`).
3. Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_PROVIDER=gemini`, `AI_API_KEY`,
   `CORS_ORIGIN=https://<your-frontend-domain>` (comma-separate extra origins such as preview URLs), and optionally
   `AI_MODEL` / `AI_MODEL_FALLBACK` to pin the models. Add the key in Vercel, not in the repository.
4. Deploy, then check `https://<backend-domain>/health` and `https://<backend-domain>/api/health`.

`backend/api/index.ts` exports the Express app; `src/index.ts` keeps `app.listen()` for local development only.
`backend/vercel.json` rewrites `/health` to the single serverless function.

### Frontend project

1. **Add New → Project**, import the same repo, set **Root Directory** to `frontend`.
2. Framework preset: **Vite** (build `npm run build`, output `dist`).
3. Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_API_BASE_URL=https://<backend-domain>` (no trailing slash).
4. Deploy. `frontend/vercel.json` rewrites all routes to `index.html` so client-side routing works on refresh.
5. Add the deployed URL (and `<url>/reset-password`) to Supabase **Authentication → URL Configuration**, then redeploy
   if you changed the backend's `CORS_ORIGIN`.

### Post-deploy checklist

- [ ] `/health` and `/api/health` return `200`
- [ ] Sign up, confirm email, sign in, sign out
- [ ] Password reset email arrives and the link opens `/reset-password`
- [ ] Add, edit and delete a financial entry
- [ ] Generate dashboard insights and ask the advisor a question
- [ ] Save and delete a simulation scenario
- [ ] Second account sees none of the first account's data
- [ ] Same-page refresh on `/app/reports` loads the app (SPA rewrite works)

## CI

`.github/workflows/ci.yml` runs on every push and pull request to `main` using Node 20:

- **frontend** — `npm ci` then `npm run build` (TypeScript check + Vite production build)
- **backend** — `npm ci` then `npm run build` (`tsc`)

No secrets are required in CI; both jobs only compile.

## Troubleshooting

**The app shows "Configuration needed".** `VITE_SUPABASE_URL` and/or `VITE_SUPABASE_ANON_KEY` are missing at build
time. Set them in the frontend host and redeploy — Vite inlines environment variables during the build.

**Sign-up succeeds but no session is returned.** Email confirmation is enabled in Supabase. Confirm the address, or
turn confirmation off for local testing. The app shows a "check your inbox" state in this case.

**"Your session has expired" on every request.** `VITE_API_BASE_URL` points at the wrong backend, or the backend's
`CORS_ORIGIN` does not include the frontend origin. The browser will also show a CORS error in the console.

**Advisor returns 503 `AI_NOT_CONFIGURED`.** `AI_API_KEY` is missing on the backend. Add it in Vercel and redeploy.

**Advisor returns 409 `NO_FINANCIAL_DATA`.** Add at least one financial entry; the advisor deliberately refuses to
advise without real data.

**Advisor returns 429 / "high demand" after a while.** The Gemini free tier is per-day and per-model. The backend
retries and falls back to `AI_MODEL_FALLBACK` first; if both are exhausted, wait for the daily reset or enable billing.

**Advisor returns `AI_MODEL_UNAVAILABLE`.** `AI_MODEL` names a model your key cannot use (often an older name such as
`gemini-2.5-flash`). Set `AI_MODEL=gemini-3.5-flash` and restart the backend.

**Advisor returns `AI_TRUNCATED`.** The model hit the output-token ceiling before finishing. Ask a narrower question,
or raise the token budget in `backend/src/services/ai.ts`.

**The cash runway card says "Positive".** That is correct when the latest period covers all of its costs: there is no
burn, so a month count would be meaningless. The card shows how many periods of costs the cash covers instead.

**`/health` works but `/api/business` returns 503 `DATABASE_UNAVAILABLE`.** The Supabase server credentials are missing
or wrong on the backend.

**Password reset link reports expired.** Links are single-use and expire after an hour. Request a new one from
`/forgot-password`; make sure `/reset-password` is in the Supabase redirect allowlist.

**Charts are empty.** One saved period draws a single point. Add a second period to see trends.

**`npm run build` fails on a fresh clone.** Use Node 20 (`node -v`) and run `npm ci` from the `frontend` or `backend`
directory rather than the repository root.

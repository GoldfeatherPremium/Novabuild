# NOVA — AI Research Workspace

**Your research. Connected. Understood.**

NOVA is a production-oriented AI research SaaS platform built on top of a premium,
art-directed landing page. This repository contains both:

1. the **public marketing site** (homepage with 13 animated sections), and
2. the **full application**: authentication, onboarding, dashboard, document
   management, AI processing pipeline, RAG chat with citations, research projects,
   notes, knowledge graph, subscriptions/billing, usage credits, notifications,
   user settings, and an admin console.

The landing page is the design foundation: every application page extends the same
visual language (deep navy, violet/electric-blue accents, glass surfaces, Motion
transitions) rather than introducing a separate look.

> **Status note.** Everything is implemented to fail *openly*: when external
> services (Supabase, an AI provider, Stripe, email) are not configured, the app
> detects it and surfaces a clear integration-status banner instead of pretending
> the feature works. No fake success responses.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), server actions / route handlers |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 + centralized design tokens (`tailwind.config.ts`) |
| Animation | `motion` (`motion/react`), `MotionConfig reducedMotion="user"` |
| Icons | lucide-react |
| Database / Auth / Storage | Supabase (PostgreSQL + Auth + Storage) |
| Vector search | PostgreSQL `pgvector` (with keyword fallback) |
| AI | Provider-independent layer (OpenAI-compatible API) |
| Billing | Provider abstraction (Stripe via REST, test mode) |
| Testing | Vitest (unit) + Playwright (browser QA) |

---

## Quick start

```bash
npm ci
cp .env.example .env.local   # fill in values; see Env below
npm run dev                  # http://localhost:3000
npm run build                # production build
npm run typecheck            # tsc --noEmit
npm run test:unit            # vitest unit tests (no services required)
```

Without any `.env.local` values the marketing site renders fully, and `/login`,
`/register`, `/verify`, `/forgot-password`, `/reset-password`, `/app/*`,
`/onboarding`, `/admin/*` render their UI with a configuration banner explaining
exactly which provider is missing. Authenticated flows redirect to `/login` when
Supabase is not configured.

---

## Environment variables (` .env.example`)

See `.env.example` for the complete annotated list. Only variables the code
actually uses are listed. **Never commit real secrets.**

| Variable | Purpose | Required for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase client | All auth/data/storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin client (jobs, billing webhooks) | Document processing, billing |
| `AI_PROVIDER` (`openai-compatible` \| `none`) | Turns AI on/off | Summaries, chat, embeddings |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_CHAT_MODEL`, `AI_SUMMARY_MODEL`, `AI_EMBEDDING_MODEL` | Provider + per-task models | AI features |
| `BILLING_PROVIDER` (`stripe` \| `none`), `BILLING_SECRET_KEY`, `BILLING_WEBHOOK_SECRET` | Stripe test mode | Checkout, webhooks |
| `BILLING_PRICE_PRO_MONTHLY` / `..._YEARLY`, `BILLING_PRICE_TEAM_MONTHLY` / `..._YEARLY` | Stripe price IDs | Checkout links |
| `EMAIL_PROVIDER` (`resend` \| `none`), `EMAIL_API_KEY`, `EMAIL_FROM` | Transactional email (config surface) | Email notifications |
| `APP_URL` | Canonical URL (redirects, emails) | Auth redirects |
| `ENCRYPTION_KEY` | 32-byte hex key for encrypted stored values | Reserved |

---

## Supabase setup

1. Create a Supabase project (free tier is enough to start).
2. Apply the migrations in `supabase/migrations/` **in filename order** using
   `supabase db push` (or the SQL editor):
   - `20260101120000_init_schema.sql` — full schema + RLS + triggers
   - `20260101130000_seed_plans.sql` — plan catalog (free/pro/team) + system settings
   - `20260101140000_add_document_summary.sql` — summary JSON column
   - `20260101150000_add_admin_and_project_link.sql` — profile email/suspension, project link
3. Storage: create a **private** bucket named `documents` (no public read).
   Files are stored under `{userId}/{docId}/{filename}` and accessed via
   server-generated signed URLs only. RLS on tables governs row access; the
   bucket itself must remain private.
4. Auth settings (Dashboard → Authentication → URL Configuration):
   - Site URL: `http://localhost:3000` (dev) or your `APP_URL`.
   - Redirect URLs: `${APP_URL}/auth/callback`.
   - Optionally enable Google (or another) OAuth provider.
5. Email: use Supabase's built-in email (confirmations, password resets) or
   configure a custom SMTP provider. The app's own `EMAIL_*` vars are reserved
   for in-app transactional notifications.
6. In the SQL editor, verify the trigger `on_auth_user_created` exists — new
   signups automatically get a profile, a personal workspace, membership,
   a credit account (100 starting credits) and preferences.

> `pgvector` embedding columns are created with a guarded `create extension if
> not exists`; the retrieval layer falls back to keyword search when embeddings
> are unavailable, so the schema applies even without the extension.

---

## AI provider setup

The AI layer is provider-independent (`lib/ai/`). It speaks the OpenAI-compatible
chat/completions and embeddings APIs, so it works with OpenAI, together with
any OpenAI-compatible gateway.

- Set `AI_PROVIDER=openai-compatible`, `AI_API_KEY=...`, and optionally
  `AI_BASE_URL` (defaults to `https://api.openai.com/v1`).
- Separate models: `AI_CHAT_MODEL`, `AI_SUMMARY_MODEL`, `AI_EMBEDDING_MODEL`.
- `AI_PROVIDER=none` (or missing key) → summaries/chat refuse with a clear error;
  document processing still extracts and chunks text (embeddings skipped,
  keyword retrieval used).

### Prompt-safety

- Summarization and chat system prompts include guardrails that treat extracted
  document text as **untrusted data**; instructions embedded in uploaded
  documents cannot override system policies (prompt-injection guard).
- Retrieved context is scoped to the user's workspace; cross-workspace chunk
  leak is prevented at the query level and by RLS.

---

## Billing (Stripe, test mode)

- Billing is wired through `BILLING_PROVIDER=stripe` with `BILLING_SECRET_KEY`
  and `BILLING_WEBHOOK_SECRET`. It runs in **test mode** until `sk_live_*`
  keys are configured (mode is surfaced in admin settings).
- Entitlements are granted **only** in the webhook handler
  (`app/api/billing/webhook/route.ts`), never from the frontend.
- Webhook security: HMAC-SHA256 signature verification (timing-safe),
  timestamp-freshness replay protection, idempotent event processing via the
  unique `payment_transactions(provider, provider_transaction_id)` constraint,
  and a plan whitelist.
- Configure the Stripe webhook endpoint to `POST {APP_URL}/api/billing/webhook`
  with the events `checkout.session.completed`, `invoice.payment_failed`,
  `customer.subscription.updated`, `customer.subscription.deleted`.
- Price IDs (`BILLING_PRICE_*`) come from Stripe dashboard for the three plans;
  the demo prices in the `plans` table (free/$12/$39) are editable in admin.

---

## Document processing pipeline

Flow: **client → presigned upload → document record + job → async pipeline**:

1. `POST /api/uploads/presign` creates a signed upload URL in the private bucket.
2. Client uploads bytes directly to Supabase Storage.
3. `POST /api/documents` validates (extension + magic bytes + size + duplicate),
   creates the `documents` row and a `document_processing_jobs` row, then fires
   the pipeline without holding the HTTP request open.
4. `lib/processing/pipeline.ts` (async, with a 120s deadline, idempotent,
   retry bookkeeping, failure notification):
   - re-validates real bytes server-side,
   - extracts text (PDF via `pdf-parse`, DOCX via `mammoth`, TXT direct),
   - detects empty/scanned documents (OCR is a declared, not-yet-configured step),
   - chunks text (overlapping, boundary-aware),
   - embeds chunks when an AI provider is configured (batched, optional),
   - marks the document `completed` and notifies the user.

Statuses: `uploading → queued → processing → completed | failed`. Failed jobs
surface in the admin Jobs monitor with a retry action.

---

## AI chat (RAG)

`/app/chat` — chat with one or more documents. Architecture:

1. User selects documents + asks a question.
2. Retrieval (`lib/ai/retrieval.ts`) embeds the question, calls
   `match_documents` (or keyword fallback), scoped to workspace + selected docs.
3. The provider generates an answer grounded in the retrieved passages.
4. Citations attach to the assistant message referencing **real chunk passages**
   (with page hints when available) — citations are never fabricated; if the
   documents don't contain the answer, the model is instructed to say so.
5. Conversations/messages persist; supports follow-ups, regenerate, rename,
   pin, delete, and export (JSON/Markdown).

---

## Project layout

```
app/
  page.tsx                    # marketing homepage (13 sections)
  login register verify forgot-password reset-password/
  auth/callback/              # Supabase OAuth/email redirect
  onboarding/                 # 6-step onboarding (multi-step, resumable)
  app/                        # authenticated dashboard
    page.tsx documents/ projects/ chat/ notes/ history/ knowledge/
    notifications/ settings/{profile,security,preferences,storage,billing,account}/
  admin/                      # admin console (users, plans, jobs, settings, overview)
  api/                        # route handlers (see API reference)
components/
  ui/                         # Button, Input, Select, Textarea, Checkbox, Reveal…
  app/                        # AppShell, Sidebar, Topbar, UploadDropzone, chat UI…
  admin/ auth/ onboarding/ hero/
lib/
  supabase/{client,server}.ts
  auth/{actions,guards}.ts
  documents/{validate,storage}.ts
  processing/{extract,chunk,pipeline}.ts
  ai/{index,types,openai-compatible,chat,summarize,retrieval}.ts
  billing/{provider,subscriptions,webhook}.ts
  credits.ts notifications.ts env.ts env-public.ts constants.ts
supabase/migrations/          # schema + seed (apply in order)
tests/unit/                   # Vitest unit tests (chunk, validate, webhook, constants)
scripts/qa_screenshots.py     # Playwright browser QA (landing interactions + screenshots)
```

### Security model

- **RLS everywhere**: every user-owned table is RLS-protected; ownership derives
  from `auth.uid()` server-side, never from client-supplied IDs. Workspaces
  gate access via `is_workspace_member()`.
- **Server-side guards** (`lib/auth/guards.ts`): `requireUser()` and
  `requireAdmin()` run in every protected page; admin routes validate `role`
  from the DB. Middleware protects `/app`, `/onboarding`, `/admin` and redirects
  signed-in users away from auth pages.
- **Storage**: private bucket, signed URLs only.
- **File safety**: extension + magic-byte validation, size caps, no execution of
  uploads, extracted text treated as untrusted.
- **Credits**: atomic `deduct_credits` RPC prevents overspend; users cannot edit
  their own ledger (RLS denies writes; only service-role/admin paths mutate).
- **Secrets**: service-role keys and API keys are server-only (`server-only`
  import guard); nothing secret is logged or exposed to the browser.

---

## API reference (route handlers)

| Method / Route | Purpose |
|---|---|
| `POST /api/uploads/presign` | Signed upload URL in private `documents` bucket |
| `GET/POST /api/documents` | List/filter docs; finalize upload + start processing |
| `GET/PATCH/DELETE /api/documents/[id]` | Read/rename/pin/delete a document |
| `GET /api/documents/[id]/download` | Signed download URL |
| `POST /api/documents/[id]/process` | Re-run processing (retry) |
| `POST /api/documents/[id]/summary` | Generate a summary (type-selectable) |
| `GET/POST /api/conversations` | List/create conversations |
| `GET/PATCH/DELETE /api/conversations/[id]` | Read/rename/pin/archive/delete |
| `POST /api/conversations/[id]/messages` | Ask a question (RAG + citations) |
| `POST /api/conversations/[id]/regenerate` | Regenerate last assistant answer |
| `GET /api/conversations/[id]/export` | Export conversation (JSON/Markdown) |
| `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/[id]` | Research projects |
| `POST/DELETE /api/projects/[id]/documents` | Attach/detach documents |
| `GET/POST /api/notes`, `GET/PATCH/DELETE /api/notes/[id]` | Notes (autosave) |
| `POST /api/notes/generate` | AI note generation from a document |
| `GET /api/knowledge` | Knowledge graph entities/relationships |
| `GET/PATCH /api/notifications` | List / mark read / delete notifications |
| `POST /api/billing/checkout`, `/portal` | Stripe checkout / billing portal |
| `POST /api/billing/webhook` | Stripe webhook (signature-verified) |
| `GET /api/admin/analytics` | Platform analytics |
| `GET/PATCH /api/admin/users`, `GET/PATCH /api/admin/users/[id]` | Manage users (suspend/restore/credits) |
| `GET/PATCH /api/admin/plans` | Plan catalog management |
| `GET /api/admin/jobs`, `POST /api/admin/jobs/[id]/retry` | Processing job monitor + retry |
| `GET/PATCH /api/admin/settings` | System settings + integration status |

---

## Testing

- **Unit (Vitest)** — `npm run test:unit` (no services required):
  - `tests/unit/chunk.test.ts` — chunk splitting/overlap/boundaries,
  - `tests/unit/validate.test.ts` — magic-byte file validation,
  - `tests/unit/webhook.test.ts` — Stripe signature verification + replay freshness,
  - `tests/unit/constants.test.ts` — plan catalog / credit costs.
- **Browser QA (Playwright)** — `scripts/qa_screenshots.py` captures
  screenshots and asserts interactions (hero, tabs, pricing toggle, FAQ, mobile
  menu, console errors, 360px overflow) at 1440/1280/768/390/360.
- Security invariants covered by design + guarded at the DB level (RLS) and
  server layer; see Security model above.

---

## Deployment (Vercel)

1. Push the repo to GitHub and import into Vercel (framework: Next.js —
   `vercel.json` already sets build/install commands; Node 20 via `.nvmrc`).
2. Set **all** environment variables from `.env.example` (public `NEXT_PUBLIC_*`
   and server-only secrets) in the Vercel project settings.
3. Apply the Supabase migrations to the production project (see Supabase setup).
4. Configure the Stripe webhook endpoint for production (see Billing).
5. Deploy. The marketing site is statically prerendered; `/app/*`, `/admin/*`
   and `/api/*` are dynamic and require Supabase to be configured.

---

## Known limitations / remaining external configuration

- **No production credentials are committed or assumed.** You must supply
  Supabase, AI, Stripe and email keys via env vars. Until then the app is fully
  functional as a UI + fails-open integration layer.
- **Email sending** (`EMAIL_*`) exposes configuration and status but does not
  yet send transactional emails; Supabase's own Auth emails cover verification
  and password resets.
- **OCR** is a declared pipeline step, not yet wired to an OCR provider;
  scanned PDFs fail with a clear message.
- **Monthly credit resets** (`reset_monthly_credits`) require a scheduler
  (pg_cron or a Supabase scheduled Edge Function) to be enabled in production.
- **Rate limiting** on sensitive API routes is enforced at the platform/edge
  level (Vercel) rather than in-app.
- **Active-session revocation** and **full data-export archive** are surfaced in
  settings but depend on provider capabilities.
- Fictional marketing content (logos, testimonials, metrics) is labeled
  illustrative; dashboard statistics come from real database records, never
  fabricated.

---

## Feature checklist

Implemented: marketing site · Supabase auth (register/login/verify/forgot/reset,
OAuth-ready) · protected routes + server guards · onboarding (6 steps, resumable)
· dashboard (stats, activity, quick actions, empty states) · document management
(upload/presign, validation, duplicate detection, rename/pin/delete/filter/search)
· async processing pipeline (extract/chunk/embed, retry, failure reporting) ·
summaries (11 formats, copy/download/export/save/regenerate) · RAG chat with
citations + follow-ups/regenerate/export · projects · notes (AI generate/rewrite
surface) · knowledge graph API · conversation history · notifications · credits
(atomic ledger, admin adjust, monthly reset fn) · subscriptions/billing (Stripe
test mode, verified webhook, idempotent) · settings (profile/security/preferences/
storage/billing/account) · admin console (overview/users/plans/jobs/settings +
analytics) · unit tests · Playwright QA · docs.

Not implemented (require external config): production Stripe keys/price IDs,
real email sending, OCR provider, scheduled credit resets, OAuth provider
enabled, production deployment of the exact commit on Vercel.

# Billing & Subscriptions Overview

This domain implements Stripe‑backed subscription management, checkout, webhooks, plan seeding, and local subscription state reconciliation. Core behavior is in `server/routes/subscription.ts` and `server/seed-plans.ts`.

## Key modules and files
- `server/routes/subscription.ts` — Express router exposing:
	- `GET /plans` — list available plans (cached 5m).
	- `GET /current` — returns current user's subscription (requires `isAuthenticated`).
	- `POST /create-checkout-session` — creates a Stripe Checkout session (uses `planId`, handles free plan locally).
	- `POST /modify` — change active plan (handles free ↔ paid transitions, updates Stripe subscription when needed).
	- `POST /cancel` / `POST /resume` — schedule cancellation at period end and resume subscription.
	- `POST /seed-plans` — development-only seeding endpoint (guards `NODE_ENV !== 'production'`).
	- `webhookHandler` — exported router for mounting at `/api/webhook` to receive Stripe events.
- `server/seed-plans.ts` — idempotent script to seed plans (also used by `/seed-plans` endpoint in dev).
- `server/storage.ts` — storage helpers used to persist and update `subscription_plans` and `subscriptions` rows.

## Main types and contracts
- Stripe init: `STRIPE_SECRET_KEY` is required at runtime; `initializeStripe()` throws if missing.
- Plan mapping: `subscription_plans` rows include `stripePriceId` and `stripeProductId` mapped from env vars (`PRICE_SUB_BASIC`, `PROD_SUB_BASIC`, `PRICE_SUB_PREMIUM`, etc.).
- Checkout metadata: server sets `metadata.userId` and `metadata.planId` on Checkout sessions — webhook handlers rely on these to create/update local subscriptions.
- Free plan: plans with `price === 0` or `stripePriceId === 'price_free'` are handled locally without creating Stripe sessions.

## Important flows and edge cases
- Webhook verification: the webhook handler uses raw request body and `STRIPE_WEBHOOK_SECRET`; signature verification failure returns 400. Mount the webhook at `/api/webhook` and preserve raw body (server/index.ts config).
- Handled events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, and `invoice.payment_failed` are processed and mapped to storage updates (create/update subscription rows, reset monthly message counters when new billing cycle starts, set `past_due` on failed payments).
- Billing cycle detection: on `customer.subscription.updated` the code compares `current_period_start` to decide whether to reset `messagesUsedThisMonth`.
- Cancellation semantics: the app typically sets `cancel_at_period_end` when canceling; downgrading to Free cancels paid Stripe subscriptions and removes Stripe identifiers from the DB.
- Idempotency: seed and webhook handlers check existing DB state (upsert/update) to avoid duplicates.

## How to extend or modify this domain
- Add or change plans:
	1. Add new plan entries to `server/seed-plans.ts` (or set corresponding env vars) and run the seeder in staging.
	2. Ensure `subscription_plans.stripePriceId` and `stripeProductId` are set (env names: `PRICE_SUB_BASIC`, `PROD_SUB_BASIC`, `PRICE_SUB_PREMIUM`, `PROD_SUB_PREMIUM`, `PRICE_SUB_ULTRA`, `PROD_SUB_ULTRA`).
	3. Add UI mapping if exposing new plans to clients.
- Webhook behavior:
	- Keep `/api/webhook` raw body middleware and `STRIPE_WEBHOOK_SECRET` configured; simulate events with the Stripe CLI when testing.
	- When adding new Stripe event handling, ensure updates call `storage.updateSubscriptionByStripeId` or similar to keep DB in sync.
- Tests: use Stripe test keys and the Stripe CLI to send signed events to `/api/webhook`; unit test `handleCheckoutCompleted` and period detection logic.

## Operational notes and assumptions
- Required env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and plan price/product envs (see seed file and README). Missing `STRIPE_SECRET_KEY` will throw at runtime when initializing Stripe.
- Webhook placement: server must apply raw body parsing for `/api/webhook` before JSON parsing — this is already configured in `server/index.ts`.
- Currency/intervals: seed data uses `eur` and monthly billing by default — change carefully and ensure Stripe price IDs match.

Use the seed script in CI or a staging run to synchronize plan definitions with DB before enabling production Checkout flows.

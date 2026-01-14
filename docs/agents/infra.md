# Infrastructure & Deployment Overview

This domain summarizes deployment and infra-related files: containerization, hosting config, and build tooling. The repo includes a `Dockerfile`, `fly.toml`, and Vite config for production builds.

## Key modules and files
- `Dockerfile` — image build instructions for the app.
- `fly.toml` — Fly.io deployment configuration.
- `vite.config.ts` — Vite build config for the client and SSR.
- `package.json` — scripts for build, dev, and possibly deploy tasks.

## Main types and contracts
- Build artifacts: `npm run build` should produce a client bundle and any server build outputs expected by the deployment image.
- Environment: required env vars include database URL, OpenAI key, Stripe keys, and storage credentials.

## Important flows and edge cases
- Local dev vs production: SSR and server entrypoints may behave differently (e.g., `entry-server.tsx` being used only in production SSR). Validate `server/vite.ts` for dev-mode behavior.
- Secrets management: never store production keys in the repo; use provider secret stores.
- Images and caching: Docker layers should be optimized to avoid re-installing dependencies repeatedly.

## How to extend or modify this domain
- Add CI/CD: extend existing `package.json` scripts and add a GitHub Actions or similar workflow that runs tests, linters, build, and deployment steps.
- Local development: document `npm run dev` and any proxied API_HOST values for the frontend.
- Testing infra changes: use ephemeral deploys (staging) before altering production config.

Assumptions: deployment targets include Fly.io (via `fly.toml`) and container images built via `Dockerfile`.

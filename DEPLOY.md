# Deploy and Run Instructions (Vercel frontend + Render backend)

This branch contains helper files to deploy the frontend to Vercel and the API to Render, plus a docker-compose for local development.

1) Frontend — Vercel
- In Vercel, create a new project and connect your GitHub repository.
- Set the Project Root to: artifacts/mission-distinction
- Build Command: pnpm install && pnpm --filter @workspace/mission-distinction build
- Output Directory: artifacts/mission-distinction/dist
- Add the following Environment Variables (in Vercel dashboard):
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - VITE_POSTHOG_KEY
  - VITE_POSTHOG_HOST
  - VITE_GA_MEASUREMENT_ID

2) Backend — Render (Docker) or Node
Option A — Docker (recommended with the provided Dockerfile):
- Create a new Web Service on Render using Docker.
- Connect to this GitHub repository and select the implement/vercel-render branch or main when ready.
- Render will build the Dockerfile at artifacts/api-server/Dockerfile.
- Set environment variables in the Render dashboard (DATABASE_URL, JWT_SECRET, SENTRY_DSN, etc.).

Option B — Node (no Docker):
- Build command: pnpm install && pnpm --filter @workspace/api-server build
- Start command: node --enable-source-maps ./artifacts/api-server/dist/index.mjs

3) Local development with docker-compose
- Copy .env.example to .env and fill values.
- Run: docker-compose up --build
- Frontend dev server: http://localhost:3000 (proxied to Vite dev on 5173)
- API server: http://localhost:3001

4) CI
- A GitHub Actions workflow is included at .github/workflows/ci-build.yml. It installs pnpm, builds the frontend and api-server, and uploads the frontend dist as an artifact.

Notes
- Do NOT commit secrets to the repo. Use the hosting provider's secrets management.
- This setup aims to reproduce the Replit behavior: frontend served by Vercel (fast static hosting) and backend as a hosted Node service on Render.

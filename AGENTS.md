# AGENTS.md

## Project Overview

Predicciones Mundial 2026 is a Next.js app for predicting World Cup 2026 matches, qualified group teams, global tournament outcomes, and comparing users on a leaderboard.

The app uses Supabase for auth and data storage, with admin-only routes for syncing external data and recalculating points.

## Tech Stack

- Next.js App Router
- React and TypeScript
- Supabase SSR/client/admin clients
- Tailwind CSS
- pnpm

## Main Structure

- `app/`: Next.js routes, layouts, pages, server actions, and API route handlers.
- `app/(main)/`: authenticated/main app pages such as matches, groups, globals, leaderboard, profile, rules, and admin.
- `app/api/admin/`: admin API endpoints for fetching data, resetting state, and calculating points.
- `components/`: reusable UI components grouped by feature.
- `lib/supabase/`: Supabase client factories for browser, server, and admin contexts.
- `lib/repositories/`: database access functions.
- `lib/scoring/`: scoring rules, point calculation, resets, and external data sync orchestration.
- `lib/external/`: integration with the World Cup 2026 API.
- `types/`: shared TypeScript types.
- `supabase/`: SQL initialization/migration files.
- `public/`: static assets.
- `.agents/skills/`: project skills with specialized guidance for framework, database, UI, and architecture tasks.

## Useful Commands

- `pnpm dev`: run the app locally on port `3001`.
- `pnpm build`: create a production build.
- `pnpm lint`: run ESLint.
- `pnpm exec tsc --noEmit --incremental false`: type-check without writing build info.
- `pnpm format:check`: check Prettier formatting.

## Conventions

- Prefer kebab-case for file names, including React component files.
- Keep feature-specific UI inside its feature folder under `components/` or `app/(main)/...`.
- Keep database logic in repositories instead of route handlers or components.
- Keep scoring/calculation logic in `lib/scoring/`.
- Use `@/` imports for cross-folder imports and relative imports for nearby files.
- Do not commit `.env.local`, `.next/`, or `node_modules/`.

## Notes For Agents

- Be careful with existing uncommitted changes; do not revert user work unless explicitly asked.
- Use the relevant skill from `.agents/skills/` when a task matches its domain, such as Next.js, React, Supabase/Postgres, Tailwind, frontend design, Node.js, TypeScript, or component composition.
- Admin routes depend on `requireAdmin` and the Supabase admin client.
- Supabase server code should use `lib/supabase/server.ts`; client components should use `lib/supabase/client.ts`.
- If renaming files, update every import and preserve Next.js route file names such as `page.tsx`, `layout.tsx`, and `route.ts`.

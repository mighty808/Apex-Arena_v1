# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Apex Arena Client — React 19 + TypeScript + Vite 7 frontend for an esports tournament platform (Ghana-focused). Supports two user roles: **player** and **organizer**, with role-based routing and dashboards.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — TypeScript check (`tsc -b`) then Vite production build
- `npm run lint` — ESLint on .ts/.tsx files
- `npm run preview` — Preview production build locally

No test framework is configured.

## Architecture

**Stack:** React 19, React Router 7 (nested routes), Tailwind CSS v4 (Vite plugin), Framer Motion, Lucide icons.

**Authentication flow:**
- `AuthProvider` (lib/auth-context.tsx) manages auth state via React Context + localStorage (key: `"apex_arenas_auth"`)
- On app mount: reads stored session → validates token via `/api/v1/auth/me` → handles 401 with refresh retry
- `ProtectedRoute` component gates `/auth/*` routes, redirects to `/login?next=<path>` if unauthenticated
- Token refresh runs on a 60-second background timer (token-refresh.utils.ts), refreshing when <2 min remaining

**API client** (utils/api.utils.ts):
- Custom fetch wrapper with automatic Bearer token injection, 401 retry with token refresh, GET request caching (100ms TTL), and idempotency keys for mutations
- Options: `skipAuth`, `skipIdempotency`, `skipCache`

**API endpoints** are centralized in config/api.config.ts with hardcoded base URL (`https://api-apexarenas.onrender.com`). No .env configuration exists.

**Routing structure:**
```
/ (Layout: Navbar + PageTransition + Footer)
├── /           → landing
├── /signup     → register
├── /login      → login
├── /forgot     → password reset
├── /verify-otp → email verification
├── /auth       → ProtectedRoute wrapper
│   ├── /       → Dashboard
│   ├── /organizer/profile, /organizer/create-tournament
│   └── /player/profile, /player/join-tournament
└── *           → 404
```

**Key patterns:**
- Auth service (services/auth.service.ts) uses a custom `ApiRequestError` class with error code → status mapping
- `assertSuccess<T>()` type guard for API responses
- Vanilla JS modal utility (components/modal.ts) with imperative show/close API
- DOM utilities (utils/dom.utils.ts) for imperative form manipulation alongside React components

## Styling

Tailwind CSS v4 with custom fonts: Rajdhani (display), Space Grotesk (body). Dark theme only (slate-950 bg, cyan/indigo gradient accents). Animations respect `prefers-reduced-motion`.

## TypeScript

Strict mode enabled. `noUnusedLocals` and `noUnusedParameters` enforced. Target: ES2022, module: ESNext with bundler resolution.

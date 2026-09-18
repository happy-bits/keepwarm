# KeepWarm CRM

## Repository Layout

- `backend/` is a TypeScript REST API using Hono, Drizzle ORM, and SQLite.
- `frontend/` is a React 19/Vite application using React Router, TanStack Query, and Tailwind CSS.
- Keep backend and frontend changes in their owning package unless a shared API contract requires both.

## Development Commands

Run commands from the package being changed:

### Backend

```bash
npm install
npm run dev
npm run build
npm run test:run
SEED_DB=true npm run dev
npm run db:seed
```

The backend listens on port `3000` by default. `DB_PATH` overrides the SQLite file path; otherwise it uses `backend/keepwarm.db` when started from `backend/`.

### Frontend

```bash
npm install
npm run dev
npm run build
npm run preview
```

The Vite dev server uses port `5173` and proxies `/api` and `/auth` to `http://localhost:3000`. Set `VITE_API_URL` only when the frontend must call a different API origin.

## Architecture and Conventions

- Add or change API endpoints in `backend/src/routes/`, then mount them in `backend/src/app.ts` when needed.
- Keep authentication and authorization behavior in `backend/src/middleware/auth.ts`; protected routes use bearer session tokens and admin-only operations require the admin guard.
- Keep schema changes, table initialization, and seed behavior aligned across `backend/src/db/schema.ts`, `backend/src/db/index.ts`, and `backend/src/db/seed.ts`.
- Backend route tests should use the in-memory database helpers in `backend/tests/setup.ts`, not the development SQLite file.
- In the frontend, keep API calls and response types in `frontend/src/api/`, auth state in `frontend/src/context/`, and reusable visual primitives in `frontend/src/components/ui/`.
- TanStack Query owns server-state fetching and cache invalidation. Clear or invalidate affected queries when mutations change data or authentication changes.
- Preserve the existing TypeScript strictness and ES module import style, including `.js` suffixes in backend source imports.

## Validation

- For backend changes, run `npm run build` and the relevant Vitest tests from `backend/`.
- For frontend changes, run `npm run build` from `frontend/`.
- For changes crossing the API boundary, run both package builds and exercise the affected authenticated flow with the backend running.
- Do not use `SEED_DB=true` or `/api/dev/reset` against production data; reset/seed behavior is for development only.

## Documentation

- Backend setup and endpoint overview: [backend/README.md](backend/README.md)
- Manual API checks: [backend/doc/manual-test.md](backend/doc/manual-test.md)
- Product behavior and roles: [backend/doc/userstories.md](backend/doc/userstories.md)
- SQL examples and table-oriented notes: [backend/sql/_examples.md](backend/sql/_examples.md)

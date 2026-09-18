---
name: getting-started
description: "Use when: helping someone start the KeepWarm app, find the dev commands, login with seeded users, understand backend/frontend wiring, or get oriented without fixing or starting anything."
---

# Getting Started

Use this skill when the user wants help starting the KeepWarm CRM site, logging in, or understanding how the app is put together.

## Workflow

1. First run the `troubleshoot` skill. Use its normal workflow and output rules before continuing.
2. Do not fix problems, edit files, install packages, seed the database, or start servers.
3. After the troubleshoot summary, explain the commands the user should run themselves.
4. Explain how to log in with seeded development users.
5. Give a short educational overview of how the frontend, backend, database, and authentication fit together.
6. End by suggesting a next step the user can ask for, such as fixing a reported issue, walking through the app, or explaining one part in more detail.

## Commands To Show

Tell the user to use two terminals from the project root.

Backend terminal:

```bash
cd backend
npm install
SEED_DB=true npm run dev
```

Frontend terminal:

```bash
cd frontend
npm install
npm run dev
```

Then tell them to open:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:3000/health`

Mention that `SEED_DB=true npm run dev` resets and seeds the development database on startup. If the user does not want to reset local dev data, use `npm run dev` instead after the database already exists.

## Login Information

Use `backend/src/db/seed.ts` as the source of truth for seeded development users. At the time this skill was written, the seeded users are:

| Email | Password | Role |
|-------|----------|------|
| `admin@keepwarm.com` | `admin123` | admin |
| `maria@sellmore.se` | `seller123` | seller |
| `lars@hotmail.com` | `seller123` | seller |

Explain the role behavior:

- Admin users can manage sellers and see all contacts.
- Seller users manage their own contacts.

If login fails, remind the user to start the backend with seeding enabled once, then refresh the frontend and try again.

## Educational Overview

Keep this concise and practical:

- The backend lives in `backend/` and is a Hono REST API on port `3000`.
- The frontend lives in `frontend/` and is a React/Vite app on port `5173`.
- Vite proxies `/api` and `/auth` requests from the frontend to the backend, so the browser can use the frontend URL while API calls still reach Hono.
- SQLite stores users, sessions, and contacts. Drizzle defines and queries the schema.
- Login posts to `/auth/login`; the backend returns a bearer session token; frontend auth state stores and sends that token on later API requests.
- TanStack Query fetches and refreshes server data such as contacts and sellers.

## Output Style

- Be clear and beginner-friendly, but keep the answer compact.
- Separate diagnostics, commands, login details, and architecture overview with short headings.
- If there are no broken checks and no warning checks, say only a few words that everything is fine and include a ✅ symbol.
- Do not claim the site is running unless the user says they started it.
- Do not run commands that start servers or change project state.
- Do not offer to fix anything until after the informational guidance is complete.
---
name: "Backend Routes"
description: "Use when adding or changing Hono backend routes, API endpoints, authentication, authorization, validation, or route tests in backend/src/routes."
applyTo: "backend/src/routes/**/*.ts"
---
# Backend Route Standards

- Implement routes with the existing Hono and Drizzle patterns. Mount protected routes under the authenticated `/api` app; use `adminOnly()` for admin-only route groups and explicit ownership checks for seller-scoped resources.
- Return consistent status codes: `200` for successful reads, updates, and deletes; `201` for creates; `400` for malformed IDs or invalid request data; `401` for missing or invalid authentication; `403` for failed authorization; `404` for missing resources; `409` for conflicts.
- Keep every error response shaped as `{ error: string }`. Use `c.json({ error: ... }, status)` and reuse messages from `backend/src/constants.ts`; do not expose database or implementation details.
- Validate JSON bodies with Zod and `zValidator`; validate route parameters before database access. Enforce required fields, formats, minimum lengths, and allowed update fields.
- Return only safe response fields, never password hashes, tokens, or other secrets. Add or update focused Vitest coverage for success, validation, authentication, authorization, not-found, and conflict cases relevant to the route.

---
name: repo-overview
description: Gives an overview of the KeepWarm repo (product intent, main domains) and how local branches differ from main. Use when the user asks for a repo overview, branch overview, how branches differ, or when onboarding to the repository.
---

# Repo overview

Execute `scripts/branch-overview.sh` (read-only; do not fetch, checkout, or commit):

```bash
bash .cursor/skills/repo-overview/scripts/branch-overview.sh
```

Then output, in this order:

1. The product map below (do not re-derive unless it clearly contradicts the current tree)
2. The script output as-is

Do not add file-level diffs unless asked.

## Product map

KeepWarm is a CRM for sellers to keep contacts warm (follow-ups and logged interactions).

| Area | Role |
|---|---|
| `frontend/` | React + Vite UI. Contacts, wastebin, interactions on a contact, sellers (admin). Session auth. |
| `backend/` | Hono API + SQLite/Drizzle. Auth, contacts, interactions, sellers. |
| Root | Biome, Husky, combined test scripts. |

Domains: **users** (admin \| seller) → **contacts** (owned by a seller; soft-delete / wastebin) → **interactions** (call, meeting, email, video_call, note).

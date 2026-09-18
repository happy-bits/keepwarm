---
name: troubleshoot
description: Diagnose startup and runtime problems for the KeepWarm app without fixing them. Show the issue clearly and ask whether the user wants it solved.
---

# Troubleshoot

Use this skill when the app is not starting, the backend/frontend is broken, or the database/auth setup looks wrong.

## Workflow

1. Always run the diagnostic script from the project root, even if this skill was already used earlier in the same session:
   `node .github/skills/troubleshoot/diagnose.mjs`
2. Read the returned JSON object.
3. Present the findings in a readable summary using emojis such as ✅, ❌, and ⚠️.
4. Clearly list the problems found and the affected checks.
5. Do not attempt to fix the issue automatically.
6. Only ask the user: "Would you like me to fix this issue?" if there are broken checks or warning checks that need attention.
7. If there are no broken checks and no warning checks, do not ask that question.

## Output format

Use the script result as the source of truth and format it like this:

- ✅ Healthy checks
- ❌ Broken checks
- ⚠️ Warning checks
- Summary of the most important problems
- Final question asking whether to solve it

## Important rules

- Always re-run the diagnostic script before reporting findings, even if the skill was already used this session.
- Never claim a fix was applied.
- Never invent missing details.
- Keep the output concise but helpful.
- If the script returns a JSON object with `status`, `summary`, `checks`, and `problems`, display that data in a human-friendly format.
- If there are no broken checks and no warning checks, end the summary without asking whether to fix it.
- Only ask whether the user wants the issue resolved when there are actual broken or warning checks to address.

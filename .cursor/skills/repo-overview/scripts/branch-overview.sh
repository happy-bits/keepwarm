#!/usr/bin/env bash
# Read-only local-branch overview vs main (or master).
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if git show-ref --verify --quiet refs/heads/main; then
  BASE=main
elif git show-ref --verify --quiet refs/heads/master; then
  BASE=master
else
  echo "No local main or master branch." >&2
  exit 1
fi

CURRENT=$(git rev-parse --abbrev-ref HEAD)
MAX_COMMITS=20
changed=$(git status --porcelain | wc -l | tr -d ' ')

echo "## Git"
echo
echo "- Base: \`$BASE\`"
echo "- Current: \`$CURRENT\`"
echo "- Working tree: $changed changed files"
echo
echo "## Local branches vs $BASE"
echo
echo "| Branch | Ahead | Behind | Last commit |"
echo "|---|---:|---:|---|"

git for-each-ref --format='%(refname:short)' --sort=refname refs/heads | while IFS= read -r branch; do
  ahead=$(git rev-list --count "${BASE}..${branch}")
  behind=$(git rev-list --count "${branch}..${BASE}")
  last=$(git log -1 --format='%h %ad %s' --date=short "$branch")
  mark=""
  if [ "$branch" = "$CURRENT" ]; then
    mark=" ← current"
  fi
  echo "| \`${branch}\`${mark} | ${ahead} | ${behind} | ${last} |"
done

echo
echo "## Unique commits (on branch, not on $BASE)"
echo

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

git for-each-ref --format='%(refname:short)' --sort=refname refs/heads | while IFS= read -r branch; do
  [ "$branch" = "$BASE" ] && continue
  ahead=$(git rev-list --count "${BASE}..${branch}")
  [ "$ahead" -eq 0 ] && continue
  {
    echo "### \`${branch}\` (${ahead})"
    echo
    echo '```'
    git log --oneline -n "$MAX_COMMITS" "${BASE}..${branch}"
    if [ "$ahead" -gt "$MAX_COMMITS" ]; then
      echo "... $((ahead - MAX_COMMITS)) more"
    fi
    echo '```'
    echo
  } >> "$tmp"
done

if [ ! -s "$tmp" ]; then
  echo "(none — every local branch is even with or behind \`$BASE\`)"
else
  cat "$tmp"
fi

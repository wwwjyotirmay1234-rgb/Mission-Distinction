#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# Sync to GitHub after every task merge
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "ERROR: GITHUB_PERSONAL_ACCESS_TOKEN is not set — GitHub sync cannot run." >&2
  echo "Add the secret in the Replit Secrets panel and re-run." >&2
  exit 1
fi

echo "Syncing to GitHub..."

# Resolve the target repo URL:
#   1. Use GITHUB_REPO_URL secret if set
#   2. Fall back to the 'origin' git remote
REPO_URL=""
if [ -n "$GITHUB_REPO_URL" ]; then
  REPO_URL="$GITHUB_REPO_URL"
else
  REPO_URL=$(git remote get-url origin 2>/dev/null || true)
fi

if [ -z "$REPO_URL" ]; then
  echo "ERROR: Cannot determine GitHub repo URL." >&2
  echo "Set the GITHUB_REPO_URL secret or add an 'origin' remote pointing to GitHub." >&2
  exit 1
fi

# Configure git identity if not set
git config user.email "replit-sync@noreply.github.com" 2>/dev/null || true
git config user.name "Replit Sync" 2>/dev/null || true

# Build an inline authenticated URL — credentials are never stored in .git/config
# Strip any existing userinfo from the URL before inserting the token
BARE_URL=$(echo "$REPO_URL" | sed 's|https://[^@]*@|https://|')
AUTHED_URL="${BARE_URL/https:\/\//https:\/\/x-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@}"

# Push HEAD to main without force — fails safely if remote has diverged
if git push "$AUTHED_URL" HEAD:main; then
  echo "GitHub sync complete."
else
  echo "ERROR: GitHub sync failed. The remote may have diverged from Replit." >&2
  echo "Resolve by fetching from GitHub and rebasing locally, then re-run the sync." >&2
  exit 1
fi

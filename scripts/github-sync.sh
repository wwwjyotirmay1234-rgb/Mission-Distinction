#!/bin/bash
# Watches for new git commits and automatically pushes them to GitHub.
# Uses a direct authenticated URL because Replit's sandbox prevents
# persisting named remotes in .git/config.
# Runs as a background workflow — no manual pushes needed.

REPO_URL="${GITHUB_REPO_URL}"
TOKEN="${GITHUB_TOKEN}"
REF_FILE=".git/refs/heads/main"
LAST_SHA=""

if [ -z "$REPO_URL" ] || [ -z "$TOKEN" ]; then
  echo "[github-sync] GITHUB_REPO_URL or GITHUB_TOKEN not set — sync disabled."
  exit 0
fi

BARE_URL="${REPO_URL#https://}"
AUTH_URL="https://x-access-token:${TOKEN}@${BARE_URL}"

push_to_github() {
  CRED_FILE=$(mktemp)
  chmod 600 "$CRED_FILE"
  echo "$AUTH_URL" > "$CRED_FILE"
  git -c credential.helper="store --file=$CRED_FILE" push "$AUTH_URL" main:main --quiet 2>&1
  local EXIT_CODE=$?
  rm -f "$CRED_FILE"
  return $EXIT_CODE
}

verify_sha_parity() {
  local LOCAL_SHA
  local REMOTE_SHA
  LOCAL_SHA=$(git rev-parse main 2>/dev/null)
  REMOTE_SHA=$(git ls-remote "$AUTH_URL" refs/heads/main 2>/dev/null | awk '{print $1}')
  if [ -n "$LOCAL_SHA" ] && [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
    echo "[github-sync] ✓ SHA parity confirmed: local=remote=${LOCAL_SHA:0:8}"
  elif [ -n "$REMOTE_SHA" ]; then
    echo "[github-sync] WARNING: SHA mismatch — local=${LOCAL_SHA:0:8} remote=${REMOTE_SHA:0:8}"
  fi
}

# Perform initial push on startup to ensure remote is in sync
echo "[github-sync] Performing initial push to GitHub..."
if push_to_github; then
  echo "[github-sync] ✓ Initial push successful (target: ${REPO_URL})"
  verify_sha_parity
else
  echo "[github-sync] Initial push failed — will retry on next commit."
fi

echo "[github-sync] Watching for new commits on main..."

while true; do
  if [ -f "$REF_FILE" ]; then
    CURRENT_SHA=$(cat "$REF_FILE" 2>/dev/null)
    if [ -n "$CURRENT_SHA" ] && [ "$CURRENT_SHA" != "$LAST_SHA" ]; then
      if [ -n "$LAST_SHA" ]; then
        echo "[github-sync] New commit detected: ${CURRENT_SHA:0:8} — pushing to GitHub..."
        if push_to_github; then
          echo "[github-sync] ✓ Pushed ${CURRENT_SHA:0:8} to GitHub."
          verify_sha_parity
        else
          echo "[github-sync] Push failed — will retry next cycle."
        fi
      fi
      LAST_SHA="$CURRENT_SHA"
    fi
  fi
  sleep 15
done

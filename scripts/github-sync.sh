#!/bin/bash
# Watches for new git commits and automatically pushes them to GitHub.
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

echo "[github-sync] Watching for new commits on main..."

push_to_github() {
  CRED_FILE=$(mktemp)
  chmod 600 "$CRED_FILE"
  echo "https://x-access-token:${TOKEN}@${BARE_URL}" > "$CRED_FILE"
  git -c credential.helper="store --file=$CRED_FILE" push "https://${BARE_URL}" main --quiet 2>&1
  local EXIT_CODE=$?
  rm -f "$CRED_FILE"
  return $EXIT_CODE
}

while true; do
  if [ -f "$REF_FILE" ]; then
    CURRENT_SHA=$(cat "$REF_FILE" 2>/dev/null)
    if [ -n "$CURRENT_SHA" ] && [ "$CURRENT_SHA" != "$LAST_SHA" ]; then
      if [ -n "$LAST_SHA" ]; then
        echo "[github-sync] New commit detected: ${CURRENT_SHA:0:8} — pushing to GitHub..."
        if push_to_github; then
          echo "[github-sync] ✓ Pushed ${CURRENT_SHA:0:8} to GitHub."
        else
          echo "[github-sync] Push failed — will retry next cycle."
        fi
      fi
      LAST_SHA="$CURRENT_SHA"
    fi
  fi
  sleep 15
done

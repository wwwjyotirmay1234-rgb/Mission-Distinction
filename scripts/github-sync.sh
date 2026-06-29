#!/bin/bash
# Watches for new git commits and automatically pushes them to GitHub.
# Before each push, fetches remote main and rebases local commits on top of it
# so non-fast-forward rejections are resolved automatically.
# Uses a temp credential helper so the token is never stored in .git/config.
# Runs as a background workflow — no manual pushes needed.

REPO_URL="${GITHUB_REPO_URL}"
# Prefer GITHUB_PERSONAL_ACCESS_TOKEN (classic PAT with workflow scope) over
# GITHUB_TOKEN, which is a fine-grained PAT that lacks workflow scope and
# will be rejected when pushing commits that touch .github/workflows/*.
TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-${GITHUB_TOKEN}}"
REF_FILE=".git/refs/heads/main"
LAST_SHA=""
FAIL_COUNT=0

if [ -z "$REPO_URL" ] || [ -z "$TOKEN" ]; then
  echo "[github-sync] GITHUB_REPO_URL and a GitHub token (GITHUB_PERSONAL_ACCESS_TOKEN or GITHUB_TOKEN) must be set — sync disabled."
  exit 0
fi

BARE_URL="${REPO_URL#https://}"
AUTH_URL="https://x-access-token:${TOKEN}@${BARE_URL}"
REMOTE_TRACKING_REF="refs/remotes/github-sync/main"

make_cred_file() {
  local CRED_FILE
  CRED_FILE=$(mktemp)
  chmod 600 "$CRED_FILE"
  echo "https://x-access-token:${TOKEN}@${BARE_URL}" > "$CRED_FILE"
  echo "$CRED_FILE"
}

verify_sha_parity() {
  local CRED_FILE
  CRED_FILE=$(make_cred_file)
  local LOCAL_SHA
  LOCAL_SHA=$(git rev-parse main 2>/dev/null)
  local REMOTE_SHA
  REMOTE_SHA=$(git -c credential.helper="store --file=$CRED_FILE" ls-remote "$AUTH_URL" refs/heads/main 2>/dev/null | awk '{print $1}')
  rm -f "$CRED_FILE"
  if [ -n "$LOCAL_SHA" ] && [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
    echo "[github-sync] ✓ SHA parity confirmed: local=remote=${LOCAL_SHA:0:8}"
    return 0
  elif [ -n "$REMOTE_SHA" ]; then
    echo "[github-sync] WARNING: SHA mismatch — local=${LOCAL_SHA:0:8} remote=${REMOTE_SHA:0:8}"
    return 1
  fi
}

# Fetch remote main into a local tracking ref, rebase local commits on top,
# then push. Falls back to a merge commit if rebase has conflicts.
reconcile_and_push() {
  local CRED_FILE
  CRED_FILE=$(make_cred_file)

  # ── Step 1: Try a normal fast-forward push first ──────────────────────────
  local PUSH_OUT
  PUSH_OUT=$(git -c credential.helper="store --file=$CRED_FILE" \
    push "$AUTH_URL" main:main 2>&1)
  local PUSH_CODE=$?

  if [ $PUSH_CODE -eq 0 ]; then
    rm -f "$CRED_FILE"
    return 0
  fi

  echo "[github-sync] Push rejected: $PUSH_OUT"

  # ── Step 2: If rejected due to diverged history, fetch and reconcile ──────
  if echo "$PUSH_OUT" | grep -qE "rejected.*(non-fast-forward|fetch first)"; then
    echo "[github-sync] History diverged — fetching remote main..."

    local FETCH_OUT
    FETCH_OUT=$(git -c credential.helper="store --file=$CRED_FILE" \
      fetch "$AUTH_URL" "refs/heads/main:${REMOTE_TRACKING_REF}" 2>&1)
    local FETCH_CODE=$?

    if [ $FETCH_CODE -ne 0 ]; then
      echo "[github-sync] Fetch failed: $FETCH_OUT"
      rm -f "$CRED_FILE"
      return 1
    fi

    echo "[github-sync] Fetch OK — attempting rebase onto ${REMOTE_TRACKING_REF}..."
    local REBASE_OUT
    REBASE_OUT=$(git rebase "$REMOTE_TRACKING_REF" 2>&1)
    local REBASE_CODE=$?

    if [ $REBASE_CODE -ne 0 ]; then
      echo "[github-sync] Rebase had conflicts — aborting, falling back to merge..."
      git rebase --abort 2>/dev/null
      local MERGE_OUT
      MERGE_OUT=$(git merge --no-ff "$REMOTE_TRACKING_REF" \
        -m "chore: merge remote GitHub changes into local main" 2>&1)
      local MERGE_CODE=$?
      if [ $MERGE_CODE -ne 0 ]; then
        echo "[github-sync] Merge also failed: $MERGE_OUT — manual intervention required."
        rm -f "$CRED_FILE"
        return 1
      fi
      echo "[github-sync] Merge commit created."
    else
      echo "[github-sync] Rebase OK."
    fi

    # ── Step 3: Retry push after reconciliation ────────────────────────────
    echo "[github-sync] Retrying push after reconciliation..."
    PUSH_OUT=$(git -c credential.helper="store --file=$CRED_FILE" \
      push "$AUTH_URL" main:main 2>&1)
    PUSH_CODE=$?
    if [ $PUSH_CODE -ne 0 ]; then
      echo "[github-sync] Push after reconciliation failed: $PUSH_OUT"
    fi
  fi

  rm -f "$CRED_FILE"
  return $PUSH_CODE
}

# Perform initial push on startup to ensure remote is in sync
echo "[github-sync] Performing initial push to GitHub (target: ${REPO_URL})..."
if reconcile_and_push; then
  echo "[github-sync] ✓ Initial push successful"
  verify_sha_parity
  FAIL_COUNT=0
else
  echo "[github-sync] Initial push failed — will retry on next commit."
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo "[github-sync] Watching for new commits on main..."

while true; do
  if [ -f "$REF_FILE" ]; then
    CURRENT_SHA=$(cat "$REF_FILE" 2>/dev/null)
    if [ -n "$CURRENT_SHA" ] && [ "$CURRENT_SHA" != "$LAST_SHA" ]; then
      if [ -n "$LAST_SHA" ]; then
        echo "[github-sync] New commit detected: ${CURRENT_SHA:0:8} — pushing to GitHub..."
        if reconcile_and_push; then
          echo "[github-sync] ✓ Pushed ${CURRENT_SHA:0:8} to GitHub."
          verify_sha_parity
          FAIL_COUNT=0
        else
          FAIL_COUNT=$((FAIL_COUNT + 1))
          echo "[github-sync] Push failed (attempt $FAIL_COUNT) — will retry next cycle."
          if [ $FAIL_COUNT -ge 3 ]; then
            echo "[github-sync] ACTION REQUIRED: Push has failed $FAIL_COUNT times. Check token permissions and repository access."
          fi
        fi
      fi
      LAST_SHA="$CURRENT_SHA"
    fi
  fi
  sleep 15
done

#!/usr/bin/env bash
set -euo pipefail

# Configure GitHub repository settings for squash-merge-only workflow.
# Usage: scripts/configure-repo.sh [owner/repo]
#   If owner/repo is omitted, the current repository is auto-detected.

command -v gh &>/dev/null || {
  echo "Error: gh is required but not found"
  exit 1
}

repo="${1:-}"
if [[ -z "$repo" ]]; then
  repo="$(gh repo view --json nameWithOwner --jq '.nameWithOwner')"
  echo "Auto-detected repository: $repo"
fi

echo "=== Configuring repository: $repo ==="

# Merge strategy (squash only), auto-delete branches
echo "Applying repository settings..."
gh repo edit "$repo" \
  --enable-squash-merge \
  --enable-merge-commit=false \
  --enable-rebase-merge=false \
  --delete-branch-on-merge

# Squash merge commit title & message (requires REST API)
echo "Setting squash merge defaults (PR_TITLE + PR_BODY)..."
gh api "repos/$repo" \
  --method PATCH \
  --field squash_merge_commit_title=PR_TITLE \
  --field squash_merge_commit_message=PR_BODY \
  --silent

# Verify
echo ""
echo "=== Current settings ==="
gh api "repos/$repo" --jq '
  "  default_branch:             \(.default_branch)",
  "  allow_squash_merge:         \(.allow_squash_merge)",
  "  allow_merge_commit:         \(.allow_merge_commit)",
  "  allow_rebase_merge:         \(.allow_rebase_merge)",
  "  delete_branch_on_merge:     \(.delete_branch_on_merge)",
  "  squash_merge_commit_title:  \(.squash_merge_commit_title)",
  "  squash_merge_commit_message: \(.squash_merge_commit_message)"
' | cat

echo ""
echo "=== Repository configuration complete ==="

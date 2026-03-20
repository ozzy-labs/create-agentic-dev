#!/usr/bin/env bash
set -euo pipefail

# Apply GitHub rulesets from JSON definitions.
# Usage: scripts/apply-rulesets.sh [owner/repo]
#   If owner/repo is omitted, the current repository is auto-detected.
#
# Idempotent: updates existing rulesets by name, creates new ones if absent.
# Note: Rulesets API requires GitHub Pro, Team, or public repositories.

for cmd in gh jq; do
  command -v "$cmd" &>/dev/null || {
    echo "Error: $cmd is required but not found"
    exit 1
  }
done

repo="${1:-}"
if [[ -z "$repo" ]]; then
  repo="$(gh repo view --json nameWithOwner --jq '.nameWithOwner')"
  echo "Auto-detected repository: $repo"
fi

root="$(git rev-parse --show-toplevel)"
rulesets_dir="$root/.github/rulesets"

if [[ ! -d "$rulesets_dir" ]]; then
  echo "No rulesets directory found at $rulesets_dir"
  exit 0
fi

echo "=== Applying rulesets to: $repo ==="

for file in "$rulesets_dir"/*.json; do
  [[ -f "$file" ]] || continue

  name="$(jq -r '.name' "$file")"
  echo ""
  echo "Processing ruleset: $name ($(basename "$file"))"

  # Check if ruleset already exists
  existing_id="$(
    gh api "repos/$repo/rulesets" \
      --jq ".[] | select(.name == \"$name\") | .id" \
      2>/dev/null || true
  )"

  if [[ -n "$existing_id" ]]; then
    echo "  Updating existing ruleset (id: $existing_id)..."
    gh api "repos/$repo/rulesets/$existing_id" \
      --method PUT \
      --input "$file" \
      --silent
    echo "  Updated."
  else
    echo "  Creating new ruleset..."
    gh api "repos/$repo/rulesets" \
      --method POST \
      --input "$file" \
      --silent
    echo "  Created."
  fi
done

echo ""
echo "=== Rulesets applied ==="

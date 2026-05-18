#!/usr/bin/env bash

set -euo pipefail

MSG_FILE="${1:-}"

if [[ -z "$MSG_FILE" || ! -f "$MSG_FILE" ]]; then
  echo "Commit message file not found."
  exit 1
fi

MSG="$(head -n 1 "$MSG_FILE" | tr -d '\r')"

# Skip merge/revert commits
if [[ "$MSG" =~ ^(Merge|Revert)\  ]]; then
  exit 0
fi

# Conventional commit regex
# type(scope)!: subject
REGEX='^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)(\([a-z0-9-]+\))?(!)?: .{1,}$'

if ! echo "$MSG" | grep -Eq "$REGEX"; then
  echo ""
  echo "Invalid commit message format"
  echo ""
  echo "Expected:"
  echo "  type(scope): subject"
  echo ""
  echo "Allowed types:"
  echo "  feat, fix, chore, docs, style,"
  echo "  refactor, perf, test, build, ci, revert"
  echo ""
  echo "Examples:"
  echo "  feat(auth): add refresh token"
  echo "  fix(ui): resolve mobile navbar bug"
  echo "  chore(deps): update eslint config"
  echo "  refactor(api)!: remove deprecated endpoints"
  echo ""
  exit 1
fi

# prevent uppercase first letter of subject
SUBJECT="$(echo "$MSG" | sed -E 's/^[^:]+: //')"

if [[ "$SUBJECT" =~ ^[A-Z] ]]; then
  echo "Subject should start with lowercase."
  echo "Example:"
  echo "  feat(auth): add refresh token"
  exit 1
fi

echo "Commit message valid"

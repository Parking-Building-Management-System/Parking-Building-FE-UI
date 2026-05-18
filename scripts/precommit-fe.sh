#!/usr/bin/env bash
set -e

echo "Running Type Check..."
bun run check-types

echo "Running ESLint..."
bun run lint . --max-warnings=0

echo "Running Prettier..."
bun run format

echo "FE Pre-commit checks passed!"

#!/usr/bin/env bash
set -e

if ! command -v pre-commit &> /dev/null; then
    echo "Installing pre-commit via pip..."
    pip3 install pre-commit
fi

pre-commit install
pre-commit install --hook-type commit-msg

echo "Pre-commit hooks installed successfully!"

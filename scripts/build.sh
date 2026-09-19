#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

command -v pnpm >/dev/null 2>&1 || corepack enable

echo "Installing dependencies..."
pnpm install --prod=false

echo "Building the project..."
pnpm run build

echo "Build completed successfully!"

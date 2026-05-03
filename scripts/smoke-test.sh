#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

COMPOSE_FILE="${1:-infra/docker-compose.test.yml}"
PROJECT_NAME="rawswap-smoke"
SMOKE_API_URL="${SMOKE_API_URL:-http://localhost:3001}"
SMOKE_EXECUTION_TOKEN_SECRET="${SMOKE_EXECUTION_TOKEN_SECRET:-rawswap-smoke-test-secret}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker CLI is required to run smoke tests."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Start Docker Desktop or another local Docker runtime, then retry."
  exit 1
fi

cleanup() {
  echo "Tearing down containers..."
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

echo "Starting services..."
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d --build --wait

echo "Running DB migrations..."
DATABASE_URL="postgres://rawswap:rawswap@localhost:5432/rawswap" pnpm db:migrate

echo "Running smoke tests..."
SMOKE_API_URL="$SMOKE_API_URL" \
SMOKE_EXECUTION_TOKEN_SECRET="$SMOKE_EXECUTION_TOKEN_SECRET" \
  pnpm --filter @rawswap/api exec vitest run --config ../../tests/smoke/vitest.config.mts

echo "Smoke tests passed."

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-8080}"
DEVICE="${DEVICE:-iPhone 12}"
OUT_DIR="${1:-$ROOT_DIR/docs/qa/screenshots-$(date +%Y%m%d-%H%M%S)}"

URLS=(
  "index.html"
  "menu/index.html"
  "reserva/index.html"
)

BROWSERS=(
  "chromium"
  "firefox"
  "webkit"
)

mkdir -p "$OUT_DIR"

pushd "$ROOT_DIR" >/dev/null
python3 -m http.server "$PORT" >/tmp/lacasita-http-server.log 2>&1 &
SERVER_PID=$!
popd >/dev/null

cleanup() {
  if ps -p "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

sleep 1

for browser in "${BROWSERS[@]}"; do
  for page in "${URLS[@]}"; do
    output_file="$OUT_DIR/${browser}-mobile-${page//\//_}.png"
    npx --yes playwright screenshot \
      --browser "$browser" \
      --device "$DEVICE" \
      --wait-for-timeout 900 \
      "http://127.0.0.1:${PORT}/${page}" \
      "$output_file"
  done
done

echo "Screenshots generated at: $OUT_DIR"

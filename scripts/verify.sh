#!/usr/bin/env bash
# verify.sh — typecheck + boot vite, probe given module paths return 200, then stop server.
# usage: bash scripts/verify.sh [src/a.ts src/b.ts ...]
set -u
cd "$(dirname "$0")/.."

echo "== tsc =="
npx tsc --noEmit || { echo "TSC FAILED"; exit 1; }
echo "tsc clean"

echo "== vite =="
npm run dev > /tmp/vite.log 2>&1 &
sleep 3
PORT=$(grep -oE 'localhost:[0-9]+' /tmp/vite.log | head -1 | cut -d: -f2)
PORT=${PORT:-5173}

probes=("$@")
[ ${#probes[@]} -eq 0 ] && probes=(src/main.ts)
ok=1
for f in "${probes[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/$f")
  echo "$code <- $f"
  [ "$code" = "200" ] || ok=0
done
grep -i error /tmp/vite.log && ok=0

# stop vite (no ps/pkill in this container — match via /proc)
for d in /proc/[0-9]*; do
  if grep -qa vite "$d/cmdline" 2>/dev/null; then
    kill "$(basename "$d")" 2>/dev/null
  fi
done

[ "$ok" = "1" ] && echo "VERIFY OK" || { echo "VERIFY FAILED"; exit 1; }

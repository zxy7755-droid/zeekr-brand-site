#!/bin/bash
# Idempotent staging deployment on the deploy CVM (run as the `deploy` user).
# Usage: bash /opt/zeekr/deploy.sh <git-sha>
# Rolls back to the previous runtime env if the health check fails.
set -euo pipefail

SHA=${1:?usage: deploy.sh <git-sha>}
ROOT=/opt/zeekr
ENV_FILE="$ROOT/.env.runtime"
PREV_FILE="$ROOT/.env.previous"
COMPOSE="$ROOT/compose.yaml"
LOG="$ROOT/logs/deploy.log"

mkdir -p "$ROOT/logs"
exec > >(tee -a "$LOG") 2>&1
echo "=== deploy start $(date -Is) sha=$SHA ==="

# 1. DB URL comes from the 600-permission file, never from the repo.
set -a
# shellcheck disable=SC1091
. /etc/zeekr/mysql.env
set +a
: "${DATABASE_URL_STAGE:?DATABASE_URL_STAGE missing}"

# 2. Save the previous known-good config for rollback.
if [ -f "$ENV_FILE" ]; then cp "$ENV_FILE" "$PREV_FILE"; fi

cat > "$ENV_FILE.tmp" <<EOF
IMAGE_TAG=$SHA
DATABASE_URL=$DATABASE_URL_STAGE
EOF
chmod 600 "$ENV_FILE.tmp"
mv "$ENV_FILE.tmp" "$ENV_FILE"

# 3. Pull and recreate only the staging services.
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" pull
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" up -d --remove-orphans

# 4. Health check: API must report db ok, then web must answer 200.
ok=0
for i in $(seq 1 30); do
  api_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:3001/health || true)
  web_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:3000/ || true)
  if [ "$api_code" = "200" ] && [ "$web_code" = "200" ]; then
    ok=1
    break
  fi
  sleep 4
done

if [ "$ok" != "1" ]; then
  echo "::error::health check failed; rolling back"
  if [ -f "$PREV_FILE" ]; then
    cp "$PREV_FILE" "$ENV_FILE"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE" up -d --remove-orphans
    echo "rolled back to previous tag: $(grep '^IMAGE_TAG=' "$ENV_FILE")"
  fi
  exit 1
fi

echo "=== deploy success sha=$SHA $(date -Is) ==="

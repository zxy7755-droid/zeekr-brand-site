#!/bin/bash
# Idempotent production promotion on the deploy CVM (run as the `deploy` user).
# Usage: bash /opt/zeekr/deploy-prod.sh <git-sha>
# Only runs after staging has been verified for the same sha.
# Rolls back to the previous runtime env if the health check fails.
set -euo pipefail

SHA=${1:?usage: deploy-prod.sh <git-sha>}
ROOT=/opt/zeekr
ENV_FILE="$ROOT/.env.runtime.prod"
PREV_FILE="$ROOT/.env.previous.prod"
COMPOSE="$ROOT/compose.prod.yaml"
LOG="$ROOT/logs/deploy-prod.log"

mkdir -p "$ROOT/logs"
exec > >(tee -a "$LOG") 2>&1
echo "=== prod promotion start $(date -Is) sha=$SHA ==="

set -a
# shellcheck disable=SC1091
. /etc/zeekr/mysql.env
set +a
: "${DATABASE_URL_PROD:?DATABASE_URL_PROD missing}"

if [ -f "$ENV_FILE" ]; then cp "$ENV_FILE" "$PREV_FILE"; fi

cat > "$ENV_FILE.tmp" <<EOF
IMAGE_TAG=$SHA
DATABASE_URL=$DATABASE_URL_PROD
EOF
chmod 600 "$ENV_FILE.tmp"
mv "$ENV_FILE.tmp" "$ENV_FILE"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE" pull
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" up -d --remove-orphans

ok=0
for i in $(seq 1 30); do
  api_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:3003/health || true)
  web_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:3002/ || true)
  if [ "$api_code" = "200" ] && [ "$web_code" = "200" ]; then
    ok=1
    break
  fi
  sleep 4
done

if [ "$ok" != "1" ]; then
  echo "::error::prod health check failed; rolling back"
  if [ -f "$PREV_FILE" ]; then
    cp "$PREV_FILE" "$ENV_FILE"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE" up -d --remove-orphans
    echo "rolled back to previous tag: $(grep '^IMAGE_TAG=' "$ENV_FILE")"
  fi
  exit 1
fi

echo "=== prod promotion success sha=$SHA $(date -Is) ==="

#!/usr/bin/env bash
# 硬门禁：lint → typecheck → 单测 → 前端 build → 契约测试
# 常量定义处：docs/delivery/design.md。任何路径改动必须先改文档再改这里。
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="apps/web"
API_DIR="apps/api"
OPENAPI_SPEC="docs/api/openapi.yaml"
DESIGN_DOC="docs/delivery/design.md"
LOG_DIR="reports"
LOG_FILE="${LOG_DIR}/hard-gate.log"

cd "$REPO_ROOT" || { echo "[gate] 无法进入仓库根目录: $REPO_ROOT" >&2; exit 1; }
mkdir -p "$LOG_DIR"
: > "$LOG_FILE"

log() { printf '%s %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*" | tee -a "$LOG_FILE"; }

fail() { log "[FAIL] $*"; log "[gate] 已中断，日志: $LOG_FILE"; exit 1; }

require_dir() {
  [ -d "$1" ] || fail "目录不存在: $1（检查 design.md 的路径常量）"
}

step() {
  local name="$1" path="$2" script="$3"
  log "[step] ${name} -> npm run ${script} (cwd=${path})"
  ( cd "$REPO_ROOT/$path" && npm run "$script" 2>&1 | tee -a "$REPO_ROOT/$LOG_FILE" )
  local code=${PIPESTATUS[0]}
  [ "$code" -eq 0 ] || fail "${name} 失败，exit ${code}"
  log "[ok] ${name}"
}

log "[gate] repo=${REPO_ROOT}"
log "[gate] node=$(node -v 2>/dev/null || echo missing) npm=$(npm -v 2>/dev/null || echo missing)"

require_dir "$WEB_DIR"
require_dir "$API_DIR"
[ -f "$OPENAPI_SPEC" ] || fail "缺少契约文件: $OPENAPI_SPEC"
[ -f "$DESIGN_DOC" ] || fail "缺少设计文档: $DESIGN_DOC"

step "web lint" "$WEB_DIR" lint
step "web typecheck" "$WEB_DIR" typecheck
step "api lint" "$API_DIR" lint
step "api typecheck" "$API_DIR" typecheck
step "api unit test" "$API_DIR" test
step "web build" "$WEB_DIR" build
step "api contract test" "$API_DIR" test:contract

if [ -d "$REPO_ROOT/$WEB_DIR/node_modules" ] && [ ! -d "$REPO_ROOT/$API_DIR/node_modules" ]; then
  log "[warn] 仅检到 web 依赖，api 测试可能未真实执行"
fi

for forbidden in "$WEB_DIR/node_modules" "$API_DIR/node_modules" "$WEB_DIR/.next" "$API_DIR/dist"; do
  if [ -d "$REPO_ROOT/$forbidden" ]; then
    log "[info] 构建产物存在（应由 .gitignore 排除）: $forbidden"
  fi
done

log "[gate] ALL PASSED"
exit 0

# P0 工程契约摘要

本文是**常量唯一定义处**。脚本、CI、前端、后端三处引用的路径与变量必须与此处一致；
修改时必须同步改：本文件 → `scripts/hard-gate.sh` → `.github/workflows/ci.yml` → `apps/web/src/lib/contract.ts` → `apps/api/src/contract.ts`。

## 1. 路径常量

| 常量 | 值 | 含义 |
| --- | --- | --- |
| `WEB_DIR` | `apps/web` | 前端工程根目录 |
| `API_DIR` | `apps/api` | 后端工程根目录 |
| `OPENAPI_SPEC` | `docs/api/openapi.yaml` | 接口契约文件 |
| `DESIGN_DOC` | `docs/delivery/design.md` | 本文所在位置 |
| `HARD_GATE_LOG` | `reports/hard-gate.log` | 门禁日志输出 |
| `SOP_FILE` | `sop/fullstack-delivery.json` | 交付 SOP 定义 |

> 禁止出现的字样：`cd backend`、`cd frontend`、`cd web`、`cd api`。
> 所有脚本一律先 `cd "$REPO_ROOT/$WEB_DIR"` 或 `cd "$REPO_ROOT/$API_DIR"`，
> 目录不存在时以明确的错误信息退出（exit 1），不能靠隐式失败产生 exit 2。

## 2. 运行时变量

| 变量 | 默认值 | 消费方 | 说明 |
| --- | --- | --- | --- |
| `BASE_PATH` | `/` | `apps/web`（`next.config.mjs` 的 `basePath`） | 站点挂载前缀。本地为 `/`，部署到子路径时由 `NEXT_PUBLIC_BASE_PATH` 覆盖；不得包含尾部斜杠 |
| `API_BASE_URL` | `http://localhost:3001` | `apps/web` | 前端请求后端的基地址；禁止在组件内硬编码域名，统一走 `src/lib/contract.ts` 的 `apiUrl()` |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/zeekr` | `apps/api`（Prisma） | CI 中由 PostgreSQL service 注入；本地由 `.env.local` 提供，不入库 |
| `PORT` | `3001` | `apps/api` | 后端监听端口 |

### BASE_PATH 与 API_BASE_URL 的关系

两者相互独立：`BASE_PATH` 只影响前端路由前缀，`API_BASE_URL` 只影响请求目标。
后端接口不上挂载前缀（`app.setGlobalPrefix('')`），避免前后端前缀耦合。

## 3. 路由契约

接口路径以 `docs/api/openapi.yaml` 为准，`apps/api/src/contract.ts` 的 `RESOURCE_ROUTES` 是代码侧镜像：

| 资源 | 路径 | 方法 |
| --- | --- | --- |
| 健康检查 | `/health` | GET |
| 车型 | `/vehicles`、`/vehicles/{slug}` | GET |
| 预约试驾线索 | `/test-drive-leads` | POST |
| 门店 | `/stores` | GET |
| 资讯 | `/news` | GET |

## 4. 脚本契约

`apps/web/package.json` 与 `apps/api/package.json` 必须提供下列同名脚本，CI 与 `hard-gate.sh` 直接调用：

| 脚本 | web | api |
| --- | --- | --- |
| `lint` | `eslint . --ext .ts,.tsx --max-warnings 0` | `eslint . --ext .ts --max-warnings 0` |
| `typecheck` | `tsc --noEmit` | `tsc --noEmit` |
| `build` | `next build` | `tsc -p tsconfig.build.json` |
| `test` | `node --test test/*.test.ts` | `jest --passWithNoTests` |
| `test:contract` | — | 校验 OpenAPI 契约 |

## 5. 准入规则

1. 不接 mock 数据：前端只能读真实 `API_BASE_URL`，无 fixture 回退分支
2. 不提交 `node_modules`、`dist`、`.next`、`.env*`、`reports/`
3. CI 使用 Node 20 + 默认 npm registry；沙箱侧 `npmmirror` 仅为加速，不得写进仓库配置
4. 硬门禁必须真实 `exit 0`，日志落入 `reports/hard-gate.log`
5. 仓库内不得出现官方 Logo、车型图、官方文案原文；占位素材统一放 `apps/web/public/placeholder/`

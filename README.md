# ZEEKR Brand Site

极氪品牌网站（ZEEKR Brand Site）前后端一体化项目。本仓库是正式项目的第一条交付基线（P0 立项骨架）。

## 项目定位

面向品牌展示与留资转化的官网站点，覆盖车型展示、预约试驾线索、门店查询、资讯内容四类业务域。

- 交付方式：LoopForge 按 `sop/fullstack-delivery.json` 派发 SOP 自动交付，云沙箱跑硬门禁
- 源码与流水线：GitHub 托管源码、Pull Request 评审、GitHub Actions CI

## 技术栈

| 层 | 选型 |
| --- | --- |
| 前端 | Next.js（App Router）+ TypeScript |
| 后端 | NestJS + TypeScript |
| ORM | Prisma |
| 数据库 | PostgreSQL |
| CI | GitHub Actions（Node 20） |

## 目录结构

```text
apps/
  web/                  Next.js 前端（BASE_PATH 前缀挂载）
  api/                  NestJS 后端（REST + OpenAPI）
docs/
  api/openapi.yaml      接口契约（web/api 共用，contract-check 校验存在性）
  delivery/design.md    P0 工程契约摘要（路径常量与运行时变量定义）
sop/
  fullstack-delivery.json   9 节点交付 SOP（DAG，仅 rejectTo + maxReworks）
scripts/
  hard-gate.sh          本地/云沙箱硬门禁脚本，日志写 reports/hard-gate.log
.github/workflows/
  ci.yml                PR 与 push 触发的 lint / typecheck / build / test / 契约校验
reports/                硬门禁与测试日志（不入库）
```

## 工程契约（先定死，再实现）

| 常量 | 值 | 用途 |
| --- | --- | --- |
| `WEB_DIR` | `apps/web` | 前端根目录，脚本与 CI 共用 |
| `API_DIR` | `apps/api` | 后端根目录，脚本与 CI 共用 |
| `BASE_PATH` | `/` | 前端路由前缀（Next.js `basePath`） |
| `API_BASE_URL` | `http://localhost:3001` | 前端访问后端的地址 |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/zeekr` | Prisma 连接串 |

完整定义见 `docs/delivery/design.md`。脚本里禁止出现 `cd backend` / `cd frontend` 这类臆造路径，一律引用上述常量。

## 本地启动

环境要求：Node 20+、npm 10+、PostgreSQL 14+（可选，`apps/api` 单测与契约测试不依赖真实库）。

```bash
# 1. 安装依赖（仓库不提交 node_modules，必须现场安装）
npm ci --prefix apps/web
npm ci --prefix apps/api

# 2. 启动 PostgreSQL 后初始化数据库（可选，仅本地联调需要）
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zeekr"
npm run prisma:generate --prefix apps/api
export $(grep -v '^#' .env.local 2>/dev/null | xargs) || true

# 3. 分别启动后端与前端
npm run dev --prefix apps/api    # http://localhost:3001
npm run dev --prefix apps/web    # http://localhost:3000
```

## 硬门禁与 CI

```bash
bash scripts/hard-gate.sh    # 依次：lint → typecheck → 单测 → 前端 build → 契约测试
cat reports/hard-gate.log
```

脚本必须真实退出码为 0 才算通过，任一环节失败即中断并保留日志。CI（`.github/workflows/ci.yml`）分三个 job：`web`、`api`、`contract-check`。GitHub 境外 runner 使用默认 npm registry，沙箱侧若配置了 `npmmirror` 镜像，CI 中会显式覆盖回默认源。

## 品牌合规声明

本仓库**不包含**任何极氪官方 Logo、车型图片、官方文案原文或其他受商标/著作权保护的一手素材：

- 站点页面统一使用占位资源（`apps/web/public/placeholder/`），并保留免责声明「本项目为技术演示用途，不代表官方」
- 素材清单与授权文件由项目负责人在后续迭代补入 `docs/brand/`，入仓前须完成授权确认
- 第三方依赖的许可证信息见 `THIRD_PARTY_NOTICES.md`，随依赖变更同步更新

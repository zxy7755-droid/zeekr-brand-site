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
| `DATABASE_URL` | `mysql://zeekr:zeekr@127.0.0.1:3306/zeekr` | `apps/api`（Prisma） | CI 中由 MySQL 8.0 service 注入；生产用云 MySQL 内网地址，凭据放 Secrets，不入库 |
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

### 页面路由（REQ-002 增量）

| 页面 | 路径 | 数据来源 |
| --- | --- | --- |
| 车型对比 | `/compare` | 复用 `GET /vehicles`，前端在本地做 2–3 款并排对比 |
| 用户注册（界面演示） | `/register` | 无：纯前端界面演示，不请求接口、不持久化输入 |

> REQ-002 不新增接口、不改数据模型、不改环境变量，属于「已签收契约范围内的实现」，
> 因此不触发重新签收；新增的只是前端页面路由记录。
>
> `/register`（issue-1795750262423282263）同为已签收契约范围内的纯前端路由记录：
> 不新增接口/数据模型/环境变量，页面零网络请求。`BASE_PATH`、`API_BASE_URL`、
> `DATABASE_URL`、`PORT` 与四处路径常量镜像（`hard-gate.sh`、`ci.yml`、前后端 `contract.ts`）
> 均保持不变，不触发重新签收。

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
5. 仓库内不得出现第三方品牌标识、车型图或文案原文；品牌视觉素材统一放 `apps/web/public/brand/`

## 6. 数据契约（MySQL 8.0）

| 项 | 约定 |
| --- | --- |
| 数据库 | 腾讯云 TencentDB for MySQL 8.0，内网 `10.242.0.15:3306`，字符集 `utf8mb4` |
| 环境分库 | `zeekr_stage` / `zeekr_prod`，各自独立最小权限账号，仅允许 `10.242.0.%` 网段 |
| ORM | Prisma 5.16.1，`provider = "mysql"`；模型定义以 `apps/api/prisma/schema.prisma` 为准 |
| 数据表 | `Vehicle` / `TestDriveLead` / `Store` / `NewsArticle` 四张；主键 UUID，slug 唯一 |
| 枚举 | `VehicleStatus` / `ContentStatus`（DRAFT/PUBLISHED/ARCHIVED）、`NewsTag`（BRAND/TECH/EVENT） |
| 迁移 | `prisma migrate deploy` 在 CD 阶段执行；迁移文件随 PR 入库，禁止手工改线上表结构 |
| 个人信息 | `TestDriveLead` 字段最小化；`consent=true` 才可写入；日志脱敏；采集数据保留 90 天后清理 |
| 车型数据 | 价格与参数为官网展示口径，单位「元」；图片字段存 `/brand/` 资源键，不存外链 |

`DATABASE_URL` 在 CI 由 MySQL 8.0 service 注入（`mysql://...:3306/...`），生产由部署机
`/etc/zeekr/mysql.env`（600，deploy 属主）提供，**绝不写入仓库或 Actions 日志**。

## 7. 部署契约

| 项 | staging | production |
| --- | --- | --- |
| 域名 | `stage.penguin.www.xueyuanzong.top` | `penguin.www.xueyuanzong.top` |
| web 端口 | `3000` | `3002` |
| api 端口 | `3001` | `3003` |
| 数据库 | `zeekr_stage` | `zeekr_prod` |
| 镜像 | GHCR `:<git-sha>`，同一镜像晋升 | 同左 |

- 两台云主机同 VPC：执行机负责构建与测试，部署机只跑运行态；两机均不开放数据库公网访问
- 部署机 2026-11-15 已由 2核4G 升配为 **4核8G**（SA9.MEDIUM4 → SA9.LARGE8），用于同时承载四个 Node 容器；升配需强制关机，容器依赖 `restart: unless-stopped` 自动恢复，已实测开机后 4 容器全部健康
- Nginx 终止 TLS；`/api/` 前缀转发到对应 api 端口并去掉前缀；`/.well-known/acme-challenge/` 保留供证书续期
- 证书：Let's Encrypt ECC（acme.sh HTTP-01），`/etc/nginx/ssl/zeekr.{crt,key}`，自动续期 reload
- GitHub Actions Secrets：`DEPLOY_SSH_KEY` / `DEPLOY_HOST` / `DEPLOY_USER`；GHCR 用内置 `GITHUB_TOKEN`（`permissions: packages: write`）
- **双槽位已实际拆分**：`deploy/compose.yaml`（`zeekr-stage`，3000/3001）与 `deploy/compose.prod.yaml`（`zeekr-prod`，3002/3003）是两个独立 compose project，各自读取 `DATABASE_URL_STAGE` / `DATABASE_URL_PROD`
- `cd.yml` 在 main 推送后构建镜像并**自动部署 staging**；`promote.yml` 为 `workflow_dispatch` 手动晋升，输入已在 staging 验证过的 `<git-sha>`，部署 prod 槽位
- 部署脚本必须幂等：备份上一版本 → 拉取镜像 → 启动 → `/health` 探测 → 失败自动回滚到上一版本；两套环境各有独立的 `.env.runtime*` / `.env.previous*` 与日志
- 回滚件与发布版本号随交付文档记录，禁止无版本号覆盖
- `monitor.yml` 每 15 分钟同时探活主域名与预发域名（页面、`db: ok`、车型数量）

## 8. 交付与签收

每个 PR 的 `docs/delivery/` 必须包含 8 份留痕：
`requirement.md`、`design.md`、`review-backend.md`、`review-frontend.md`、
`review-qa.md`、`decision.md`、`delivery.md`、`changelog.md`。

- **唯一人工签收人：宗雪源**；签收动作 = 在 Actions 运行 `Contract sign-off` 并审批 `contract-signoff` 环境，GitHub 记录审批人 / 时间 / commit
- 不使用 PR Approve：本仓库 PR 作者与 CODEOWNER 同为 `zxy7755-droid`，GitHub 禁止作者审批自己的 PR
- 签收台账见 `docs/delivery/signoff.md`：列明签收批次、基线 commit 与变更须重新签收的范围
- 分支保护（1 审 + CODEOWNERS 必审 + 三 CI 必过 + 会话解决）是代码合并门禁，与签收门分离
- 生产晋升门：`promote.yml` 绑定 `production` Environment，需同一签收人在 Actions 审批部署后才执行
- 平台侧：LoopForge 的需求 issue 管流程状态，SOP 设计节点以签收台账的签收状态为准入条件；平台不生产 PRD
- 签收前不得进入「前端实现 / 后端实现」节点；实现完成后不得再修改已签收的契约，变更须开新签收 PR
- 准入：`scripts/hard-gate.sh` 真实 `exit 0` + GitHub Actions 三 job 全绿 + 契约测试通过
- 品牌口径：正式授权品牌官网 + 品牌视觉素材 + 车型数据 + 全站版权信息，详见 `requirement.md` 第 0 节

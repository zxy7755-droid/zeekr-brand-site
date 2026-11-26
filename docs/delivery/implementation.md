# 实现记录 · REQ-005 门店详情页 `/stores/[id]`

| 项 | 值 |
| --- | --- |
| 需求身份 | 工作项 `issue-1795666518178640656`（来源：本地，外部 ID：无） |
| 执行角色 | 开发实现（后端服务 / 数据与 API 领域节点，本需求实际为前端页面实现） |
| 工作分支 | `feature/requirement-7-20261126-0415`（从 `main` 切出，PR 目标 `main`） |
| 契约基线 | `docs/delivery/design.md` + `docs/api/openapi.yaml` v1.0.0（已签收，本次零改动） |
| 实现结论 | 完成；硬门禁 `bash scripts/hard-gate.sh` 真实 `exit 0`，日志 `reports/hard-gate.log` |

## 1. 改动清单（仅新增 4 个文件）

| 文件 | 用途 |
| --- | --- |
| `apps/web/src/app/stores/[id]/page.tsx` | 动态段详情页：取数、按 `id` 精确匹配、四类状态、语义化渲染 |
| `apps/web/src/app/stores/[id]/store-detail.module.css` | 移动优先单列、桌面端分组、电话链接 `:focus-visible`、长文本防溢出 |
| `apps/web/test/store-detail.test.mjs` | 沿用 `node:test` 静态源码检查，覆盖 FR-005.1～FR-005.3 关键字符串与 `apiUrl` 用法 |
| `apps/web/src/css-modules.d.ts` | CSS Module 环境声明（必要补充，见「已知限制」） |

**零改动（已用 `git diff` 核对，无输出）**：`docs/api/openapi.yaml`、`apps/api/prisma/schema.prisma`、`apps/api/src/**`、
`apps/web/src/lib/contract.ts`、`apps/web/src/app/layout.tsx`、`apps/web/src/app/page.tsx`、
`apps/web/src/app/compare/page.tsx`、`scripts/hard-gate.sh`、`.github/workflows/**`、`package.json`、环境变量与部署契约。
未新增任何后端接口，未向 CNB 推送或开 MR。

## 2. 实现要点

- **取数链路唯一**：`fetch(apiUrl('/stores'))` → 校验 `res.ok` → `res.json() as StoreList` → `Array.isArray(items)` 守卫 →
  `items.find((item) => item.id === params.id)` 严格相等匹配。页面 `import { apiUrl, BASE_PATH } from '@/lib/contract'`，
  无硬编码域名、无 `fixture` / `mock-data` 回退、无 `GET /stores/{id}` 新接口。
- **客户端组件**：`'use client'` + `useState` / `useEffect`，`useEffect` 用 `cancelled` 标志避免卸载后 setState；
  依赖数组含 `params.id`，换 id 重新进入加载态。
- **五态渲染（四类提示文案）**：加载 `门店信息加载中…`；空列表 `当前暂无门店信息，请稍后再来。`；
  未找到 `未找到该门店，链接可能已失效。`；错误 `门店信息加载失败：${detail}`（`role="alert"`）；
  命中则渲染详情（`data-testid="store-detail-ready"`）。错误态使用 `err instanceof Error ? err.message : '未知错误'` 兜底，不白屏。
- **字段映射**：名称 `<h1>`（空值 `—`）；地址由 `city · district? · address` 拼接并置于 `<address>`；
  营业时间缺失显示 `暂无营业时间信息`；电话缺失显示 `暂无联系电话`，有值渲染 `<a href={`tel:${digits}`}>`，
  仅保留数字与 `+` 构造 `href`，展示原文；清洗后为空退化为普通文本。不渲染经纬度、不做地图。
- **语义与可访问性**：`<main>` / `<h1>` / `<dl><dt><dd>` / `<address>`；电话与返回链接 `:focus-visible` 有
  3px 焦点环；错误态 `role="alert"`；所有状态均有文本，不靠颜色单独传达；`lang="zh-CN"` 由根布局保证。
- **合规**：固定标注 `以上为官网展示内容 / 示意数据，非量产参数。`；复用根布局常驻 `DISCLAIMER` 页脚，未移除/覆盖；
  未引入第三方 Logo / 车型图 / 官方文案；仅静态展示门店公开营业电话占位值，无埋点、无日志、无 `POST /test-drive-leads`，
  不触碰 `consent` 与手机号脱敏口径。
- **响应式**：`max-width` 居中 + `clamp()` 内边距；长文本 `overflow-wrap: anywhere` + `word-break: break-word`；
  `@media (min-width: 640px)` 下分组为两列。返回链接使用普通 `<a href={BASE_PATH || '/'}>`，避免 Next `<Link>` 与 `basePath` 双前缀。

## 3. 验证记录（真实命令 / 真实退出码）

所有命令在仓库根 `/workspace/zeekr-brand-site` 执行；依赖通过
`npm ci --prefix apps/web`（exit 0）与 `npm ci --prefix apps/api`（exit 0）安装。

| 顺序 | 命令 | 真实退出码 | 说明 |
| --- | --- | --- | --- |
| 1 | `npm run lint --prefix apps/web` | 0 | `eslint --max-warnings 0`，无警告 |
| 2 | `npm run typecheck --prefix apps/web` | 0 | `tsc --noEmit` |
| 3 | `npm run test --prefix apps/web` | 0 | 17 tests / 17 pass / 0 fail（含新增 6 项门店详情测试） |
| 4 | `npm run build --prefix apps/web` | 0 | `next build`；路由表出现 `ƒ /stores/[id]`，编译与类型检查通过 |
| 5 | `npm run lint --prefix apps/api` | 0 | 证明 API 侧未破坏 |
| 6 | `npm run typecheck --prefix apps/api` | 0 | 证明 API 侧未破坏 |
| 7 | `npm run test --prefix apps/api` | 0 | 3 suites / 13 tests 全通过 |
| 8 | `npm run test:contract --prefix apps/api` | 0 | 1 suite / 6 tests 全通过，OpenAPI 契约完好 |
| 9 | `bash scripts/hard-gate.sh` | **0** | 末尾 `[gate] ALL PASSED`；日志 `reports/hard-gate.log`（gitignored，不入库） |
| 10 | `git diff main...HEAD -- docs/api/openapi.yaml apps/api/prisma/schema.prisma` | 0 | 无输出，契约零 diff |

补充核对：`npm run typecheck --prefix apps/web` 在 `next build` 生成 `next-env.d.ts` 之后再次执行仍为 exit 0，
确认新增的 CSS Module 声明与 Next 自带声明无冲突。

**未运行**：浏览器端 375px 视口 / 键盘 Tab / ready 态实景截图未做实测。原因：当前后端源码仅实现 `/health` 与
`/vehicles`，`GET /stores` 运行态不可用（需求已预见），且本运行环境不能常驻 dev server 供浏览器跨调用访问。
因此 ready 态端到端视觉验收与电话链接点击验证受阻断，不写为通过；确定性检查均真实通过。
运行时访问详情页会按 FR-005.2 呈现可读错误态（`role="alert"`），不会白屏。

## 4. 已知限制

1. **后端无 `/stores` 控制器**：`apps/api/src` 仅有 `/health` 与 `/vehicles`。按需求约束不新增接口（属契约变更，须另开签收 PR），
   运行态 404 / 网络错误由错误态承接并上报。
2. **无 `/stores` 列表页与导航入口**：本期详情页仅能通过直链 / 分享到达，属需求范围外，未改首页与根布局。
3. **仓库 `docs/delivery/design.md` 既存偏差**：其脚本表把 web `test` 写成 `node --test test/*.test.ts`，
   而 `apps/web/package.json` 实际为 `node --test test/*.test.mjs`。本次不改该文档契约（改动会触发 design.md →
   hard-gate.sh → ci.yml → 两侧 contract.ts 四处同步），按实际脚本执行并记录于此。
4. **新增 `apps/web/src/css-modules.d.ts` 的理由**：仓库 `.gitignore` 排除 `next-env.d.ts`，独立 `tsc --noEmit`
   在 `next build` 之前无法解析 `store-detail.module.css`；该声明形状与 `next/types/global.d.ts` 一致，
   已在「构建前 / 构建后」两次 typecheck 中验证无冲突。
5. **硬门禁不覆盖 web 单测**：`scripts/hard-gate.sh` 与 CI web job 均不执行 `npm run test --prefix apps/web`，
   已单独真实执行并记录（见上表第 3 行）。

## 5. 交付边界

- 只从 `feature/requirement-7-20261126-0415` 开目标分支 `main` 的 PR，**不合并**。
- PR 描述只写已实际验证的结论；未运行项明确标注，不伪造评审 / 门禁 / 签收证据。
- 交付主干仅 GitHub `zxy7755-droid/zeekr-brand-site`；CNB 仅运行与部署镜像，未推送、未开 MR。
- 签收由唯一人工签收人完成；本需求在已签收契约范围内，不触发重新签收。

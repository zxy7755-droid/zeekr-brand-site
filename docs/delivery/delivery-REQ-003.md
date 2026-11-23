# 交付汇总 · REQ-003：`/compare` 加载与错误态 + `GET /vehicles` 请求日志（不改契约）

| 项 | 值 |
| --- | --- |
| 平台工作项 | `issue-1795410586564260935`（来源：本地；外部 ID：无） |
| 仓库 / 主干 | `zeekr-brand-site`（GitHub `zxy7755-droid/zeekr-brand-site`），唯一交付主干 |
| 基线 / 工作分支 | `main @ 7c00fa7` → `feature/requirement-4-20261123-0509`；验证时代码 HEAD `1d28bf4ef293b938cca4a3a7e41efa6d1ccbf65a`，交付文档提交并推送后 HEAD `06b46d42e9b13691fbac913b6d8e8e93c23da19f` |
| 交付 PR | [#23](https://github.com/zxy7755-droid/zeekr-brand-site/pull/23)：`state=open`、`merged=false`、`base=main`、`head=feature/requirement-4-20261123-0509`，推送后 `head_sha=06b46d4`（GitHub API 实测 HTTP 200）；描述含真实命令/退出码/已知限制并引用交付汇总 |
| 交付日期 | 2026-11-23 |
| 签收人 | 宗雪源（宗老板）；Agent **只开 PR、不合并 main**（平台 sign-off/decision：`人工批准继续`） |
| 本节点结论 | 前后端改动、双份独立评审、硬门禁与 PR 状态均已核对；PR #23 为 open 且目标为 main，交付完成 |

---

## 1. 本轮改动清单

源码/测试 6 个（基线 `main..HEAD` 实际 diff，已逐一核对）：

**前端 `apps/web`**
- `src/app/compare/page.tsx`：`error` 升级为结构化 `CompareErrorState { kind, message, retryable }`；新增 `reloadToken` 驱动 `useEffect` 重跑；请求期间 `data-testid="compare-loading"` + `role="status" aria-live="polite"`；失败时保留 `role="alert" / data-testid="compare-error"`，展示含「重试」语义文案与原生重试按钮 `data-testid="compare-retry"`。重试复用 `apiUrl('/vehicles?pageSize=50')`，`load()` 开头清空 `error/vehicles` 自然重回加载态，`cancelled` 丢弃旧响应避免串扰，`selected` 不清空；不回退 fixture。
- `src/lib/compare-error.mjs` + `src/lib/compare-error.d.mts`：零依赖纯 ESM helper，`classifyCompareError`（network/http/unknown）、`compareErrorMessage`、`describeCompareError`；显式 `.mjs` 导入 + `.d.mts` 声明保证 `tsc --noEmit` / `next build` 解析。
- `test/compare-error.test.mjs`：`node --test` 行为单测，真实 import 并调用 helper，覆盖网络异常、非 2xx、未知输入、分类/文案，共 4 例。

**后端 `apps/api`**
- `src/vehicles/vehicles.controller.ts`：NestJS 内置 `Logger` + `try/finally`（**不开 `catch`**）；`GET /vehicles` 每次调用恰好一条 JSON 日志，字段 `method='GET'`、`path='/vehicles'`（由 `RESOURCE_ROUTES.vehicles` 拼出）、`durationMs=Math.max(0, Date.now()-start)`、`result='success'|'error'`。异常原样抛出，响应体/状态码零变化；`logRequest()` 内部吞掉日志自身异常；不含 query、请求头、Cookie、手机号等 PII。
- `src/vehicles/vehicles.controller.spec.ts`：新增 1 例 `jest.spyOn(Logger.prototype, 'log')` 断言调用 1 次且四字段齐全，`try/finally` 中 `mockRestore()`；既有 6 例未改。

**交付留痕（随 PR 入库）**
- `docs/delivery/requirement-REQ-003.md`、`docs/delivery/design-REQ-003.md`、`docs/delivery/implementation-REQ-003.md`（均新建，未覆盖仓库已有 `requirement.md` / `design.md`）。
- 本节点新增：`docs/delivery/delivery-REQ-003.md`，并在 `docs/delivery/delivery.md` 追加 REQ-003 章节（保留原 REQ-002 内容）。

**边界核对（真实 `git diff main..HEAD -- <path>` 输出为空）**：`docs/api/openapi.yaml`、`apps/api/prisma/schema.prisma`、`docs/delivery/design.md`、`scripts/hard-gate.sh`、`.github/workflows/ci.yml`、两端 `contract.ts`、两端 `package.json`/`package-lock.json`、`.env*`。不新增接口/路由/依赖，不改环境变量与 `BASE_PATH`。构建产物 `node_modules` / `.next` / `dist` / `reports/` 均被 `.gitignore` 排除，未入库。

---

## 2. 评审意见汇总（实现者不自审）

| 评审 | 结论 | 要点 |
| --- | --- | --- |
| 前端独立评审 | **PASS**，无 P0/P1/P2 | 三态互斥渲染、重试串扰防护、a11y 属性齐备、既有 2–3 款勾选/6 维度/sticky 首列/页脚版权保留；3 项 P3 建议 |
| 后端独立评审 | **PASS**，无 P0/P1/P2 | `try/finally` 无 `catch`，响应零变化，日志四字段且无 PII；spy 不污染既有用例；2 项 P3 建议 |

非阻断改进建议（留待后续迭代，不影响本次验收）：
- **F-1（P3，前端）**：`catch` 中所有 `Error`（含坏 JSON 的 `SyntaxError`）被归为 `network`，文案可能误导；建议收敛为 `TypeError`/`AbortError` 或增加 `parse` 分类。
- **F-2（P3，前端）**：`retryable` 字段恒为 `true` 且渲染层未消费；建议显式 `error.retryable && <button>` 或删除字段。
- **F-3 / R-2（P3，前端）**：`role="status"`、`aria-live="polite"`、`compare-retry`、`onClick={retry}` 缺少自动静态断言；建议沿用零新依赖的源码断言风格补齐。
- **R-1（P3，后端）**：新增用例只覆盖成功路径，错误路径 `result='error'` 缺断言；建议补 `BadRequestException` 场景断言。

---

## 3. 真实验证证据（命令 + 退出码 + 日志位置）

在含 `scripts/hard-gate.sh` 的仓库根 `/workspace/zeekr-brand-site` 执行；本交付节点**独立复跑**并保留日志：

| 命令 | 退出码 | 证据 / 日志 |
| --- | --- | --- |
| `bash scripts/hard-gate.sh` | **0** | 7 步全 `[ok]`（web lint → web typecheck → api lint → api typecheck → api unit test → web build → api contract test），末行 `[gate] ALL PASSED`；`/workspace/delivery-hard-gate-rerun.log`，仓库内 `reports/hard-gate.log` |
| `npm run test --prefix apps/web` | **0** | `tests 15 / pass 15 / fail 0`（门禁不含 web 单测，单独执行）；`/workspace/delivery-web-test.log` |
| `curl -sS -H "Authorization: Bearer …" https://api.github.com/repos/zxy7755-droid/zeekr-brand-site/pulls/23` | **HTTP 200** | `state=open`、`merged=false`、`base=main`、`head_sha=1d28bf4`（与本地 HEAD 一致）；`/workspace/delivery-pr23.json` |

门禁内实测摘要（来自本次重跑日志）：api 单测 `3 suites / 14 tests passed`；api 契约测试 `1 suite / 6 tests passed`；`next build` 成功，`/compare` 预渲染为静态路由。

上游实现/评审节点已实际执行并记录（本节点交叉核对一致）：`npm ci --prefix apps/web` → 0、`npm ci --prefix apps/api` → 0、`npm run lint/typecheck/build --prefix apps/web` → 0、`npm run lint/typecheck/test/test:contract --prefix apps/api` → 0；前端评审另记录 GitHub Actions head commit `1d28bf4` 的 check-runs 三项 `conclusion=success`（`web`、`api`、`contract-check`，run `45117811055`）。独立评审复跑日志见工作区根 `review-hard-gate-rerun.log`、`review-web-test.log`、`review-api-test.log`、`review-web-build.log` 等。

---

## 4. 已知限制

1. `scripts/hard-gate.sh` 依工程契约冻结，**不含 web 单测步骤**；本 REQ 不改门禁，新增的 web 单测已用 `npm run test --prefix apps/web` 单独真实执行（exit 0）并留痕。是否扩展门禁属另一契约变更议题。
2. **浏览器手动可视化验收未运行**（本地无 3000/3001 常驻服务）；FR-003.1～FR-003.4 的判定基于源码审查 + `node --test` / jest 行为单测，不宣称已做浏览器实测。
3. NestJS `Logger` 会附加 `[VehiclesController]` 前缀；JSON 负载本身严格为四字段，日志消费方需提取 JSON 片段。
4. 第 2 节 5 项 P3 建议为已知测试/分类覆盖缺口，当前实现逻辑正确，不影响验收。
5. `npm ci` 的漏洞告警来自既有 lockfile，本 REQ 未改依赖与 lockfile，不在本次范围处理。

---

## 5. 交付物清单与协作边界

- **工作区根**：`delivery.md`（与本文同源的交付汇总）。
- **仓库 `docs/delivery/`**：`delivery-REQ-003.md`（本汇总）、`delivery.md`（追加 REQ-003 章节）、`requirement-REQ-003.md`、`design-REQ-003.md`、`implementation-REQ-003.md`；评审产物位于工作区根 `review-web.md` / `review-api.md`。
- **PR**：<https://github.com/zxy7755-droid/zeekr-brand-site/pull/23>（`feature/requirement-4-20261123-0509` → `main`，open 未合并；描述含需求、改动范围、真实命令与退出码、已知限制）。
- **主干分工**：GitHub 为唯一交付主干；CNB `tencentmobilityeast/penguin-motors-site` 仅作运行/部署镜像，本次**未推送、未开 MR**；Agent **未合并 main**，合并与签收由宗老板在 GitHub PR 上完成。
- 全程未写入凭据或生产运维配置，未提交 `node_modules`/`dist`/`.next`/`reports`/`.env*`。

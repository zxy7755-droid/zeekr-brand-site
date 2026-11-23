# 实现记录 · REQ-003：/compare 加载与错误态 + GET /vehicles 请求日志（不改契约）

| 项 | 值 |
| --- | --- |
| 平台工作项 | issue-1795410586564260935 |
| 执行角色 | 开发实现 |
| 日期 | 2026-11-23 |
| 仓库 | `zeekr-brand-site`（GitHub `zxy7755-droid/zeekr-brand-site`） |
| 基线 / 工作分支 | `main @ 7c00fa7`；`feature/requirement-4-20261123-0509` |
| 上游 | `.agentflow/inputs/design/design.md`（pass）；`.agentflow/inputs/clarify/clarify.md`（pass） |
| 状态 | 实现完成，硬门禁真实 exit 0，待 PR 与签收 |

> 本文件是运行工作区根目录的 SOP 产物。同内容已存为仓库内 `docs/delivery/implementation-REQ-003.md` 随 PR 入库；
> 仓库已有的 `docs/delivery/design.md`（工程契约唯一定义处）未被覆盖。

---

## 1. 实现内容

### 1.1 前端（apps/web）

相对 `main` 基线的最终实现与设计定稿一致：

1. **状态机升级**：`src/app/compare/page.tsx` 中 `error` 由 `string | null` 升级为结构化
   `CompareErrorState | null`（`kind` / `message` / `retryable`）；新增 `reloadToken` 状态，
   `useEffect` 依赖由 `[]` 改为 `[reloadToken]`。
2. **加载态**：`vehicles === null && error === null` 时渲染 `data-testid="compare-loading"`，
   补 `role="status"` 与 `aria-live="polite"`；重试开头 `setError(null); setVehicles(null)`，
   因此重试期间自然重新进入加载态。
3. **错误态与重试**：非 2xx 不再抛通用 `Error`，而是设结构化错误态；网络异常在 `catch` 中设错误态。
   错误容器保留 `role="alert"` / `data-testid="compare-error"`，显示含「重试」语义的中文文案，
   并提供原生 `<button type="button" data-testid="compare-retry">重试加载车型</button>`。
   点击按钮仅 `setReloadToken((n) => n + 1)`，请求 URL 仍为 `apiUrl('/vehicles?pageSize=50')`，
   不回退 fixture / 假数据。
4. **串扰防护**：沿用 `useEffect` 的 `cancelled` 标志；重试时 React 先执行旧 effect cleanup
   （旧 `cancelled = true`）再跑新 effect，旧请求迟到响应被丢弃；`selected` 勾选不被重试清空。
5. **可测 helper**：新增 `src/lib/compare-error.mjs`（纯 ESM、零依赖、JSDoc 类型）导出
   `classifyCompareError` / `compareErrorMessage` / `describeCompareError`；新增同名
   `src/lib/compare-error.d.mts` 声明，页面以 `@/lib/compare-error.mjs` 显式扩展名导入，
   使 `tsc --noEmit` 与 `next build` 稳定解析。
6. **行为单测**：新增 `test/compare-error.test.mjs`，真实 import 并调用 helper，覆盖
   网络异常（TypeError）、非 2xx（503）、未知输入（null / {} / 字符串）以及分类/文案单独调用；
   共 4 例，被 `node --test test/*.test.mjs` 命中。

### 1.2 后端（apps/api）

1. `src/vehicles/vehicles.controller.ts`：从 `@nestjs/common` 引入内置 `Logger`，类内新增
   `private readonly logger = new Logger(VehiclesController.name)`（无新依赖）。
2. `list()` 以 `try / finally` 包裹原有全部逻辑（不写 `catch`）：成功路径组装响应后标记
   `outcome = 'success'` 再 `return`；参数校验失败 / service 异常原样抛出，`outcome` 保持
   `'error'`。`finally` 调用 `private logRequest(startedAt, outcome)`，因此每次调用恰好一条日志。
3. `logRequest()` 输出 `JSON.stringify({ method: 'GET', path: '/'+RESOURCE_ROUTES.vehicles,
   durationMs: Math.max(0, Date.now() - startedAt), result })`，只含四字段，不含 query、
   请求头、Cookie 或手机号；内部 `try / catch` 吞掉日志自身异常，不影响主响应。
   响应体与状态码零变化（200 仍为 `items/total/page/pageSize`，400 错误体与 404 原样）。
4. `src/vehicles/vehicles.controller.spec.ts` 新增 1 例 jest 测试：`spyOn(Logger.prototype, 'log')`
   断言调用 1 次并解析 JSON，核对 `method/path/result` 与非负 `durationMs`；
   `try/finally` 中 `mockRestore()` 避免污染既有 6 例。

---

## 2. 变更文件清单

| 动作 | 文件 | 说明 |
| --- | --- | --- |
| 修改 | `apps/web/src/app/compare/page.tsx` | 结构化错误态、`reloadToken` 重试、加载/错误 UI、a11y 属性 |
| 新增 | `apps/web/src/lib/compare-error.mjs` | 纯 ESM 错误分类 / 文案 helper |
| 新增 | `apps/web/src/lib/compare-error.d.mts` | TS 声明，保证 typecheck / build |
| 新增 | `apps/web/test/compare-error.test.mjs` | 行为单测（4 例） |
| 修改 | `apps/api/src/vehicles/vehicles.controller.ts` | `Logger` + `try/finally` + `logRequest` |
| 修改 | `apps/api/src/vehicles/vehicles.controller.spec.ts` | 新增 1 例日志断言 |
| 新增 | `docs/delivery/implementation-REQ-003.md` | 本文仓库内留痕 |
| 新增 | `docs/delivery/requirement-REQ-003.md` | 需求定型产物随 PR 入库（不覆盖已有 requirement.md） |
| 新增 | `docs/delivery/design-REQ-003.md` | 方案设计产物随 PR 入库（不覆盖已有 design.md） |

---

## 3. 契约与边界核对

`git diff --name-only`（实现代码部分）实际输出：

```
apps/api/src/vehicles/vehicles.controller.spec.ts
apps/api/src/vehicles/vehicles.controller.ts
apps/web/src/app/compare/page.tsx
```

加上新增文件后，变更集合仅含上表所列的 6 个源码/测试文件与 3 个 SOP 文档。
以下冻结文件**均无 diff**：

- `docs/api/openapi.yaml`、`apps/api/prisma/schema.prisma`
- `docs/delivery/design.md`、`scripts/hard-gate.sh`、`.github/workflows/ci.yml`
- `apps/web/src/lib/contract.ts`、`apps/api/src/contract.ts`
- 两端 `package.json` / `package-lock.json`、`.env*`

环境变量、`BASE_PATH` / `NEXT_PUBLIC_BASE_PATH` / `API_BASE_URL` 默认值未改；
未新增接口、路由或第三方依赖；未改动 2–3 款勾选算法、6 项维度、`—` 占位、
横向滚动 + sticky 首列、页脚版权与本需求无关的样式/素材。

---

## 4. 验证记录（真实命令 + 真实退出码）

在仓库根 `/workspace/zeekr-brand-site` 执行（先定位含 `scripts/hard-gate.sh` 的仓库根，
未使用 `cd backend/frontend/web/api` 等臆造路径）。

| 命令 | 退出码 | 证据 |
| --- | --- | --- |
| `npm ci --prefix apps/web` | 0 | 标准输出，依赖安装完成 |
| `npm ci --prefix apps/api` | 0 | 标准输出，postinstall `prisma generate` 完成 |
| `npm run lint --prefix apps/web` | 0 | `reports/implementation-verification.log` |
| `npm run typecheck --prefix apps/web` | 0 | 同上 |
| `npm run test --prefix apps/web` | 0 | 同上；15 tests / 15 pass / 0 fail（含新增 4 例） |
| `npm run build --prefix apps/web` | 0 | 同上；`/compare` 构建产物 3.38 kB |
| `npm run lint --prefix apps/api` | 0 | 同上 |
| `npm run typecheck --prefix apps/api` | 0 | 同上 |
| `npm run test --prefix apps/api` | 0 | 同上；3 suites / 14 tests 全通过 |
| `npm run test:contract --prefix apps/api` | 0 | 同上；1 suite / 6 tests 全通过 |
| `bash scripts/hard-gate.sh` | 0 | `reports/hard-gate.log` 末行 `[gate] ALL PASSED` |

门禁按脚本顺序真实执行：web lint → web typecheck → api lint → api typecheck →
api unit test → web build → api contract test，全部 `[ok]`。
以上 8 项单项检查重新执行并留痕于 `reports/implementation-verification.log`（`reports/` 被
`.gitignore` 排除，不入库）。

---

## 5. 已知限制 / 未运行项

- `scripts/hard-gate.sh` 当前**不含 web 单测步骤**（属契约工具链冻结，本 REQ 不改门禁）。
  已单独真实运行 `npm run test --prefix apps/web`，退出码 0，见第 4 节与 PR 描述。
- 浏览器可视化验收（断网/非 2xx 后点击重试的手动操作）为可选项，本节点**未运行**；
  行为覆盖由 node --test 与 jest 单测承担。
- `npm ci` 输出的依赖漏洞告警（web 11 项、api 18 项）来自既有 lockfile，
  本 REQ 未改依赖与 lockfile，未在本次范围内处理。
- `reports/` 与 `node_modules/` / `.next/` / `dist/` 均被 `.gitignore` 排除，不随 PR 入库。

---

## 6. 交付边界

- GitHub `zxy7755-droid/zeekr-brand-site` 是唯一交付主干：工作分支 push，开目标为 `main` 的 PR。
- CNB `tencentmobilityeast/penguin-motors-site` 仅作运行与部署镜像：
  本次不推送、不开 MR。
- Agent 只开 PR，**不合并 main**；合并与签收由唯一签收人宗雪源（宗老板）完成。
- 角色分离：需求定型 → 方案设计 → 实现（本文）→ 独立评审 → 硬门禁 → 签收；实现者不自审。
- 未写入任何凭据、生产运维配置或个人信息；日志仅含四个结构化字段，无手机号等 PII。

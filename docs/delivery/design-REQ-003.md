# 方案设计 · REQ-003：/compare 加载与错误态 + GET /vehicles 请求日志（不改契约）

| 项 | 值 |
| --- | --- |
| 平台工作项 | issue-1795410586564260935 |
| 执行角色 | 方案设计（仅设计，不编码、不执行门禁） |
| 日期 | 2026-11-23 |
| 仓库 | `zeekr-brand-site`（GitHub `zxy7755-droid/zeekr-brand-site`），本地检出 `/workspace/zeekr-brand-site` |
| 基线 / 工作分支 | `main @ 7c00fa7`；`feature/requirement-4-20261123-0509`（HEAD 一致，工作树干净） |
| 上游 | `.agentflow/inputs/clarify/clarify.md`（终态 pass）；`requirement.md` |
| 状态 | 设计定稿，待前端 / 后端实现节点 |

> 本文是运行工作区根目录的 SOP 产物。交付 PR 时请另存为仓库内 `docs/delivery/design-REQ-003.md`，
> **不要覆盖**仓库已有的 `docs/delivery/design.md`（P0 工程契约唯一定义处）。

---

## 1. 设计目标与硬边界

在**完全不触碰已签收契约**的前提下，做两处最小改动：

1. `/compare` 在 `GET /vehicles` 在途时呈现加载态，失败时呈现可重试提示与按钮，点击后重新请求并恢复原有 2–3 款并排对比。
2. `GET /vehicles` 每次调用产出一条结构化日志（`method` / `path` / `durationMs` / `result`），响应体与状态码零变化。

**冻结清单（实现节点用 `git diff --name-only` 核对，下列文件不得出现）**：

- `docs/api/openapi.yaml`（仓库内）、`apps/api/prisma/schema.prisma`
- `docs/delivery/design.md`、`scripts/hard-gate.sh`、`.github/workflows/ci.yml`
- `apps/web/src/lib/contract.ts`、`apps/api/src/contract.ts`
- 两端 `package.json` / `package-lock.json`、`.env*`
- 环境变量、`BASE_PATH` / `NEXT_PUBLIC_BASE_PATH` / `API_BASE_URL` 默认值
- 不新增接口、不新增路由、不引入第三方依赖

> 本工作区根目录的 `docs/api/openapi.yaml` 是**未改动的契约快照**（与仓库文件逐字节一致），
> 仅作设计产物留痕，不构成契约变更；门禁读取的是仓库内的契约文件。

---

## 2. 现状复核（本节点实读确认）

| 项 | 实读结论 | 对设计的影响 |
| --- | --- | --- |
| `/compare` 状态 | `vehicles: Vehicle[] \| null`、`error: string \| null`、`selected: string[]`；`useEffect([])` 内 `cancelled` 标志 | 保留三状态模型，仅把 `error` 从 `string` 升级为结构化对象 |
| 已有 UI | `compare-loading` / `compare-error`（`role="alert"`）/ `compare-empty` 均已存在 | 全部保留测试标识，不重命名 |
| 对比逻辑 | `MIN_SELECTION=2` / `MAX_SELECTION=3`、6 项 `DIMENSIONS`、`—` 占位、`overflowX:'auto'` + sticky 首列 | 一行不改 |
| 请求 | `fetch(apiUrl('/vehicles?pageSize=50'))`，无 fixture 回退 | 重试必须复用同一 URL，仍走 `apiUrl()` |
| 页脚 | `src/app/layout.tsx` 常驻 `{DISCLAIMER}`，全局无 `.css` 文件 | 不新增样式文件；焦点样式依赖原生 button 的 UA `:focus-visible` 焦点环 |
| 后端 `list()` | 无日志；`parseIntParam` 与非法 `status` 抛 `BadRequestException`；service 返回 `{items,total,page,pageSize}` | 用 `try/finally` 包裹，异常继续抛出，不改任何返回/异常 |
| 测试 | web：`node --test test/*.test.mjs`（现存 2 个文件，均为静态源码断言）；api：jest `src/**/*.spec.ts`（controller 6 例） | 各补 1 个**行为**测试；既有测试不改即成为回归网 |
| 门禁 | `hard-gate.sh` 顺序：web lint → web typecheck → api lint → api typecheck → api test → web build → api contract test；**无 web 单测步骤** | web 单测必须单独执行并在 PR 描述留痕 |
| 依赖 | 两端 `node_modules` 当前均缺失 | 实现/门禁节点先 `npm ci --prefix apps/web` 与 `npm ci --prefix apps/api` |
| Node | 运行环境 `v22.23.5`（契约要求 ≥20） | `.mjs` 可被 `node --test` 原生 import |

---

## 3. 前端设计（apps/web）

### 3.1 状态机（改 `src/app/compare/page.tsx`）

把 `error` 从 `string | null` 升级为结构化对象：

```ts
interface CompareErrorState {
  kind: 'network' | 'http' | 'unknown';
  message: string;   // 已含「重试」语义的中文文案
  retryable: boolean;
}
```

三态互斥渲染规则（沿用现有测试标识）：

| 条件 | 渲染 |
| --- | --- |
| `error !== null` | `role="alert"` 容器 + `data-testid="compare-error"` + 消息 + 重试按钮 |
| `error === null && vehicles === null` | `data-testid="compare-loading"`，补 `role="status" aria-live="polite"` |
| `error === null && vehicles !== null && length === 0` | `data-testid="compare-empty"` |
| `error === null && vehicles !== null && length > 0` | 现有勾选列表 + 提示 + 对比表（原样保留） |

### 3.2 重试机制（关键：不引入 AbortController，零新依赖）

新增 `const [reloadToken, setReloadToken] = useState(0);`，`useEffect` 依赖改为 `[reloadToken]`：

- 每次 `load()` 开头执行 `setError(null); setVehicles(null);`，因此重试期间**自然重新进入加载态**。
- `useEffect` 的 cleanup 仍设置 `cancelled = true`。重试触发 React 先跑旧 effect 的 cleanup（`cancelled` 置真）再跑新 effect，**旧请求的迟到响应被丢弃**，满足 FR-003.4 无串扰。
- 非 2xx 不再 `throw` 通用 `Error`，而是 `if (!res.ok) { if (!cancelled) setError(describeCompareError(res)); return; }`；网络异常在 `catch` 中 `setError(describeCompareError(err))`。
- 重试按钮：`function retry() { setReloadToken((n) => n + 1); }`，请求 URL 仍为 `apiUrl('/vehicles?pageSize=50')`。
- `selected` 独立于 `vehicles`，重试不清空勾选；请求成功后对比流程原样恢复，不白屏。
- 错误态不回退 fixture / 假数据（FR-003.7）。

### 3.3 可测的纯错误 helper（新增 2 个文件）

为使 `node --test test/*.test.mjs` 在**无 TS 转译**下直接 import 并断言行为：

- 新增 `apps/web/src/lib/compare-error.mjs`：纯 ESM JS 模块（JSDoc 标注类型），不依赖 DOM / React / 任何依赖。导出：
  - `classifyCompareError(input): 'network' | 'http' | 'unknown'`
    - `input` 为对象且 `ok === false` → `'http'`（非 2xx HTTP 响应，含 4xx/5xx）
    - `input instanceof Error`（如 `TypeError: Failed to fetch`）→ `'network'`
    - 其他 → `'unknown'`
  - `compareErrorMessage(kind): string` → 三类文案均含「重试」语义：
    - `network`：车型数据加载失败，请检查网络后重试。
    - `http`：车型数据加载失败（服务暂时不可用），请重试。
    - `unknown`：车型数据加载失败，请重试。
  - `describeCompareError(input): CompareErrorState` → 组合上述两者，返回 `{ kind, message, retryable: true }`。
    - `retryable` 恒为 `true`：本页只有一个固定数据源，任何失败都可通过重试恢复；字段保留便于测试与后续扩展。
- 新增 `apps/web/src/lib/compare-error.d.mts`：`.mjs` 的 TypeScript 声明，保证 `tsc --noEmit` 与 `next build` 稳定解析。
- 页面引入方式必须**带扩展名**：`import { describeCompareError } from '@/lib/compare-error.mjs';`
  （`@/*` 已映射到 `./src/*`；显式 `.mjs` 才能命中同名 `.d.mts` 声明）。

> 选型理由：`.ts` 无法被 Node 20 的 `node --test` 直接加载；`.js` 在无 `"type":"module"` 的包中被当作 CJS，ESM `export` 会失败。因此选 `.mjs` + `.d.mts`，实现零依赖、零转译的可测纯逻辑。

### 3.4 新增 web 单测

新增 `apps/web/test/compare-error.test.mjs`（被 `test/*.test.mjs` 通配命中），**真实 import 并调用** helper，至少覆盖：

1. `new TypeError('Failed to fetch')` → `kind === 'network'`、`retryable === true`、文案含「重试」。
2. `{ ok: false, status: 503 }` → `kind === 'http'`、`retryable === true`、文案含「重试」。
3. `{}` / `null` → `kind === 'unknown'`，不抛异常（健壮性）。

既有 `compare-page.test.mjs`、`contract.test.mjs` 不做任何修改：现有断言（测试标识、6 维度、`apiUrl('/vehicles`、无 fixture、`overflowX` 等）在新代码下仍成立，兼作回归网。

### 3.5 可访问性与响应式

- 加载态 `<p role="status" aria-live="polite" data-testid="compare-loading">`。
- 错误态外层 `<div role="alert" data-testid="compare-error">`，内含消息 `<p>` 与 `<button type="button" data-testid="compare-retry">重试加载车型</button>`。
- 重试按钮为原生 button，文本即无障碍名称，键盘可聚焦可触发；项目无 CSS 重置文件，原生 `:focus-visible` UA 焦点环可见（如需品牌化焦点样式另开议题，本期不新增 css 文件）。
- 错误容器内联 `display:'flex', flexWrap:'wrap', gap:12, alignItems:'center'`，窄屏自动换行不溢出；对比表仍置于 `overflowX:'auto'` 容器并保留 sticky 首列。
- 不新增图片素材；仅用 `public/brand/` 既有生成式原创图，页脚版权由 layout 常驻。

---

## 4. 后端设计（apps/api）

### 4.1 结构化日志（改 `src/vehicles/vehicles.controller.ts`）

- 从 `@nestjs/common` 额外引入 `Logger`；类内新增 `private readonly logger = new Logger(VehiclesController.name);`（NestJS 内置，无新依赖）。
- `list()` 用 `try / finally` 包裹**现有全部逻辑**（参数解析、status 校验、service 调用、响应组装），不开 `catch`：
  - 成功路径：组装好响应对象后标记 `result = 'success'`，`return` 响应；`finally` 记录一条日志。
  - 失败路径：`BadRequestException` / service 异常照原样抛出，`result` 保持 `'error'`，`finally` 同样记录一条日志。
  - 因此**每次调用恰好一条日志**，且 `durationMs` 覆盖成功与失败路径。
- 新增私有方法集中负责日志（防御性吞掉日志自身异常，满足 BR-003.3「日志异常不得影响响应或抛出」）：

```ts
private logRequest(startedAt: number, result: 'success' | 'error'): void {
  try {
    this.logger.log(JSON.stringify({
      method: 'GET',
      path: `/${RESOURCE_ROUTES.vehicles}`,   // → '/vehicles'，不含 query
      durationMs: Math.max(0, Date.now() - startedAt),
      result,
    }));
  } catch {
    // 日志失败不得影响主响应
  }
}
```

- 字段口径：`method` 固定 `'GET'`；`path` 由 `RESOURCE_ROUTES.vehicles` 镜像常量拼出（与 `contract.ts` 一致，不硬编码）；`durationMs` 为非负整数毫秒；`result` 取 `'success' | 'error'`。
- 日志卫生：只输出上述 4 个字段，不含 query string、请求头、Cookie、手机号等 PII；不改 `detail` 错误体与 `traceId`。
- 响应零变化：200 仍为 `{items,total,page,pageSize}`；400/404、异常类型与消息全部保持原样。

### 4.2 新增 jest 单测

在既有 `src/vehicles/vehicles.controller.spec.ts` 中**新增 1 个 `it`**（现有 6 例不改，形成 7 例）：

```ts
import { Logger } from '@nestjs/common';

it('GET /vehicles 成功时输出含 method/path/durationMs/result 的结构化日志', async () => {
  const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  try {
    vehiclesServiceMock.list.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    await controller.list(undefined, undefined, undefined, undefined);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(logSpy.mock.calls[0][0]));
    expect(payload).toMatchObject({ method: 'GET', path: '/vehicles', result: 'success' });
    expect(typeof payload.durationMs).toBe('number');
    expect(payload.durationMs).toBeGreaterThanOrEqual(0);
  } finally {
    logSpy.mockRestore();   // 避免污染同文件其他用例
  }
});
```

> 选型理由：spy `Logger.prototype.log` 无需把实例 logger 暴露为 public，也无需改 Nest 测试模块或注入新 provider，最小化对既有 6 例的影响。

---

## 5. 接口影响评估

| 项 | 结论 |
| --- | --- |
| `docs/api/openapi.yaml`（仓库内） | **不改**：`GET /vehicles` 已有 `VehicleList` / `Error`；日志是服务端副作用，不进入响应 |
| `apps/api/prisma/schema.prisma` | **不改**：无表 / 字段 / 枚举变化 |
| 接口与路由 | **不新增**：前端仍 `GET /vehicles?pageSize=50`，仍经 `apiUrl()` |
| 请求 / 响应结构、状态码 | **零变化**：200 与 400/404 均保持原样 |
| 环境变量 / BASE_PATH | **不改** |
| 依赖 | **不新增**：`Logger` 来自 `@nestjs/common@10.3.10`；helper 用 Node 原生模块 |
| 工程契约 `docs/delivery/design.md` | **不改**：无新页面路由、无新路径常量，不触发四处同步 |

---

## 6. 变更文件清单（实现节点严格按此执行）

**apps/web**

| 动作 | 文件 | 说明 |
| --- | --- | --- |
| 新增 | `apps/web/src/lib/compare-error.mjs` | 纯 ESM 错误分类 / 文案 helper |
| 新增 | `apps/web/src/lib/compare-error.d.mts` | TS 声明，保证 typecheck / build |
| 修改 | `apps/web/src/app/compare/page.tsx` | 结构化 error 状态、`reloadToken` 重试、加载/错误 UI、a11y 属性 |
| 新增 | `apps/web/test/compare-error.test.mjs` | 行为单测（3 例） |

**apps/api**

| 动作 | 文件 | 说明 |
| --- | --- | --- |
| 修改 | `apps/api/src/vehicles/vehicles.controller.ts` | `Logger` + `try/finally` + `logRequest` |
| 修改 | `apps/api/src/vehicles/vehicles.controller.spec.ts` | 新增 1 个日志断言用例 |

**工作区根目录 SOP 产物（本节点已产出）**

- `design.md`（本文）
- `docs/api/openapi.yaml`（仓库契约的未改动逐字节快照，仅留痕）

---

## 7. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| `.mjs` 被 `tsc`/`next build` 解析失败 | 必须带 `.mjs` 扩展名导入 + 同名 `.d.mts` 声明；实现节点以 `npm run typecheck --prefix apps/web`、`npm run build --prefix apps/web` 实测为准 |
| web 单测不在硬门禁内，易漏跑 | PR 描述显式列出 `npm run test --prefix apps/web` 的真实命令与退出码；门禁节点单独执行留痕 |
| 重试串扰（旧响应覆盖新状态） | `reloadToken` 变更触发旧 effect cleanup，`cancelled` 丢弃迟到响应 |
| `try/finally` 改变异常 / 响应 | 不写 `catch`；日志方法内部吞异常；用既有 6 个 controller 用例 + 契约测试做回归网 |
| `Logger.prototype` spy 污染其他用例 | `try/finally` 中 `mockRestore()` |
| 依赖缺失导致验证无法真实执行 | 先 `npm ci --prefix apps/web`、`npm ci --prefix apps/api`；若网络失败，如实记录，禁止标「通过」 |
| 误改冻结文件 / 误推 CNB | 交付前 `git diff --name-only` 核对冻结清单；只推 GitHub 工作分支，不开 CNB MR，不合并 main |

---

## 8. 验证计划（设计节点未执行，以下命令由实现 / 门禁节点真实运行）

在含 `scripts/hard-gate.sh` 的仓库根（本环境 `/workspace/zeekr-brand-site`）执行；
厂商脚本定位须用 `find` 找含 `scripts/hard-gate.sh` 的目录，禁止臆造 `cd backend/frontend/web/api`。

```bash
npm ci --prefix apps/web
npm ci --prefix apps/api
npm run lint       --prefix apps/web
npm run typecheck  --prefix apps/web
npm run test       --prefix apps/web       # 门禁未覆盖，必须单独跑并留痕
npm run build      --prefix apps/web
npm run lint       --prefix apps/api
npm run typecheck  --prefix apps/api
npm run test       --prefix apps/api
npm run test:contract --prefix apps/api
bash scripts/hard-gate.sh                  # 唯一门禁入口
```

**通过判据**：每条命令真实 `exit 0`；`reports/hard-gate.log` 末尾出现 `[gate] ALL PASSED`。
**留痕口径**：交付文档与 PR 描述逐条写「命令 + 真实退出码 + 日志位置」；未运行的检查明确标注「未运行」，禁止把未执行或失败项写成通过，禁止改门禁放宽条件。
**契约测试**：`npm run test:contract --prefix apps/api` 通过，且仓库内 `openapi.yaml` 无 diff。

---

## 9. 交付边界

- GitHub `zxy7755-droid/zeekr-brand-site` 是唯一交付主干：工作分支 push、开目标为 `main` 的 PR。
- CNB 仅运行 / 部署镜像：本次不推送、不开 MR。
- Agent 只开 PR，**不合并 main**；签收人宗雪源。
- 角色分离：设计（本文）→ 前端实现 ∥ 后端实现 → 独立评审 → 硬门禁 → 签收；实现者不自审。
- 本设计节点未编码、未改仓库源码、未执行任何验证命令。

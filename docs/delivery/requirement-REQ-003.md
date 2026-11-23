# 需求定型 · REQ-003：/compare 加载与错误态 + GET /vehicles 请求日志（不改契约）

| 项 | 值 |
| --- | --- |
| 平台工作项 | issue-1795410586564260935 |
| 来源 / 外部 ID | 本地 / 无 |
| 执行角色 | 需求定型（clarify）—— 本节点只确认目标、范围、边界与验收，不编码 |
| 日期 | 2026-11-23 |
| 仓库 | `zeekr-brand-site`（GitHub `zxy7755-droid/zeekr-brand-site`） |
| 基线与工作分支 | `main @ 7c00fa7`；工作分支 `feature/requirement-4-20261123-0509`（两者 HEAD 一致，工作树干净） |
| 状态 | 已定型，待设计 / 前后端实现节点 |

> 本文是 SOP `clarify` 节点的产物（路径 `requirement.md`，位于运行工作区根目录）。
> 交付 PR 时请在仓库 `docs/delivery/` 下另存为独立文件（如 `requirement-REQ-003.md`），
> **不要覆盖**仓库内已有的 `docs/delivery/requirement.md`（P1 设计契约 PRD）。

---

## 1. 目标与非目标

### 目标
1. 让访客在 `/compare` 发起 `GET /vehicles` 期间看到明确的**加载态**，失败时看到**可重试提示与重试按钮**，重试后能恢复到原有 2–3 款并排对比流程，不白屏。
2. 将新增的错误态辅助逻辑做成**可被 `node --test` 直接覆盖**的纯逻辑，并补 1 个单测。
3. 为后端 `GET /vehicles` 增加**结构化请求日志**（`method` / `path` / `durationMs` / `result`），响应结构与状态码保持不变；补 1 个 jest 单测验证日志被调用。
4. 全程不触碰已签收契约，验证「需求 → 设计 → 实现 → 评审 → 硬门禁 → PR」链路可复现。

### 非目标（本期明确不做）
- 不新增接口、不新增路由、不改 `docs/api/openapi.yaml`、不改 `apps/api/prisma/schema.prisma`。
- 不改环境变量、`BASE_PATH` / `NEXT_PUBLIC_BASE_PATH` / `API_BASE_URL` 默认值。
- 不引入任何新的第三方依赖（后端日志使用 NestJS 内置 `Logger`）。
- 不改 2–3 款勾选算法、6 项对比维度、横向滚动表格等既有行为（除为加载/错误/重试所需外）。
- 不做分享链接、URL 持久化、收藏、登录、留资、真实车型参数/价格/官方图。
- 不向 CNB 推送代码、不开 CNB MR；Agent 只开 GitHub PR，不合并 `main`。

---

## 2. 用户与干系人

| 角色 | 场景 | 关注点 |
| --- | --- | --- |
| 访客 | 在桌面/移动端打开 `/compare` 勾选 2–3 款车型 | 加载中有反馈、失败能一键重试、读屏可用、移动端表格可读 |
| 前端实现 / 独立评审 | 改 `apps/web/src/app/compare/page.tsx` 与 `apps/web/test/` | 状态机清晰、helper 可测、无硬编码域名、保留既有对比逻辑 |
| 后端实现 / 独立评审 | 改 `apps/api/src/vehicles/vehicles.controller.ts` 与 `*.spec.ts` | 日志字段齐全、响应零变化、单测可 spy |
| 运维 / 研发 | 排障 `GET /vehicles` 慢请求或失败 | 结构化日志可按 `method/path/result` 检索，含耗时 |
| 签收人 宗雪源（宗老板） | 审阅 PR 与门禁证据后合并 | 真实验证、留痕完整、契约未变更 |

---

## 3. 契约影响评估（硬边界）

| 项 | 结论 | 依据 |
| --- | --- | --- |
| `docs/api/openapi.yaml` | **不改** | `GET /vehicles` 已定义 `VehicleList` / `Error`，日志是服务端副作用，不进入响应 |
| `apps/api/prisma/schema.prisma` | **不改** | 不新增表/字段/枚举 |
| 接口清单 | **不新增** | 仅复用 `GET /vehicles`；前端仍走 `apiUrl()` |
| 环境变量 / `BASE_PATH` | **不改** | 沿用 `contract.ts` / `contract.ts(api)` 镜像常量 |
| 第三方依赖 | **不新增** | NestJS `@nestjs/common` 已含 `Logger` |
| `docs/delivery/design.md` | **不改** | 本次不新增页面路由或路径常量；`hard-gate.sh` / `ci.yml` / 两端 `contract.ts` 无需同步 |
| 品牌素材 | **不改** | 只用 `apps/web/public/brand/` 生成式原创素材；页脚版权常驻 |

**检查方法**：实现节点完成后以 `git diff --name-only` 核对，上述冻结文件不得出现在变更列表中。

---

## 4. 现状盘点（as-is，基于本分支代码实读）

| 能力 | 现状 | 本 REQ 需要做的事 |
| --- | --- | --- |
| 加载态 | 已存在：`vehicles === null` 时渲染 `data-testid="compare-loading"` | **保留**；重试期间也要再次呈现 |
| 错误态 | 已存在：`role="alert"` + `data-testid="compare-error"`，但只显示一段消息 | **保留测试标识**，补可重试提示文案 + 重试按钮 + 可测 helper |
| 空态 | 已存在：`data-testid="compare-empty"` | 保留 |
| 请求取消 | `useEffect` 内 `cancelled` 标志已防止卸载后 setState | 重试需沿用/加强该机制，避免重复请求串扰 |
| 对比逻辑 | `MIN_SELECTION=2` / `MAX_SELECTION=3`、6 项维度、缺失显示「—」、`overflowX` 表格 + sticky 首列 | 全部保留 |
| 后端日志 | `vehicles.controller.ts` 的 `list()` 无任何日志 | 新增结构化日志，try/finally 覆盖成功与失败路径 |
| 单测 | web：`node --test test/*.test.mjs`（现有为静态源码断言）；api：jest `src/**/*.spec.ts` | 各补 1 个；web 新测试须落在 `test/` 且被 `test/*.test.mjs` 通配命中 |
| 门禁 | `hard-gate.sh` 顺序为 web lint→typecheck→api lint→typecheck→**api 单测**→web build→api 契约测试 | **注意：门禁当前不含 web 单测步骤**（见第 10、12 节） |

---

## 5. 功能需求 · 前端（apps/web）

| 编号 | 需求 | 可测试验收要点 |
| --- | --- | --- |
| FR-003.1 | `GET /vehicles` 在途期间展示加载态 | `data-testid="compare-loading"` 在请求发出后可见，成功/失败落地后不可见 |
| FR-003.2 | 失败时展示**可重试提示 + 重试按钮** | `data-testid="compare-error"` 保留且 `role="alert"`；文案含「重试」语义；存在原生 `<button type="button">`，可被键盘聚焦并有可见焦点样式 |
| FR-003.3 | 点击重试重新发起同一请求 | 再次调用 `fetch(apiUrl('/vehicles?pageSize=50'))`；重试期间重新进入加载态；成功后清空错误、恢复车型列表与对比流程，不白屏 |
| FR-003.4 | 重试安全 | 连续点击或前一次请求未结束时重试，旧响应不得覆盖新状态（沿用 `cancelled` 标志或 `AbortController`） |
| FR-003.5 | 错误态辅助逻辑可测 | 抽出纯函数（如把异常/HTTP 状态映射为用户可读错误文案或是否可重试），不依赖 DOM/React 运行时，可被 Node 20 直接 import；新增 `apps/web/test/*.test.mjs` 覆盖至少 2 类输入（网络异常、非 2xx HTTP 状态） |
| FR-003.6 | 既有逻辑不变 | `MIN_SELECTION=2` / `MAX_SELECTION=3`、6 项维度、`—` 占位、`overflowX` 表格与 sticky 首列、页脚版权均保留 |
| FR-003.7 | 无 mock 回退 | 错误态不得退回 fixture/假数据；所有请求仍经 `apiUrl()`，无硬编码域名 |

---

## 6. 功能需求 · 后端（apps/api）

| 编号 | 需求 | 可测试验收要点 |
| --- | --- | --- |
| BR-003.1 | `GET /vehicles` 每次调用产出**一条**结构化日志 | 字段至少含 `method`、`path`、`durationMs`、`result`；建议以 JSON 形式输出便于检索 |
| BR-003.2 | 字段口径 | `method='GET'`；`path='/vehicles'`（取 `RESOURCE_ROUTES.vehicles`，不含 query string）；`durationMs` 为非负数字（毫秒，覆盖成功与失败路径）；`result` 标识成功/失败（如 `success`/`error`，或含 HTTP 状态） |
| BR-003.3 | 响应零变化 | 200 响应仍为 `items/total/page/pageSize`；400/404 等状态码与错误体不变；不新增响应字段；日志异常不得影响响应或抛出 |
| BR-003.4 | 可测试性 | 日志调用可被 jest `spyOn` 观测；新增 `apps/api/src/**/*.spec.ts` 断言成功 `list()` 时日志被调用且含上述四字段 |
| BR-003.5 | 日志卫生 | 不记录请求头、Cookie、手机号等 PII；不记录完整 query（避免无关噪声） |
| BR-003.6 | 无新依赖 / 无契约变更 | 使用 NestJS 内置 `Logger`；不改 OpenAPI / Prisma / 环境变量 |

---

## 7. 非功能需求

| 类别 | 要求 |
| --- | --- |
| 可访问性 | 加载态建议 `role="status"` / `aria-live="polite"`；错误态保留 `role="alert"`；重试按钮为原生 `<button>`、有可读名称与可见焦点；勾选框继续置于 `<label>` 内；键盘可完成勾选与重试 |
| 响应式 | 新增的错误/重试 UI 在窄屏可换行、不溢出；对比表继续置于 `overflowX: auto` 容器并保留 sticky 首列 |
| 品牌合规 | 仅用 `public/brand/` 生成式原创素材；页脚版权常驻；不得出现第三方官方 Logo/车型图/文案原文；示意参数不宣称量产值 |
| 个人信息 | 本需求不采集个人信息；日志与页面文案不得回传手机号 |
| 工程约束 | 路径只用 `apps/web` / `apps/api`；禁止 `cd backend/frontend/web/api`；不提交 `node_modules` / `dist` / `.next` / `reports/` / `.env*` |

---

## 8. 测试策略

| 层 | 命令 | 期望 |
| --- | --- | --- |
| web 单测（**本次新增**） | `npm run test --prefix apps/web` | `node --test test/*.test.mjs` 全绿；新测试覆盖错误 helper 行为，而非仅做源码字符串断言 |
| api 单测（**本次新增**） | `npm run test --prefix apps/api` | jest 全绿；新用例验证日志被调用且字段齐全，既有 6 个 controller 用例不回归 |
| 全量门禁 | `bash scripts/hard-gate.sh`（仓库根执行） | 真实 `exit 0`，日志 `reports/hard-gate.log` 末尾出现 `[gate] ALL PASSED` |
| CI | PR 触发 | `web` / `api` / `contract-check` 三 job 全部 success |
| 契约 | `npm run test:contract --prefix apps/api` | OpenAPI 契约测试通过，且 openapi.yaml 未被修改 |

**浏览器验收（可选，用平台自带浏览器）**：打开 `/compare`，观察加载文案 → 断网或模拟非 2xx → 出现错误提示与重试按钮 → 恢复网络点击重试 → 车型列表与对比表恢复；检查窄屏布局与键盘 Tab 焦点。

---

## 9. 可测试验收标准（签收检查单）

**前端**
- [ ] 加载态在请求期间可见，落地后消失（FR-003.1）
- [ ] 失败时有可读错误提示、`role="alert"`、可见重试按钮（FR-003.2）
- [ ] 点击重试重新请求、再次加载、成功后恢复对比且不白屏（FR-003.3）
- [ ] 并发/重复重试无状态串扰（FR-003.4）
- [ ] 新增 node --test 用例覆盖错误 helper ≥2 类输入且真实通过（FR-003.5）
- [ ] 2–3 款勾选、6 维度、`—` 占位、横向滚动、页脚版权均保留（FR-003.6 / 第 7 节）

**后端**
- [ ] 每次 `GET /vehicles` 产出一条含 `method/path/durationMs/result` 的结构化日志（BR-003.1/2）
- [ ] 响应体与状态码与改动前一致，日志不影响响应（BR-003.3）
- [ ] 新增 jest 用例验证日志被调用，既有用例不回归（BR-003.4）
- [ ] 无 PII 入日志、无新依赖、无契约文件变更（BR-003.5/6）

**全局**
- [ ] `git diff --name-only` 中不含 openapi.yaml / schema.prisma / contract.ts / design.md / hard-gate.sh / ci.yml
- [ ] `bash scripts/hard-gate.sh` 真实 exit 0，日志位置 `reports/hard-gate.log`
- [ ] `npm run test --prefix apps/web` 真实 exit 0（门禁不含此步，须单独执行并留痕）
- [ ] CI 三 job 全绿；PR 描述写明真实命令与退出码
- [ ] PR 目标分支为 `main`、由工作分支提出；Agent 不合并；不向 CNB 推送/开 MR；签收人 宗雪源

---

## 10. 验证命令与留痕口径

在含 `scripts/hard-gate.sh` 的仓库根（本环境为 `/workspace/zeekr-brand-site`）执行：

```bash
# 依赖缺失时先安装（.npmrc 已固定官方源）
npm ci --prefix apps/web
npm ci --prefix apps/api

# 单项验证（真实退出码）
npm run lint --prefix apps/web
npm run typecheck --prefix apps/web
npm run test  --prefix apps/web        # 新增 web 单测，门禁未覆盖，必须单独跑
npm run build --prefix apps/web
npm run lint --prefix apps/api
npm run typecheck --prefix apps/api
npm run test --prefix apps/api
npm run test:contract --prefix apps/api

# 唯一门禁入口
bash scripts/hard-gate.sh
```

**留痕要求**：交付文档与 PR 描述必须逐条写明「命令 + 真实退出码 + 日志位置」。
未运行的检查明确标注「未运行」，禁止把未执行或失败的项写成通过；禁止手动改门禁脚本放宽条件。

---

## 11. 交付与协作边界

- GitHub `zxy7755-droid/zeekr-brand-site` 是唯一交付主干：建工作分支、push、开目标为 `main` 的 PR。
- CNB `tencentmobilityeast/penguin-motors-site` 仅为运行/部署镜像，本次不推送、不开 MR。
- Agent 只开 PR，**不合并 main**；合并与签收由宗雪源完成。
- 角色分离：需求定型（本文）→ 设计 → 前端实现 ∥ 后端实现 → 独立评审 ∥ 独立评审 → 硬门禁 → 签收 → 交付汇总；实现者不自审。
- 若 GitHub 网络或凭据失败：如实记录原因、保留本地产物，不改推 CNB、不伪造 PR 链接。

---

## 12. 已知限制与待设计节点确认事项

1. **门禁缺口**：`scripts/hard-gate.sh` 当前**没有 web 单测步骤**（只有 api 单测）。本 REQ 不修改门禁脚本（属契约工具链冻结），因此新增的 web 单测须用 `npm run test --prefix apps/web` 单独真实执行并留痕；请设计/交付节点在 PR 描述中显式列出该命令与退出码。是否另行扩展门禁属于另一个契约变更议题，不在本 REQ 范围。
2. **错误 helper 的落地形态**：为使 `node --test`（`.mjs`）能在无 TS 转译下直接覆盖，helper 宜为纯 JS/MJS 模块（必要时配类型声明），或由测试以现有静态源码风格断言——后者只能验证存在性、覆盖力弱，**优先前者**。具体文件位置由设计节点确定，但必须满足 FR-003.5 的可测试性要求。
3. **`result` 取值与失败路径日志**：建议成功与 400/500 失败都各记录一条，`result` 明确区分；精确取值（布尔 / 枚举 / 状态码）由设计节点定稿，须保证 jest 用例可断言。
4. **重试交互形态**：内联 banner 或顶部提示均可，以“可见、可聚焦、可一键重试、恢复对比”为判定标准，不强制具体视觉。

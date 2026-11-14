# QA 验证记录 · REQ-002 车型对比页

## 1. 验证范围与环境

本次 QA 在 LoopForge 工作区沙箱（`zeekr-docker`）内完成，**未连接真实 MySQL / 未部到 staging**，因此以下结论仅覆盖代码层静态/单元验证，不代表 GitHub Actions CI 三 job 或 staging `/compare` 可访问性的结论（这两项需在 PR/CD 阶段由平台实际跑出）。

## 2. 实际执行的命令与结果

| 命令 | 范围 | 结果 |
| --- | --- | --- |
| `bash scripts/hard-gate.sh` | 根目录 | 真实 `exit 0`（执行7步：web lint→web typecheck→api lint→api typecheck→api test→web build→api test:contract，全部 `[ok]`） |
| `npm run lint`（api/web） | 分应应用 | 通过 |
| `npm run typecheck`（api/web） | 分应应用 | 通过 |
| `npm run test`（api） | `src/**/*.spec.ts` | 3 suites / 12 tests 通过 |
| `npm run test`（web） | `test/*.test.mjs` | 11 tests 通过 |
| `npm run test:contract`（api） | OpenAPI/design.md 常量校验 | 1 suite / 6 tests 通过 |
| `npm run build`（api） | `tsc -p tsconfig.build.json` | 通过 |
| `npm run build`（web） | `next build` | 通过，`/compare` 预渲染为静态路由 |

## 3. 按需求单逐条核对（`requirement-compare.md`）

| 编号 | 验证方式 | 结果 |
| --- | --- | --- |
| FR-9.1 | 代码静态检查：对比页仅通过 `apiUrl('/vehicles...')` 取数，无其他数据来源 | 通过（静态检查） |
| FR-9.2 | 阅读组件逻辑：`toggle()` 限制 `MAX_SELECTION=3`，选中数 <2 或 >3 时不渲染表格仅渲染提示 | 通过（代码阅读，未做浏览器交互录屏） |
| FR-9.3 | `DIMENSIONS` 数组覆盖 6 项，每项 `format()` 对空值返回 `—` | 通过（单元文本检查覆盖） |
| FR-9.4 | `compare-loading`/`compare-empty`/`compare-error` 三分支均存在且互斥 | 通过 |
| FR-9.5 | `vehicles.service.spec.ts` 断言 `where.status` 始终为 `PUBLISHED`；分页 `skip/take` 按参数计算 | 通过（单元测试实测） |
| FR-9.6 （示意数据≥四条已发布车型） | **未验证** —— 本次未连接真实 MySQL，数据库内是否已导入 ≥ 4 条 `Vehicle(PUBLISHED)`、≥ 3 条 `Store`、≥ 3 条已发布 `NewsArticle` 需在 staging 环境实测 | **依赖部干环境**，请在题签收前确认 |
| FR-9.7 | 静态检查：每行标注“（示意）”，图标仅引用 `public/placeholder/` 新增的纯图形 SVG，无官方标识/文案 | 通过 |
| FR-9.8 | 静态检查：对比表外层 `overflowX: auto`，维度列 `position: sticky` | 通过（代码阅读，未做真实移动端视觉回归） |

## 4. 合规核查

- 新增文件中无“官方/真实系列文案/mock-data”关键字（`grep` 检查不到命中）。
- 图片均引用 `/placeholder/vehicle-placeholder.svg`，未引入外链或官方资源。
- 未调整免责声明文本（由 `layout.tsx` 全局覆盖，未动）。

## 5. 未覆盖项（显式列出，不隐藏）

- GitHub Actions `web / api / contract-check` 三 job 是否全绿 —— 需 PR 推送后由 Actions 实际跑出，本文仅报告本地结果。
- `/compare` 在 staging `https://stage.zeekr.www.xueyuanzong.top/compare` 返回 200 —— 未验证，需部署后实测。
- `/health` 返回 `db: ok` —— 未验证（且 `HealthController` 本轮未动，该项本轮底线不覆盖）。
- 移动端真实设备/浏览器视觉回归 —— 未执行，仅做了代码层 CSS 逻辑核查。

## 6. 结论

代码层静态检查、单元/契约测试、本地构建均通过，硬门禁脚本真实 `exit 0`。但本次未连接真实数据库与 staging，**FR-9.6、CI 三 job、staging 可访问性三项仍需在 PR/CD 阶段进一步确认**，请签收人在此前提。

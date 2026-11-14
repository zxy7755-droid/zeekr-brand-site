# 变更日志 · REQ-002

## [REQ-002] 车型对比页 /compare

### 新增
- 后端：`GET /vehicles`（分页 + `series` 过滤，强制只返回 `status=PUBLISHED`）、`GET /vehicles/{slug}`，响应符合 `docs/api/openapi.yaml` 的 `VehicleList`/`VehicleDetail`，用 Prisma 读 `Vehicle` 表。
- 前端：`/compare` 车型对比页，支持勾选2–3款车型并排对比6项参数（价格区间/续航/电池容量/加速/座位/驱动），含空态/加载态/错误态、移动端横向滚动。
- 前端占位图文件 `public/placeholder/vehicle-placeholder.svg`。
- 单元测试：`apps/api/src/vehicles/*.spec.ts`（后端）、`apps/web/test/compare-page.test.mjs`（前端）。

### 修改
- `apps/api/src/app.module.ts`：注册 `VehiclesModule`。
- `apps/api/package.json`：新增 `postinstall: prisma generate` 脚本键。

### 不变
- `docs/api/openapi.yaml`、`apps/api/prisma/schema.prisma`、`docs/delivery/design.md`（§7 部署契约）、所有环境变量、`.github/workflows/`。

### 合规
- 无官方标识/官方车型图/官方文案原文；所有新增参数文案标注“（示意）”；图标仅引用 `public/placeholder/` 资源。

### 验证
- `scripts/hard-gate.sh` 真实 `exit 0`；`lint/typecheck/build/test/test:contract`（api + web）本地均通过。详见 `delivery.md`。

### 签收
- 唯一人工签收人：宗雪源；本次交付未签收、未晋升生产环境。

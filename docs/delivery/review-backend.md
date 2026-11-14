# 后端评审记录 · REQ-002 车型对比页

| 项 | 值 |
| --- | --- |
| 评审对象 | `apps/api` 新增 `GET /vehicles`、`GET /vehicles/{slug}` |
| 关联分支 | `feature/compare`（起点 `main@3effa2c`） |
| 契约比对 | `docs/api/openapi.yaml`（未修改）、`apps/api/prisma/schema.prisma`（未修改） |

## 1. 变更概览

新增文件：
- `apps/api/src/prisma.service.ts`：唯一 Prisma 客户端封装（`$connect` / `$disconnect` 生命周期挂在 Nest 模块）。
- `apps/api/src/vehicles/vehicles.service.ts`：查询层，分页 + `series` 过滤，**`status` 强制为 `PUBLISHED`**（见下文合规说明）。
- `apps/api/src/vehicles/vehicles.controller.ts`：路由层，`page/pageSize/status` 入参校验，输出形态对应 `VehicleList`/`VehicleDetail`/`Error`（`docs/api/openapi.yaml`）。
- `apps/api/src/vehicles/vehicles.module.ts`：注册控制器/服务/PrismaService。
- `apps/api/src/vehicles/vehicles.service.spec.ts`、`vehicles.controller.spec.ts`：单测，全部 mock PrismaService（没有依赖真实 MySQL）。

修改文件：
- `apps/api/src/app.module.ts`：注册 `VehiclesModule`，`HealthController` 未动。
- `apps/api/package.json`：新增 `postinstall: "prisma generate"`（仅新增脚本键，**未改动 `lint/typecheck/build/test/test:contract` 符契约命令**），用于保证安装后自动生成 `@prisma/client`。

## 2. 契约一致性

- `GET /vehicles` 响应：`{ items, total, page, pageSize }`，与 `VehicleList` schema 一致；`items[]` 字段与 `Vehicle` schema 逐项比对一致（`Date` 均转 `toISOString()`）。
- `GET /vehicles/{slug}` 命中时返回 `VehicleDetail`（`Vehicle` 字段 + `highlights` + `galleryKeys`），未命中返回 404 + `Error` schema。`highlights`/`galleryKeys` 为可选展示字段，由已持久字段（`rangeKm`/`batteryKwh`/`badge`/`imageKey`）在控制器层现場衍生，**未对 `schema.prisma` 新增字段**。
- 错误响应统一为 `{ status, title, detail, traceId }`（`traceId` 用 `randomUUID()`），与 `Error` schema 一致。
- `page < 1`、`pageSize` 超出 `[1,100]`、`status` 传入非 `DRAFT/PUBLISHED/ARCHIVED` 均返 400。

## 3. 合规决定：`status` 过滤行为（重要）

`docs/api/openapi.yaml` 对 `status` 定义了 `DRAFT/PUBLISHED/ARCHIVED` 三值柚举，但 `docs/delivery/requirement-compare.md` FR-9.5 明确要求“只返回 `status=PUBLISHED`”。实现采用：

- 入参层仍校验 `status` 柚举合法性（错误值 400），**保持与 OpenAPI 字段取值域匹配**；
- 但查询层（`VehiclesService.list`）对外始终以 `where.status = PUBLISHED` 实执，**忽略客户端传入的其他取值**，避免未发布/已归档车型通过公开接口泄露。
- 单测 `vehicles.service.spec.ts` 专门覆盖该分支：传入 `status: 'DRAFT'` 时断言 Prisma 调用的 `where.status` 仍为 `PUBLISHED`。

请签收人重点核实该决定是否与需求意图一致（已在 `decision.md` 记录）。

## 4. 未触动范围复核

- `docs/api/openapi.yaml`、`apps/api/prisma/schema.prisma`、`docs/delivery/design.md` 部署契约部分、环境变量、`.github/workflows/`：**未修改**（`git status` 已核实，见 `delivery.md` 附录）。
- `HealthController` 未动（其返回体缺 `db` 字段与 `Health` schema 不完全匹配是遗留问题，不在 REQ-002 范围内，未修复，请单列 backlog）。

## 5. 本地验证结果（真实执行，非推断）

- `npm run lint`（api）：通过
- `npm run typecheck`（api）：通过
- `npm run test`（api）：3 suites / 12 tests 通过
- `npm run test:contract`（api）：1 suite / 6 tests 通过
- `npm run build`（api, `tsc -p tsconfig.build.json`）：通过

完整输出见 `delivery.md` 与 `reports/hard-gate.log`（未入库，按 `.gitignore` 规定）。

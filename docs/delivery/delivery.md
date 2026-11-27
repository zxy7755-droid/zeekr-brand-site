# 交付汇总索引

## REQ-003 · `/compare` 加载与错误态 + `GET /vehicles` 请求日志（不改契约）— 本轮交付

- 平台工作项 `issue-1795410586564260935`；基线 `main @ 7c00fa7` → 工作分支 `feature/requirement-4-20261123-0509`，验证时 HEAD `1d28bf4`，交付汇总文档随分支后续提交推送。
- 交付 PR：[#23](https://github.com/zxy7755-droid/zeekr-brand-site/pull/23)（`base=main`，`state=open`、`merged=false`，GitHub API 实测 HTTP 200）。
- 本轮完整汇总见 [`delivery-REQ-003.md`](delivery-REQ-003.md)（工作区根同名文件同步留痕）；实现/设计/需求留痕见 `implementation-REQ-003.md` / `design-REQ-003.md` / `requirement-REQ-003.md`。
- 真实验证：`bash scripts/hard-gate.sh` → exit 0（`[gate] ALL PASSED`）；`npm run test --prefix apps/web` → exit 0（15/15）。门禁不含 web 单测，已单独执行。
- 已知限制：浏览器手动可视化验收未运行；P3 建议 5 项（详见 `delivery-REQ-003.md` §2/§4）。未合并 main、未推送 CNB，签收人宗雪源。

---

# 交付汇总 · REQ-002 车型对比页 `/compare`

| 项 | 值 |
| --- | --- |
| 需求编号 | REQ-002 |
| 基线 | `main@3effa2c`（含已签收 P1 设计契约与 `docs/delivery/requirement-compare.md`） |
| 工作分支 | `feature/compare` |
| 唯一人工签收人 | 宗雪源 |
| 当前状态 | **实现 + 本地验证完成，等待人工签收；未晋升生产环境** |

## 1. 改动清单

**后端 `apps/api`**
- 新增 `src/prisma.service.ts`
- 新增 `src/vehicles/{vehicles.module.ts, vehicles.controller.ts, vehicles.service.ts}`
- 新增 `src/vehicles/{vehicles.controller.spec.ts, vehicles.service.spec.ts}`
- 修改 `src/app.module.ts`（注册 `VehiclesModule`）
- 修改 `package.json`（新增 `postinstall: prisma generate`，未动其余脚本）

**前端 `apps/web`**
- 新增 `src/app/compare/page.tsx`
- 新增 `public/placeholder/vehicle-placeholder.svg`
- 新增 `test/compare-page.test.mjs`

**交付留痕**
- `docs/delivery/{review-backend.md, review-frontend.md, review-qa.md, decision.md, delivery.md, changelog.md}`

**未触动**（已通过 `git status` 复核）：`docs/api/openapi.yaml`、`apps/api/prisma/schema.prisma`、`docs/delivery/design.md`（其§7 部署契约部分）、所有环境变量、`.github/workflows/` 下所有文件。

## 2. 本地验证结果（均为本次会话在 `zeekr-docker` 沙箱内实测输出，非推断）

| 命令 | 范围 | 结果 |
| --- | --- | --- |
| `bash scripts/hard-gate.sh` | 根目录 | 真实 `exit 0`，日志写入 `reports/hard-gate.log`（未入库） |
| `npm run lint` | `apps/web`、`apps/api` | 均通过 |
| `npm run typecheck` | `apps/web`、`apps/api` | 均通过 |
| `npm run test`（api） | `jest` | 3 suites / 12 tests 通过 |
| `npm run test`（web） | `node --test` | 11 tests 通过 |
| `npm run test:contract`（api） | `jest`（契约校验） | 1 suite / 6 tests 通过 |
| `npm run build`（api） | `tsc -p tsconfig.build.json` | 通过 |
| `npm run build`（web） | `next build` | 通过，`/compare` 预渲染为静态路由，首屏 JS 95.2 kB |

**未验证项**（依赖 CI/CD 或 staging 环境，本会话不具备条件）：GitHub Actions `web/api/contract-check` 三 job、staging `/compare` 可访问性、`/health` 返回 `db: ok`、数据库示意数据数量（FR-9.6）。详见 `review-qa.md` §5。

## 3. 关键实现决定（详见 `decision.md`）

1. `GET /vehicles` 对 `status` 参数仍按 OpenAPI 做入参校验，但查询层强制只返回 `PUBLISHED`。
2. `VehicleDetail.highlights/galleryKeys` 从已持久字段现场衍生，未改 Prisma schema。
3. 前端占位图统一使用新增的通用 SVG，未按 `imageKey` 逐个映射。
4. `apps/api/package.json` 新增 `postinstall` 脚本以自动生成 Prisma Client，未动已定义命令。

## 4. 签收前置条件

- [x] 本地 lint / typecheck / build / test / test:contract 均通过
- [x] `hard-gate.sh` 真实 `exit 0`
- [x] 文档、接口、数据模型契约未被改动（已用 `git status` 复核）
- [ ] GitHub Actions 三 job 全绿（待确认）
- [ ] staging `/compare` 可访问且 `/health` 返回 `db: ok`（待 CD 后确认）
- [ ] 宗雪源人工签收（**未签收前不晋升生产环境**）

## 5. PR

- PR 链接：https://github.com/zxy7755-droid/zeekr-brand-site/pull/6
- 源分支 → 目标分支：`feature/compare` → `main`
- 关联提交：`64f750a853086dcbcd2a96091913d82c5312b42d`（代码与测试）+ 本文档更新提交
- PR 描述仅包含客观改动与本地验证结果，不代为对 GitHub Actions CI 下结论；CI 三 job 状态请在 PR 页面查看后再推进签收流程。

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

---

# 交付汇总 · REQ-009 用户注册功能（追加章节）

| 项 | 值 |
| --- | --- |
| 需求编号 | REQ-009 |
| 平台工作项 | `issue-1795747721083338871` |
| 原始诉求 | 「增加一个用户注册的功能 企鹅汽车」（企业微信群 @irisPM） |
| 工作分支 | `feature/requirement-9-20261127-0248` |
| 基线 | `main@af19e6e` |
| PR 目标分支 | `main`（只开不合并） |
| 结论 | **本节点汇总与留痕已完成；注册功能未实现，终态 `human`，须唯一签收人决策** |

## A. 改动范围（实际为 0）

本轮前后端实现节点均因 AC-11「契约签收 PR」硬前置未满足而受阻，**仓库源码零改动**：
无 `POST /auth/register`、无 `User` 模型、无 `/register` 页面、无注册相关测试；契约文件
（`docs/api/openapi.yaml`、`apps/api/prisma/schema.prisma`、`docs/delivery/design.md`、两侧
`contract.ts`）均未改动。核对结果：`git status --short` 空、`git rev-list --count origin/main..HEAD`
为 `0`、受跟踪源码中注册相关标识 0 命中。本 PR 只包含本节交付留痕，不包含功能代码。

## B. 评审意见

后端独立评审与前端独立评审结论均为 **REJECT**：核心交付为 0，AC-1～AC-12 全部无实现可验；
上游操作本身合规（未改契约、未用 mock、未伪造证据）予以确认。阻断根因是需求与已签收基线契约
冲突、决策权属唯一签收人，故两份评审终态均为 `human`，不提交 pass/rework/fail。

## C. 真实验证命令与退出码

| 命令 | 退出码 | 说明 |
| --- | --- | --- |
| `cd /workspace/zeekr-brand-site && bash scripts/hard-gate.sh` | **0** | 末行 `[gate] ALL PASSED`，2026-11-27T06:53:19～06:53:44+0000 |
| 日志 | — | `reports/hard-gate.log`（gitignored，不入库），SHA-256 `46dd9b28d4c2e7df6d42407027e596fdd1a10c28362fdd4bbbc498c3f7899eae` |

门禁七步真实通过：web lint / web typecheck / api lint / api typecheck / api unit test
（3 suites / 13 tests）/ web build（路由 `/`、`/_not-found`、`/compare`、`/stores/[id]`，无 `/register`）
/ api contract test（1 suite / 6 tests，仍断言「包含 5 类资源路径」）。

## D. 已知限制

1. 门禁跑在**未改动基线**上，仅证明基线健康，**不构成注册功能已实现或已验证的证据**；AC-12 须实现后重跑。
2. AC-1～AC-12 的浏览器/键盘/axe/响应式/回执/运行态接口验证、注册功能单测与契约测试、
   GitHub Actions 与 CNB 两侧 CI 三 job 均**未运行**，不写为通过。
3. 因无实现，品牌素材、页脚版权、`consent` 强制、手机号/密码日志脱敏等合规项记为「未运行/不适用」。
4. 本 PR 仅含交付留痕，不合并 main；合并与签收由唯一签收人在 GitHub 完成。未向 CNB 推送或开 MR。

## E. PR

- PR 链接：<!-- PR_LINK -->待创建<!-- /PR_LINK -->

## F. 待人工决策

唯一签收人须二选一：(1) 批准真实账号注册的契约变更，另开契约签收 PR 并走 `Contract sign-off`
对 `contract-signoff` 环境的审批，签收落地后再重启实现；(2) 否决真实注册，改走「注册意向登记 /
资讯订阅」回退方案。「人工批准继续」（`admin` / `T43390029A`）不能替代上述任一决策。

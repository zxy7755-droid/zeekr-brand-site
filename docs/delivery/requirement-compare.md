# 需求单 REQ-002 · 车型对比页 `/compare`

| 项 | 值 |
| --- | --- |
| 编号 | REQ-002 |
| 提出 | 2026-11-15（新接需求，用于全链路演练） |
| 关联基线 | PR #3 已签收的 P1 设计契约（v1.0） |
| 签收人 | 宗雪源 |
| 状态 | 待实现 → 待评审 → 待签收 |

## 1. 背景与目标

访客在浏览车型时，需要把多款车的核心参数放在一起横向比较；当前站点没有这个能力，只能逐个进出详情页。
本期新增一个**车型对比页**，让访客一次勾选 2–3 款车型并排查看参数。

目标：
1. 新增页面 `/compare`，成为 PRD 信息架构中的第 8 个页面
2. 验证「新需求 → 契约核对 → 前后端并行实现 → 独立评审 → 双门禁 → PR → CI → CD → staging 可访问」全链路
3. 全程不改变已签收的接口契约与数据模型

## 2. 契约影响评估（关键）

| 项 | 结论 |
| --- | --- |
| OpenAPI | **不变**。对比数据复用已定义的 `GET /vehicles`（`Vehicle` 已含 `priceMin/priceMax/rangeKm/batteryKwh/zeroToHundred/seats/driveType/imageKey`） |
| 数据模型 | **不变**。复用 `Vehicle` 表，不新增表/字段/枚举 |
| 环境变量 | **不变**。仍为 `API_BASE_URL` / `DATABASE_URL` / `BASE_PATH` |
| 部署契约 | **不变**。仍按 staging `3000/3001`、prod `3002/3003` 分槽 |

因此本需求**不触发重新签收**：契约冻结条款适用于「契约变更」，本次只是把已签收契约中尚未实现的 `GET /vehicles` 与第 8 个页面落地。
需在 `docs/delivery/design.md` 补一条页面路由记录，在 PRD 信息架构补第 8 行。

## 3. 功能需求

| 编号 | 需求 | 验收要点 |
| --- | --- | --- |
| FR-9.1 | 页面 `/compare` 展示可勾选的车型列表 | 数据来自 `GET /vehicles`，统一走 `src/lib/contract.ts` 的 `apiUrl()`；无 fixture 回退分支 |
| FR-9.2 | 勾选 2–3 款后并排对比 | 少于 2 款或超过 3 款给出明确提示，不生成对比表；参数行对齐 |
| FR-9.3 | 对比维度 | 价格区间、续航、电池容量、加速、座位、驱动形式，共 6 行；字段缺失显示「—」而非报错 |
| FR-9.4 | 空态 / 加载态 / 错误态 | 三种状态都有可见文案；接口失败不白屏 |
| FR-9.5 | 后端 `GET /vehicles`、`GET /vehicles/{slug}` | 按 OpenAPI 返回 `VehicleList` / `VehicleDetail`，只返回 `status=PUBLISHED`；分页参数生效 |
| FR-9.6 | 车型数据 | 至少 4 条已发布车型、3 条门店、3 条已发布资讯，均为官网展示内容，图片键指向 `/brand/` |
| FR-9.7 | 合规 | 页面底部常驻版权信息；不出现官方标识、官方图、官方文案；参数标明「参数」 |
| FR-9.8 | 响应式 | 移动端可横向滚动对比表，表头固定可读 |

## 4. 非目标

- 真实车型参数、真实价格、官方图
- 分享链接 / URL 查询参数持久化 / 收藏
- 新增后端对比专用接口（前端在已获取的列表上做对比）
- 登录、下单、留资（试驾表单不在本页）

## 5. 准入与验收

- `scripts/hard-gate.sh` 真实 `exit 0`，日志进 `reports/hard-gate.log`
- GitHub Actions 三 job 全绿（web / api / contract-check）
- `GET /vehicles` 返回符合契约的分页结构；`/compare` 页面渲染出 ≥4 个可勾选项
- staging 环境 `https://stage.penguin.www.xueyuanzong.top/compare` 返回 200，`/health` 返回 `db: ok`
- PR 含需求单、设计增量、评审记录、交付汇总；**唯一人工签收人 = 宗雪源**

## 6. 交付留痕清单

`requirement-compare.md`（本文）、`design.md`（页面路由增量）、`review-backend.md`、`review-frontend.md`、
`review-qa.md`、`decision.md`、`delivery.md`、`changelog.md`。

## 7. 签收

> 实现与评审完成后，由宗雪源在人工验收门签收；签收前不得晋升 prod。

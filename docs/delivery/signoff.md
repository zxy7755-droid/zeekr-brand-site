# 契约签收台账

> 唯一人工签收人：**宗雪源**。
> 签收动作 = 在 Actions 运行 `Contract sign-off`，由签收人在 `contract-signoff` 环境点审批；GitHub 记录审批人、时间与 commit，作为可审计的留痕。
> 本文件不预置签名，工程侧不代签、不代批。

## 1. 签收批次

| 批次 | 范围 | 基线 PR / 合并 commit | 状态 |
| --- | --- | --- | --- |
| P1 设计契约 | PRD v1.0、OpenAPI、MySQL 数据模型、部署契约 | PR #3 · `57a89a3` | 已签收 · PR #17 `df2adcf2` |
| REQ-002 | 车型对比页需求单、页面路由增量 | PR #4 · `3effa2c` | 已签收 · PR #17 `df2adcf2` |
| 品牌切换 | 企鹅汽车正式授权品牌官网、10 张生成图、对外域名 | PR #11 · `51f0c0f` | 已签收 · PR #17 `df2adcf2` |
| 双环境拆分 | prod compose、手动晋升、部署机升配 4核8G | PR #15 / #16 · `da6c8db` / `29b3775` | 已签收 · PR #17 `df2adcf2` |

## 2. 签收规则

1. 签收批次以本台账为准；契约变更须开**新签收 PR** 并重新走签收流程
2. **签收动作**：在 Actions 手动运行 `Contract sign-off`，签收人审批 `contract-signoff` 环境后 job 才执行，审批记录（reviewer / 时间 / commit）即签收证据
3. **不使用 PR Approve**：本仓库 PR 作者与 CODEOWNER 同为 `zxy7755-droid`，GitHub 禁止作者审批自己的 PR
4. 分支保护（1 审 + CODEOWNERS + CI 三 job + 会话解决）是**代码合并门禁**，与签收门分离
5. 以下变更须开**新的签收 PR**，不得在原批次上追加：
   - `docs/api/openapi.yaml` 的路径或 Schema 变更
   - `apps/api/prisma/schema.prisma` 的数据模型变更
   - `design.md` 部署契约（端口 / 域名 / 数据库 / 晋升方式）变更
   - `requirement.md` 第 0 节的品牌与授权口径变更
6. 生产晋升是**另一道门**：`promote.yml` 绑定 `production` Environment，需同一签收人在 Actions 审批部署；push 到 main 不会自动进生产

## 3. 签收证据

- **首批（四个批次）**：宗雪源于 2026-11-15 16:32 在对话中确认，签收 PR #17 合并于 `df2adcf2`。因「作者自审」限制，该 PR **没有 Approve review 留痕**，此处如实标注，不虚构签名
- **后续批次**：以 `Contract sign-off` workflow run 的 `contract-signoff` 环境审批记录为准
- 本地 `P1设计契约签收单.html` 仅作当时的展示材料，不作为签收依据

## 4. 与平台的分工

- **GitHub**：契约事实源、版本基线、签收留痕（环境审批）、生产审批（`production` Environment）
- **LoopForge 平台**：流程状态（需求 issue → 会话 → SOP 节点 → 人工门），读取签收状态作为设计节点准入条件
- 平台需求：**ZBS-3「契约签收与基线冻结（关联 PR #17）」**，绑定 `通用后端交付 SOP` 与 `zeekr-brand-site` 仓库
- 平台不生产、不版本化 PRD；`docs/delivery/` 是 PRD 与契约的唯一事实源

# 契约签收台账

> 唯一人工签收人：**宗雪源**。
> 签收动作 = 在 GitHub 上对「契约签收 PR」提交 **Approve** review；GitHub 记录 reviewer、时间与 commit，作为可审计的签收留痕。
> 本文件不预置签名，工程侧不代签、不代批。

## 1. 待签收批次

| 批次 | 范围 | 基线 PR / 合并 commit | 状态 |
| --- | --- | --- | --- |
| P1 设计契约 | PRD v1.0、OpenAPI、MySQL 数据模型、部署契约 | PR #3 · `57a89a3` | 待 CODEOWNER Approve |
| REQ-002 | 车型对比页需求单、页面路由增量 | PR #4 · `3effa2c` | 待 CODEOWNER Approve |
| 品牌切换 | 企鹅汽车正式授权品牌官网、10 张生成图、对外域名 | PR #11 · `51f0c0f` | 待 CODEOWNER Approve |
| 双环境拆分 | prod compose、手动晋升、部署机升配 4核8G | PR #15 / #16 · `da6c8db` / `29b3775` | 待 CODEOWNER Approve |

## 2. 签收规则

1. 签收 PR 只改 `docs/delivery/signoff.md` 与签收规则，不含业务代码
2. 分支保护已启用：1 个 approving review、CODEOWNERS 必审、CI 三 job 必过、会话必须解决
3. **Approve 即签收**；合并后基线冻结，签收证据永久留在 GitHub 的 review 历史中
4. 以下变更须开**新的签收 PR**，不得在原批次上追加：
   - `docs/api/openapi.yaml` 的路径或 Schema 变更
   - `apps/api/prisma/schema.prisma` 的数据模型变更
   - `design.md` 部署契约（端口 / 域名 / 数据库 / 晋升方式）变更
   - `requirement.md` 第 0 节的品牌与授权口径变更
5. 生产晋升是**另一道门**：`promote.yml` 绑定 `production` Environment，需同一签收人在 Actions 中审批部署；push 到 main 不会自动进生产

## 3. 签收证据

以 GitHub PR 的 review 记录为准（reviewer / state / submitted_at / commit_id），本台账不重复记录签名。
本地 `P1设计契约签收单.html` 仅作当时的展示材料，不作为签收依据。

## 4. 与平台的分工

- **GitHub**：契约事实源、版本基线、签收留痕（PR review）、生产审批（Environment）
- **LoopForge 平台**：流程状态（需求 issue → 会话 → SOP 节点 → 人工门），读取签收状态作为设计节点的准入条件
- 平台不生产、不版本化 PRD；`docs/delivery/` 是 PRD 与契约的唯一事实源

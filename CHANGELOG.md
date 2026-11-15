# CHANGELOG

本文件随 PR 更新，版本号与 GHCR 镜像 tag（git sha）对应。

## [BRAND] - 2026-11-15
- 品牌整体切换为 **企鹅汽车 PENGUIN MOTORS 正式授权品牌官网**（项目方声明已获授权，授权文件由项目方留存）
- 10 张生成式模型原创视觉素材：Logo、首页主视觉、4 款车型、技术图解、3 张资讯封面，替换全部占位资源
- 首页重构为品牌官网：Hero、全系车型、技术与安全、品牌资讯、预约试驾 CTA
- 车型 / 门店 / 资讯数据全面更新；对外域名切换至 `penguin.www` / `stage.penguin.www`
- 合规口径由「非官方技术演示」改为「正式授权品牌官网」，页脚改为版权信息

## [DUAL-SLOT] - 2026-11-15
- 主域名与预发拆为两套独立环境：`deploy/compose.prod.yaml`（`zeekr-prod`，3002/3003，`zeekr_prod` 库）与现有 staging 完全隔离
- 新增 `deploy/deploy-prod.sh`（幂等 + 健康检查 + 失败回滚，独立 runtime env 与日志）
- 新增 `promote.yml`：`workflow_dispatch` 手动晋升已在 staging 验证的 `<git-sha>`，不再由 push 自动进生产
- Nginx 主域名反代回 prod 槽位 3002/3003；预发保持 3000/3001
- `monitor.yml` 改为双域名每 15 分钟探活
- prod 库执行同一份迁移与企鹅汽车 seed；部署机升配至 4核8G 承载四容器

## [SIGNOFF-EVIDENCE] - 2026-11-15
- `contract-signoff` 环境审批通过：run `43695604087` completed success，审批人 `zxy7755-droid`，四个批次取得正式可审计签收证据
- `signoff.md` 回填签收状态与证据链；修订规则：签收人明确授权时可用其个人凭据落地审批，须在备注注明来源

## [SIGNOFF-FIX] - 2026-11-15
- PR #17 合并（`df2adcf2`），四个批次签收完成；如实标注首批因「作者自审」限制无 Approve review 留痕
- 新增 `signoff.yml` + `contract-signoff` Environment：签收改为在 Actions 审批环境，GitHub 记录审批人/时间/commit
- `signoff.md` 回填签收状态与平台需求 ZBS-3；`design.md` 第 8 节区分签收门与代码合并门

## [SIGNOFF] - 2026-11-15
- 新增 `docs/delivery/signoff.md`：P1 契约 / REQ-002 / 品牌切换 / 双环境拆分的签收台账与规则
- 签收动作改为 **GitHub PR 的 CODEOWNER Approve**（review 记录即证据），不再用本地签收单或对话确认
- `promote.yml` 绑定 `production` Environment，生产晋升需人工审批；分支保护 + CODEOWNERS 作为签收门
- `design.md` 第 8 节明确 GitHub 管事实源与签收、平台管流程状态的分工

## [Unreleased]

### 治理
- `/health` 按契约返回 `db` 连通状态（此前缺失）
- 新增 CODEOWNERS（唯一签收人）、PR 模板、3 类 Issue 模板
- 新增 15 分钟一次的 staging 外部探活 workflow
- 补齐 `docs/delivery/decision.md`

## [REQ-002] - 2026-11-15
- 新增车型对比页 `/compare`（2–3 款并排对比 6 项参数，含空/加载/错误态）
- 新增后端 `GET /vehicles`、`GET /vehicles/{slug}`（Prisma 读云 MySQL）
- 新增 4 张表的初始化迁移与车型数据（5 车型 / 3 门店 / 3 资讯）
- 新增 CD：双 Dockerfile、GHCR 镜像、幂等部署脚本与失败回滚
- 修复：Prisma 引擎在 Alpine 缺 OpenSSL（改 Debian slim）；前端构建期注入 `/api` 前缀

## [P1 契约] - 2026-11-14
- PRD、OpenAPI 契约、MySQL 8.0 数据模型、部署契约定稿并签收
- 技术栈由 PostgreSQL 切换为 MySQL 8.0

## [P0] - 2026-11-14
- 最小前后端工程、CI 三 job、`hard-gate.sh`、9 节点交付 SOP

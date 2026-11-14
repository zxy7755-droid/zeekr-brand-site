# CHANGELOG

本文件随 PR 更新，版本号与 GHCR 镜像 tag（git sha）对应。

## [Unreleased]

### 治理
- `/health` 按契约返回 `db` 连通状态（此前缺失）
- 新增 CODEOWNERS（唯一签收人）、PR 模板、3 类 Issue 模板
- 新增 15 分钟一次的 staging 外部探活 workflow
- 补齐 `docs/delivery/decision.md`

## [REQ-002] - 2026-11-15
- 新增车型对比页 `/compare`（2–3 款并排对比 6 项参数，含空/加载/错误态）
- 新增后端 `GET /vehicles`、`GET /vehicles/{slug}`（Prisma 读云 MySQL）
- 新增 4 张表的初始化迁移与示意数据（5 车型 / 3 门店 / 3 资讯）
- 新增 CD：双 Dockerfile、GHCR 镜像、幂等部署脚本与失败回滚
- 修复：Prisma 引擎在 Alpine 缺 OpenSSL（改 Debian slim）；前端构建期注入 `/api` 前缀

## [P1 契约] - 2026-11-14
- PRD、OpenAPI 契约、MySQL 8.0 数据模型、部署契约定稿并签收
- 技术栈由 PostgreSQL 切换为 MySQL 8.0

## [P0] - 2026-11-14
- 最小前后端工程、CI 三 job、`hard-gate.sh`、9 节点交付 SOP

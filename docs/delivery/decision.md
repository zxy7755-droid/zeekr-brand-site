# 决策记录（REQ-002 与全链路演练）

| 编号 | 决策 | 理由 | 影响 |
| --- | --- | --- | --- |
| D-01 | 新需求选「车型对比页 `/compare`」，复用 `GET /vehicles` | 可完整带动前后端 + 数据库 + CD，但不改已签收契约 | 不触发重新签收；PRD 补第 8 页、design.md 补页面路由 |
| D-02 | 实现由 LoopForge 默认执行机驱动，不从外部 URL 下载补丁 | 平台绑定仓库是正规来源；Main Bot 曾以供应链安全为由拒绝外部补丁 | PR #6 由平台 OAuth 推出，全程未使用个人 PAT 推代码 |
| D-03 | 数据库用云 MySQL 8.0，迁移 SQL 由 `prisma migrate diff` 生成 | 与 `schema.prisma` 严格一致，避免手写漂移 | staging 库 4 表 + 示意数据；prod 待签收后晋升 |
| D-04 | CD 只自动发布 staging，prod 保留人工门 | 签收人是唯一放行点，未签收不得晋升生产 | `cd.yml` 仅 staging；prod 需另行触发 |
| D-05 | 部署失败自动回滚到上一版本 env | 第二次 CD 因 Prisma 引擎崩溃，回滚机制真实生效 | 站点从 502 恢复到 200，未影响基线 |
| D-06 | api 基础镜像由 `node:22-alpine` 改 `node:22-bookworm-slim` | Prisma 5.16 musl 引擎依赖 `libssl.so.1.1` | PR #7 修好容器启动 |
| D-07 | web 构建期注入 `API_BASE_URL=/api` | `next.config.mjs` 在 build 时把该值内联进客户端 bundle，运行时 env 无效 | PR #8 修好 `/compare` 取数，Nginx 反代到 api 槽位 |
| D-08 | `/health` 补 `db` 字段并检查数据库连通 | OpenAPI 契约要求 `db`，实现缺字段 | 探活 workflow 可据此判定数据库不可用 |
| D-09 | 治理项不等签收先补齐 | 分支保护 / CODEOWNERS / 探活属于工程基线，与业务签收解耦 | main 保护、15 分钟外部探活、模板入库 |

## 待决策（需宗雪源拍板）

1. 老轻量服务器 2026-12-12 到期、runner 会话 2026-12-14 到期：续费还是整套迁到境外 CVM
2. 部署机 2核4G 是否在 prod 启用前升配到 4核8G
3. 品牌书面授权是否会有（影响占位素材能否替换）
4. prod 槽位何时启用、由谁触发晋升

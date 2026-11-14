# 产品需求文档（PRD）· ZEEKR 品牌站点演示工程

| 项 | 值 |
| --- | --- |
| 版本 | v1.0（P1 设计契约定稿，待签收） |
| 日期 | 2026-11-14 |
| 签收人 | 宗雪源（唯一人工验收门） |
| 状态 | **待签收** —— 签收前不得进入实现阶段 |

## 0. 合规声明（最高优先级）

本项目是**非官方技术演示工程**，用于验证「LoopForge 编排 + GitHub CI/CD + 腾讯云」的全链路交付能力，
与吉利集团及 ZEEKR 品牌无任何关联、授权或背书关系。

- 全站使用**占位素材**与**示意数据**，不放官方标识、官方车型图、官方文案原文
- 每页底部常驻免责声明；仓库根目录保留 `THIRD_PARTY_NOTICES.md` 与素材来源清单
- 不开放注册、下单、支付、在线客服等真实业务功能
- 试驾表单仅演示线索采集链路，字段最小化，不做真实邀约
- 书面授权到位前，不得以任何形式对外署名或发布为品牌官方站点

> 本条为**否决项**：任何 PR 中出现官方素材或移除免责声明，一律驳回。

## 1. 目标与非目标

**目标**
1. 用一条真实需求跑通「需求 → 设计契约 → 并行实现 → 独立评审 → 双门禁 → PR → CD → staging」全链路
2. 所有环节在云端完成，不依赖开发者本机
3. 产出可审计的交付留痕（需求、设计、评审、测试、签收）

**非目标（本期不做）**
- 真实交易、账号体系、支付、库存、CRM 对接
- 官方品牌素材替换、SEO 投放、多语言
- 高并发压测、多地域容灾、独立生产 SLA

## 2. 用户与场景

| 角色 | 场景 | 关注点 |
| --- | --- | --- |
| 访客 | 浏览车型 / 参数 / 门店 / 资讯 | 页面加载快、移动端可用、信息清晰 |
| 访客 | 提交预约试驾意向 | 表单简短、有明确反馈、知道数据用途 |
| 工程/评审 | 查看 PR、CI 报告、交付文档 | 契约一致、测试可复现、改动可追溯 |

## 3. 信息架构（7 个页面）

| # | 页面 | 路由 | 主要数据来源 |
| --- | --- | --- | --- |
| P1 | 首页 | `/` | 车型精选、资讯摘要 |
| P2 | 车型总览 | `/vehicles` | `GET /vehicles` |
| P3 | 车型详情 | `/vehicles/[slug]` | `GET /vehicles/{slug}` |
| P4 | 技术与安全 | `/technology` | 静态示意内容（占位文案） |
| P5 | 门店与预约试驾 | `/stores` | `GET /stores` + `POST /test-drive-leads` |
| P6 | 品牌资讯 | `/news`、`/news/[slug]` | `GET /news`、`GET /news/{slug}` |
| P7 | 关于与联系 | `/about` | 静态示意内容 + 免责声明 |

所有页面共享：顶部导航、页脚免责声明、占位图占位框（`apps/web/public/placeholder/`）。

## 4. 功能需求

| 编号 | 需求 | 验收要点 |
| --- | --- | --- |
| FR-1 | 车型列表支持分页与筛选（`series`、`status`） | 返回 `items + total + page + pageSize`；空列表返回空数组而非错误 |
| FR-2 | 车型详情按 `slug` 查询 | 存在返回详情，不存在返回 404 标准错误体 |
| FR-3 | 门店列表按 `city` 过滤 | 返回城市、地址、营业时间；示意数据不少于 3 条 |
| FR-4 | 资讯列表与详情 | 列表分页；详情含正文；未发布资讯不出现在列表 |
| FR-5 | 预约试驾线索提交 | 必填 `vehicleSlug / name / phone / consent`；手机号校验；成功后只返回受理编号与时间，**不回传手机号** |
| FR-6 | 健康检查 | `GET /health` 返回 `status / service / version / timestamp / db` |
| FR-7 | 前端不接 mock 数据 | 统一走 `src/lib/contract.ts` 的 `apiUrl()`；无 fixture 回退分支 |
| FR-8 | 交付留痕 | 8 份文档随 PR 入库：`requirement / design / review-backend / review-frontend / review-qa / decision / delivery / changelog` |

## 5. 数据对象

| 对象 | 关键字段 | 说明 |
| --- | --- | --- |
| `Vehicle` | `slug`、`name`、`series`、`priceMin/priceMax`、`rangeKm`、`batteryKwh`、`imageKey`、`status`、`sortOrder` | 示意车型，价格单位：元 |
| `TestDriveLead` | `vehicleSlug`、`name`、`phone`、`city`、`storeId?`、`preferredAt?`、`consent` | PII 最小化；`consent=true` 才可提交 |
| `Store` | `name`、`city`、`district`、`address`、`phone`、`businessHours` | 示意门店 |
| `NewsArticle` | `slug`、`title`、`summary`、`body`、`coverKey`、`tag`、`publishedAt`、`status` | 示意资讯 |

数据模型以 `apps/api/prisma/schema.prisma` 为准，数据库为 **MySQL 8.0（utf8mb4）**，两环境分库 `zeekr_stage` / `zeekr_prod`。

## 6. 非功能需求

| 类别 | 指标 |
| --- | --- |
| 性能 | 首页 LCP ≤ 2.5s、CLS ≤ 0.1、INP ≤ 200ms（4G 移动网络模拟） |
| 兼容 | 移动优先；Chrome / Safari 最近两个大版本 |
| 可访问性 | 语义化标签、图片 alt、表单 label、键盘可达 |
| 安全 | 线索接口速率限制；错误信息不回显内部细节；密钥不入库；日志脱敏 `_API_KEY/_TOKEN/_SECRET/_PASSWORD` |
| 可观测 | `/health` 含数据库连通状态；Actions 与部署日志可回溯 |
| 工程约束 | `scripts/hard-gate.sh` 真实 `exit 0`；CI 三 job 全绿；契约测试通过 |

## 7. 合规与内容口径

- 图片一律引用 `placeholder/*` 资源，字段命名用 `imageKey` / `coverKey`，不存外链
- 所有文案为工程示意文本，不引用官方宣传语
- 试驾表单旁明示「仅用于技术演示，不会发起真实邀约」，并提供数据用途说明
- 线索留存：演示数据保留 90 天后自动清理（后续迭代实现）
- 仓库根目录 `NOTICE` / `THIRD_PARTY_NOTICES.md` 记录占位素材与第三方依赖来源

## 8. 验收标准（签收检查单）

- [ ] 7 个页面可访问，页脚免责声明全站可见
- [ ] 5 类接口响应符合 `docs/api/openapi.yaml`，错误体统一
- [ ] 无官方素材、无 fixture 回退分支、无硬编码路径
- [ ] `hard-gate.sh` 真实 exit 0；CI 三个 job 全部 success；契约测试通过
- [ ] PR 含 8 份交付文档，签收人可逐份查阅
- [ ] staging 环境可访问且 `/health` 返回 `db: ok`
- [ ] 部署凭据仅存在于 GitHub Secrets 与 600 权限 env 文件

## 9. 依赖与假设

- 平台：LoopForge 0.3.8；执行机：境外 CVM（GitHub 直连）
- 数据库：腾讯云 MySQL 8.0 内网实例 `10.242.0.15:3306`
- 部署：同 VPC 部署机分槽（staging `3000/3001`，prod `3002/3003`），HTTPS 由 Nginx 终止
- 凭证：GitHub Actions Secrets（`DEPLOY_SSH_KEY` / `DEPLOY_HOST` / `DEPLOY_USER`）
- 假设：品牌授权不落地，因此所有对外展示内容保持占位与示意

## 10. 签收

> 本 PRD 与 `design.md`、`openapi.yaml`、`schema.prisma` 共同构成 P1 设计契约。
> **签收人：宗雪源。** 签收后 SOP 方可进入「前端实现 / 后端实现」节点；签收前的任何实现 PR 一律驳回。

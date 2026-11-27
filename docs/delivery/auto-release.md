# 自动发布链路（2026-11-27）

目标：需求进入 LoopForge → 企微卡片签收 → 自动合并 PR → 构建 → staging → 自动晋升生产 → 企微回执；日常发布**不需要任何人工点按钮**。

## 现状分工

| 层 | 组件 | 职责 |
| --- | --- | --- |
| 需求 / 流程 / 人工签收 | LoopForge（企微卡片） | 需求建单、LOOP 执行、**唯一人工动作：签收确认** |
| 代码托管 / PR | GitHub `zxy7755-droid/zeekr-brand-site` | 分支保护（web / api / contract-check 三 CI 全绿、线性历史） |
| 发布平台 | CNB（`.cnb.yml` + `.cnb/tag_deploy.yml`） | 制品库、部署环境、版本 / tag、前置条件、按风险审批、回滚视图 |
| 过渡期实际部署 | GitHub Actions `cd.yml` | 构建 GHCR → staging；production 自动晋升补丁已生成但**待应用**（当前 PAT 缺 `workflow` scope） |
| 运行层 | 部署机 `/opt/zeekr/deploy*.sh` | 双槽位、备份上一版、失败自动回滚 |

## 当前状态

- ✅ CNB 侧 `.cnb.yml` / `.cnb/tag_deploy.yml` 已改为全自动发布链路（CNB 账号授权后即生效）
- ⏳ GitHub 过渡补丁（`cd.yml` 增加自动 promote job）已生成在服务器 `~/lf-card-build/github-actions-patch/`，需要一枚带 `workflow` scope 的 PAT 才能推送
- ⏳ CNB 账号 / 访问令牌 / 密钥仓库 / 部署机 `registry.env` 待项目方授权
- ✅ LoopForge 企微卡片签收已经打通；签收后自动合并 PR 由守护脚本承担（见 `forge_watchdog.py`）

## 自动晋升条件

1. `main` 有代码 push（`.md` / `docs/**` 不触发）
2. web / api 两个镜像构建并推送成功
3. staging 部署后 `/` 返回 200
4. 静默 120 秒（CNB 侧 `require: environmentName: staging, after: 120`）
5. 生产部署后主域名 `/` 返回 200；失败则由 `deploy-prod.sh` 回滚上一版

高风险变更（契约、DB migration）走 `contract-signoff` 环境审批；审批动作回流到企微卡片，不需要去平台页面点。

## 回滚

- 应急按 tag 重部署：`Promote to production`（GitHub Actions，保留 `production` Environment 审批）
- CNB 侧：在对应 tag 的「部署」里选择 `staging` / `production` 环境重新部署，或回退到上一 sha
- 代码回滚：`git revert` 后 push main，自动链路会再跑一遍

## CNB 切流待办（需要账号授权）

1. 在 CNB 导入 / 创建 `tencentmobilityeast/penguin-motors-site` 仓库并同步 main
2. 签发访问令牌（最小权限：`repo-code:rw` / `pull:rw` / `pipeline:rw` / `artifact:rw`）
3. 密钥仓库注入 `DEPLOY_SSH_KEY` / `DEPLOY_HOST` / `DEPLOY_USER` / `CNB_REGISTRY_TOKEN` / `CNB_REGISTRY_USER`，并在 `.cnb.yml` 打开 `imports`
4. 把 `.cnb/tag_deploy.yml` 与 `.cnb/codeowners` 里的 `xueyuanzong` 换成实际 CNB 账号
5. 部署机下发 `/etc/zeekr/registry.env`（`IMAGE_PREFIX` 指向 CNB 制品库）
6. 设置 `CNB_DEPLOY_ENABLED=true`，打开 CNB 自动触发，观察 24 小时双跑
7. 确认无误后关闭 GitHub Actions 自动触发，`cd.yml` / `promote.yml` 仅保留应急
8. （可选过渡）用带 `workflow` scope 的 PAT 应用 `github-actions-patch/` 里的 `cd.yml` / `promote.yml`，让 GitHub 侧在 CNB 切流前也能自动晋升

> 注：全量切换代码托管到 CNB 需要给 LoopForge 新增 `cnb` provider（约 1200–1800 行 Go 补丁，见 `cnb-migration.md` 第 4 节）。当前方案**不改平台源码**：GitHub 继续托管代码，CNB 只做发布层，这样避免了第三方补丁破坏官方升级路径。

# 全量迁移到 CNB（去掉 GitHub）

> 目标：代码托管、CI/CD、镜像制品、保护分支、审批门、LoopForge 平台集成全部迁到 CNB，
> GitHub 可归档。本文件是执行蓝图 + 进展记录（第 8 节）；已完成的步骤不代表全量迁移结束。

## 0. 边界与现状

| 层 | 现状 | 迁移后 |
| --- | --- | --- |
| 代码托管 / PR / 签收 | GitHub `zxy7755-droid/zeekr-brand-site` | CNB 仓库 |
| 流水线 | `.github/workflows/` 5 个（CI / CD / promote / signoff / monitor） | `.cnb.yml` + `.cnb/tag_deploy.yml` |
| 镜像 | `ghcr.io/zxy7755-droid/zeekr-brand-site-{web,api}` | `docker.cnb.cool` 制品库 |
| 门禁 | 分支保护 + CODEOWNERS + `production` / `contract-signoff` Environment | 保护分支 + `.cnb/codeowners` + 部署环境 `require.approver` |
| **平台集成** | LoopForge `provider = github` | **需给平台加 `cnb` provider（第 4 节）** |
| 运行层 | 部署机 / Nginx / 双槽位 / 云 MySQL / 两个域名 | 不变，只换镜像来源 |

本仓库已落地、且**不影响现有 GitHub 链路**的迁移资产：

- `.cnb.yml`：CI（三 job）、构建推镜像、staging 部署、15 分钟双域名探活、`tag_deploy.*` 部署/签收流水线
- `.cnb/tag_deploy.yml`：`contract-signoff` / `staging` / `production` 三个环境 + 审批前置条件
- `.cnb/codeowners`：契约、部署脚本、流水线变更必须由签收人评审
- `deploy/compose*.yaml`：镜像前缀改为 `${IMAGE_PREFIX:-ghcr.io/zxy7755-droid/zeekr-brand-site}`，默认行为不变
- `deploy/deploy*.sh`：支持 `/etc/zeekr/registry.env` 下发 `IMAGE_PREFIX` 与 `CNB_REGISTRY_TOKEN`，可选 `docker login docker.cnb.cool`

## 1. 前置条件（需要项目方提供）

1. **CNB 根组织 + 仓库**：导入 GitHub 仓库（含分支、标签、提交历史）
2. **访问令牌**：个人设置 → 访问令牌，最小权限建议 `repo-basic-info:r`、`repo-code:rw`、`pull:rw`、`issue:rw`、`pipeline:rw`、`artifact:rw`；分别给「平台集成」和「部署机拉镜像」各发一枚
3. **制品库开箱即用**（仓库「制品」页直接给出指引，无需开通）：登录 `docker login -u cnb docker.cnb.cool`，密码为访问令牌；镜像路径为 `docker.cnb.cool/<组织>/<仓库>/<镜像名>`，`.cnb.yml` 已按 `tencentmobilityeast/penguin-motors-site` 配好
4. **密钥仓库**：`DEPLOY_SSH_KEY` / `DEPLOY_HOST` / `DEPLOY_USER` / `CNB_REGISTRY_TOKEN` / `CNB_REGISTRY_USER`，用 `imports` 注入 `.cnb.yml`
5. **部署机**：下发 `/etc/zeekr/registry.env`（600 权限），内容 `IMAGE_PREFIX=<制品库前缀>/zeekr-brand-site`、`CNB_REGISTRY_TOKEN=...`、`CNB_REGISTRY_USER=...`
6. **平台维护窗口**：重建 LoopForge 镜像并重启，预计 3–5 分钟平台不可用
7. **CNB 用户名**：替换 `.cnb/codeowners` 与 `.cnb/tag_deploy.yml` 里的 `xueyuanzong` 占位

## 2. CNB OPENAPI 事实（平台适配依据）

- 基址 `https://api.cnb.cool`；认证 `Authorization: Bearer ${token}`，`Accept: application/vnd.cnb.api+json`
- 仓库路径参数 `{repo}` 形如 `<组织>/<仓库>`；Swagger：`https://api.cnb.cool/swagger.json`（201 个路径）

| 能力 | 方法与路径 |
| --- | --- |
| 仓库信息 | `GET /{repo}` |
| 分支 | `GET,POST /{repo}/-/git/branches` |
| 文件内容 | `GET /{repo}/-/git/contents/{file_path}` |
| 提交 | `GET /{repo}/-/git/commits`、`GET /{repo}/-/git/commits/{ref}` |
| PR | `GET,POST /{repo}/-/pulls`、`GET,PATCH /{repo}/-/pulls/{number}`、`PUT /{repo}/-/pulls/{number}/merge` |
| 评审 | `POST,DELETE /{repo}/-/pulls/{number}/reviewers`、`GET,POST /{repo}/-/pulls/{number}/reviews` |
| PR 评论 | `GET,POST /{repo}/-/pulls/{number}/comments` |
| Issue | `GET,POST /{repo}/-/issues`、`GET,PATCH /{repo}/-/issues/{number}`、`GET,POST /{repo}/-/issues/{number}/comments` |
| 流水线 | `POST /{repo}/-/build/start`、`GET /{repo}/-/build/status/{sn}` |
| 分支保护 | `GET,POST /{group}/-/git-group-settings/branch-protections` |

注意：CNB 的 PR 叫「合并请求」，端点路径是 `/-/pulls`；API 形态更接近 GitLab，与 GitHub REST 不兼容，**不能只改 base URL 复用**。

## 3. CNB 侧配置（UI 一次性）

1. 保护分支 `main`：勾选「需要评审人批准」「需要通过状态检查」；用 `git:reviewer` 读取 `.cnb/codeowners`
2. 部署审批：`.cnb/tag_deploy.yml` 已声明 `require.approver`，在页面确认审批人为实际 CNB 账号
3. 定时任务：`"crontab: */15 * * * *"` 挂在 `main` 分支，最小间隔 5 分钟，时区 Asia/Shanghai
4. 切换前保持「设置 → 云原生构建 → 允许自动触发」关闭；`.cnb.yml` 的部署步骤另有 `CNB_DEPLOY_ENABLED != true` 跳过保护
5. 首跑校验项：CNB `services` 起 MySQL 的写法、`imports` 密钥路径、CI 三 job 是否通过

## 4. LoopForge 平台 provider 改造（B 方案的核心）

平台源码位于部署机 `~/LoopForge/internal/`（Go，当前 0.3.8）。现有抽象已经是双分支（`provider = github | gongfeng`），新增 `cnb` 是**产品级适配**，不是配置开关。

| 文件 | 改动 | 说明 |
| --- | --- | --- |
| `httpapi/catalog.go:197` | 白名单加 `cnb` | 1 行；`domain.Repository.Provider` 是 string，模型无需改 |
| `httpapi/git_token_verify.go` | 加 CNB 校验分支 | `GET https://api.cnb.cool/user` + Bearer，校验 scope |
| `httpapi/github_auth.go` → 新增 `cnb_auth.go` | 访问令牌模式 | CNB 无 GitHub OAuth device flow，改为「个人凭证」里直接配 token |
| `httpapi/assistant_workspace_mr.go`（570 行，已有 gongfeng 分支） | 加 CNB MR 分支 | `POST /{repo}/-/pulls` 创建、`GET /{repo}/-/pulls/{n}` 查询、`POST .../reviewers` 加评审人 |
| `httpapi/agent_tool_github.go`（682 行） → 新增 `agent_tool_cnb.go` | Issue / PR / 评论工具 | 用第 2 节端点重写，不能复用 GitHub 版 |
| `tracker/github.go`（251 行） → 新增 `tracker/cnb.go` | 同步提交 / Issue | `GET /{repo}/-/git/commits`、`GET /{repo}/-/issues` |
| `gitwork/auth.go` | 加 `cnbInsteadOfPrefixes` | `https://cnb.cool/` 重写为带 token 的 HTTPS，供 runner clone/push |
| `httpapi/sync.go`、`dispatch.go`、`assistant_workspace_open.go` | 按 Provider 分发 | `RepositoryContext` 已带 Provider，主要是补分支与上下文文案 |

估算：新增约 1200–1800 行 Go + 单测，改 8–10 个文件；重建平台镜像 1 次。**这是给第三方产品打补丁**：后续官方升级需要 rebase patch，评估前请确认能接受失去平滑升级路径。

构建与回退沿用既有升级流程：先备份 `~/LoopForge/backups/`（源码 + MySQL dump + 当前镜像 tag），`docker build` 新镜像 → `docker compose up -d` → 健康检查；失败则恢复原镜像 tag 与 DB 快照。

## 5. 切换步骤

| 阶段 | 动作 | 回退 |
| --- | --- | --- |
| 0 备份 | 平台源码 + MySQL dump + 镜像 tag + GitHub 仓库镜像克隆 | — |
| 1 CNB 准备 | 导入仓库、开制品库、密钥仓库、保护分支、审批门 | 无需回退（GitHub 未动） |
| 2 镜像双写 | CNB 流水线推 `docker.cnb.cool`，GitHub Actions 仍推 GHCR；部署机保持 GHCR | 关闭 CNB 自动触发 |
| 3 平台改造 | 应用第 4 节补丁、重建镜像、验证「绑定 CNB 仓库 → clone → 开 MR」 | 恢复备份镜像 + DB |
| 4 切流 | 部署机 `/etc/zeekr/registry.env` 下发 CNB 前缀与 token；关闭 GitHub Actions；打开 CNB 自动触发 | 删 `registry.env` 即回 GHCR，重新打开 Actions |
| 5 观察 | 24 小时内验证双环境部署、探活、审批门、签收留痕 | 同上 |
| 6 归档 | GitHub 仓库设为只读归档，保留 PAT 撤销记录 | — |

切换期间线上站点不应中断：双 registry 并存时部署机只换 `IMAGE_PREFIX`，容器滚动重建，Nginx 与域名不变。

## 6. 校验清单

- [ ] CNB PR 触发三 job 全绿，保护分支阻止未评审合并
- [ ] `main.push` 构建并推送 `web` / `api` 两个镜像到 `docker.cnb.cool`
- [ ] staging 自动部署成功；`production` 部署按钮被 `require.approver` 拦住
- [ ] `contract-signoff` 环境审批记录可查（审批人 / 时间）
- [ ] 15 分钟定时任务同时探活主域名与预发，失败标红
- [ ] 平台能用 CNB provider 绑定仓库、runner 能 clone、SOP 能开 MR
- [ ] 主域名 / 预发 `/`、`/compare`、`/api/health`、`/brand/*` 全部 200

## 7. 已知风险

- 平台源码补丁失去官方平滑升级路径（最大长期成本）
- CNB 制品库地址与登录方式已按官方指引确认；`services` MySQL 写法仍需首跑校验
- 定时任务 `CNB_TOKEN` 默认仅限当前仓库，跨仓同步要开组织级开关
- 双平台过渡期 PR / 签收记录会分裂，需在 `signoff.md` 注明两处证据
- 平台重建有 3–5 分钟停机，且当前 ZBS-3 的 SOP 尚未跑满，建议先完成或中止再动平台


## 8. 进展记录（2026-11-15 20:30）

| 项 | 状态 |
| --- | --- |
| CNB 组织 `tencentmobilityeast` | 已登录，原有 5 个仓库与 `*-secrets` 密钥仓库惯例 |
| 私有仓库 `tencentmobilityeast/penguin-motors-site` | 已创建 |
| 访问令牌 `penguin-motors-migration` | 已创建：**指定组织**范围、Git 客户端凭据 + 制品库场景、永久有效；明文仅存部署机 600 权限文件，未写入仓库或日志 |
| Docker 制品库 | 开箱即用，地址 `docker.cnb.cool/tencentmobilityeast/penguin-motors-site/<镜像名>`，登录用户 `cnb` |
| 代码全量镜像 | **已完成**：`git push --mirror` 推送 22 个 refs（21 分支 + HEAD），`main = 354bdb3` |
| CNB 流水线 | **已自动触发并通过**：`push` 事件构建 `cnb-knh-1k7fjs1ja`，2/2 成功，2m36s |
| Docker 制品 | **已生成**：`zeekr-brand-site-web` / `zeekr-brand-site-api`，tag 为完整 commit sha |
| 部署机 `/etc/zeekr/registry.env` | **已下发并切流**：`root:deploy 640`，含 `IMAGE_PREFIX` + `CNB_REGISTRY_TOKEN`；deploy 用户 `docker login` 成功并可拉取两个镜像 |
| 运行层 | **已切换**：staging / prod 四容器全部运行 `docker.cnb.cool/...:354bdb3`；两个域名 `/`、`/compare`、`/api/health`、`/api/vehicles`、`/brand/hero.jpg` 全 200，`db: ok` |
| LoopForge 平台 `cnb` provider | **未改造**（第 4 节）：需重建平台镜像停机，且会失去官方升级路径，待维护窗口确认 |
| GitHub Actions | 仍在运行（双写状态）；归档前需先关闭 |

> 令牌权限备注：当前 `penguin-motors-migration` 勾的是「Git 客户端凭据 + 制品库」，实测 OPENAPI 查构建历史 / 触发状态会返回 `10023 Missing required scopes: repo-cnb-history:r / repo-cnb-trigger:r`。平台 provider 改造前需另发一枚带 `repo-pr`、`repo-issue`、`repo-cnb-trigger` 等 scope 的专用令牌。

> 回退方式：删除 `/etc/zeekr/registry.env` 中的 `IMAGE_PREFIX` 一行，下次部署即回到 GHCR 镜像；`.env.previous` 亦保留上一版前缀。

> 安全提示：当前令牌为组织级、永久有效。切流完成后应换成「指定仓库 + 90 天」令牌并轮换，同时撤销本枚。

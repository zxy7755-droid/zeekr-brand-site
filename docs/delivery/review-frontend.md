# 前端评审记录 · REQ-002 车型对比页

| 项 | 值 |
| --- | --- |
| 评审对象 | `apps/web` 新增 `/compare` 页面 |
| 关联分支 | `feature/compare`（起点 `main@3effa2c`） |

## 1. 变更概览

新增文件：
- `apps/web/src/app/compare/page.tsx`：对比页，`'use client'`，通过 `src/lib/contract.ts` 的 `apiUrl('/vehicles?pageSize=50')` 拉取列表，无 fixture 回退分支。
- `apps/web/public/placeholder/vehicle-placeholder.svg`：新增占位车型图标（纯图形评意，无官方标识/车型图）。
- `apps/web/test/compare-page.test.mjs`：静态文本检查（与现有 `contract.test.mjs` 同风格，因 web 侧未引入 React 测试库）。

## 2. 需求逐条对应

| 需求 | 实现 |
| --- | --- |
| FR-9.1 列表数据来源 | `fetch(apiUrl('/vehicles?pageSize=50'))`，无其他数据来源 |
| FR-9.2 勾选 2–3 款 | `selected` 最大 3 款（超出自动禁用其他复选框），`<2` 或 `>3` 仅提示、不出表 |
| FR-9.3 6 项参数 | 价格区间/续航/电池容量/加速/座位/驱动，缺失字段显示 `—` |
| FR-9.4 空/加载/错误态 | `compare-loading`/`compare-empty`/`compare-error` 三种 testid 分支 |
| FR-9.7 合规 | 每行参数标注“（示意）”；使用 `public/placeholder/` 占位图，无官方标识/图/文案；全站免责声明由 `layout.tsx` 全局覆盖，未动 |
| FR-9.8 响应式 | 对比表外层 `overflowX: auto`，维度列使用 `position: sticky; left: 0`固定，横向滚动时可读 |

## 3. 注意事项（非阻塞常规，建议后续跟进）

- 本页未暴露 `series`/`status` 前端筛选 UI，仅调用后端默认过滤（规格未要求，属按最小实现范围）。
- 图标统一使用单一占位 SVG，未按 `imageKey` 映射到个别图形文件（仓库中尚无实际车型占位图文件，若后期补充可改为 `imageKey` 逐个映射）。
- 使用 `next/image` + `unoptimized`，避免 `@next/next/no-img-element` 规则在 `--max-warnings 0` 下被判失败，同时无需配置 `next.config.mjs` 的 SVG 象量优化白名单。

## 4. 本地验证结果（真实执行，非推断）

- `npm run lint`（web）：通过
- `npm run typecheck`（web）：通过
- `npm run test`（web, `node --test test/*.test.mjs`）：11 tests 通过（其中 7 项为本页新增，4 项为原 `contract.test.mjs`）
- `npm run build`（web, `next build`）：通过，`/compare` 预渲染为静态路由，首屏 JS 95.2 kB

完整输出见 `delivery.md`。

# AGENTS.md — TMagic编辑器

> 魔方平台可视化编辑器核心，提供拖拽式活动页面编辑能力。
> 负责人：roymondchen | 创建：2026-04-03

## 项目概述

TMagic Editor 是魔方平台的可视化编辑器核心库，提供拖拽式组件编辑、配置面板、预览发布等能力。支持 Vue 和 React 双框架 Runtime，采用 pnpm monorepo 管理多个核心包。开源项目，同时支持内部业务定制。

编辑器本体使用 Vue 3；UI 通过 `@tmagic/design` + adapter 接入 Element Plus 或 TDesign Vue Next。

**技术栈：** Vue 3, TypeScript, Vite, rolldown, vitest, VitePress, Element Plus / TDesign Vue Next
**环境：** Node.js `^20.19.0 || >=22.12.0`，pnpm `11.21.0`
**当前版本：** `1.8.0-beta.25`
**主仓库：** `https://git.woa.com/vft-magic/tmagic-editor.git`
**开源仓库：** `https://github.com/Tencent/tmagic-editor.git`

## 架构地图

关键目录：

- `packages/` — 核心 npm 包（`editor`、`form`、`stage`、`core`、`cli`、`data-source`、`schema`、`form-schema`、`design`、`utils`、`dep`、`table`、`element-plus-adapter`、`tdesign-vue-next-adapter`）
- `runtime/` — Vue/React Runtime，以及 `vue-runtime-help`、`react-runtime-help`、`tmagic-form`
- `vue-components/` — Vue 业务组件封装
- `react-components/` — React 业务组件封装
- `playground/` — 演示 playground
- `docs/` — VitePress 文档
- `scripts/` — 构建和发布脚本
- `eslint-config/` — 共享 ESLint 配置

## 开发约定

**分支策略（内部约定）：** 日常开发走 `dev`；test/prod 对应 `master`。开源文档站与 playground 从 `dev` 发布。
**提交规范：** commitlint（`@commitlint/config-conventional`）+ husky，格式 `type(scope): subject`，详见 `CONTRIBUTING.md`
**测试：** 新增或修改的代码必须补充单元测试，覆盖率不低于 85%（lines）。`pnpm coverage` 执行两层硬门禁：
1. 全仓 lines ≥ 85%（vitest `coverage.thresholds`）
2. 工作区相对 HEAD 的 `packages/*/src` 变更逐文件 lines ≥ 85%（不含 design / UI adapter；未测新文件按 0% 计）
pre-commit 跑 lint-staged 与 `pnpm check:type`，pre-push 跑 `pnpm coverage`。

**禁止事项：**

- 禁止在核心包中引入腾讯内部专有依赖（开源项目）
- 禁止直接修改 CHANGELOG.md，应通过 `pnpm changelog` 生成
- 禁止提交未达 85% 测试覆盖率的新增/修改代码

## 常用命令

    pnpm bootstrap        # 安装依赖并构建
    pnpm pg               # 启动 Vue playground
    pnpm pg:react         # 启动 React playground
    pnpm build            # 完整构建（DTS + 包）
    pnpm test             # 运行测试
    pnpm coverage         # 运行测试、生成覆盖率，并执行 85% 门禁
    pnpm check:type       # TypeScript 类型检查
    pnpm lint-fix         # ESLint 修复
    pnpm docs:dev         # 启动文档开发
    pnpm release          # 发版

## 深入阅读

| 文档            | 说明             |
| --------------- | ---------------- |
| docs/           | VitePress 文档站 |
| CONTRIBUTING.md | 贡献指南         |
| CHANGELOG.md    | 变更日志         |

# AGENTS.md — TMagic编辑器

> 魔方平台可视化编辑器核心，提供拖拽式活动页面编辑能力。
> 负责人：roymondchen | 创建：2026-04-03

## 项目概述

TMagic Editor 是魔方平台的可视化编辑器核心库，提供拖拽式组件编辑、配置面板、预览发布等能力。支持 Vue 和 React 双框架 Runtime，采用 pnpm monorepo 管理多个核心包。开源项目，同时支持内部业务定制。

**技术栈：** Vue 3, Element Plus, TypeScript, Vite, vitest, VitePress
**主仓库：** `https://git.woa.com/vft-magic/tmagic-editor.git`
**开源仓库：** `https://github.com/Tencent/tmagic-editor.git`

## 架构地图

关键目录：
- `packages/` — 核心编辑器包（202 *.vue, 194 *.ts）
- `runtime/` — Vue/React Runtime 实现
- `vue-components/` — Vue 组件封装
- `react-components/` — React 组件封装
- `playground/` — 演示 playground
- `docs/` — VitePress 文档（100 *.md）
- `scripts/` — 构建和发布脚本
- `eslint-config/` — 共享 ESLint 配置

## 开发约定

**分支策略：** dev=dev, test/prod=master
**提交规范：** commitlint + husky，`type: 描述`

**禁止事项：**
- 禁止在核心包中引入腾讯内部专有依赖（开源项目）
- 禁止直接修改 CHANGELOG.md，应通过 `pnpm changelog` 生成

## 常用命令

    pnpm bootstrap        # 安装依赖并构建
    pnpm pg               # 启动 Vue playground
    pnpm pg:react         # 启动 React playground
    pnpm build            # 完整构建（DTS + 包）
    pnpm test             # 运行测试
    pnpm lint-fix         # ESLint 修复
    pnpm docs:dev         # 启动文档开发
    pnpm release          # 发版

## 当前状态

**当前里程碑：** {待人工填写}

## 深入阅读

| 文档 | 说明 |
|------|------|
| docs/ | VitePress 文档站 |
| CONTRIBUTING.md | 贡献指南 |
| CHANGELOG.md | 变更日志 |

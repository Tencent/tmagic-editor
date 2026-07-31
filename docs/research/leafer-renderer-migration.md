# 调研：把 editor 端从 iframe + StageMask 改成 leafer 渲染

> 目标：editor 端不再用 iframe 跑 Vue/React runtime，改为直接用 leafer-ui 渲染 DSL；runtime 保持不变，作为独立的"运行时预览"面板存在。
> 关联：[多 page 无限画布调研](./multi-page-infinite-canvas.md) — leafer 路径下大量步骤变成"自然结果"，本调研替代其中 StageRender / StageMask / ActionManager / ScrollViewer 相关改动。

---

## 0. 一句话总结

**核心变化**：editor 端从「跨 iframe 通信改 DOM」改成「DSL → leafer 场景树 → canvas」。runtime 那套 Vue/React/iframe 完全保留，挪到独立预览面板。

**4 个关键改造点**：

1. **StageRender → LeaferRender** — `packages/stage/src/StageRender.ts:248-275` 的 iframe 创建/挂载/同源检测/srcdoc fallback 整段替换为 leafer 场景树
2. **MComponent → leafer 视觉映射** — 每个组件 type 注册一个 shape 函数，built-in 类型（container/text/image/button）走默认映射，自定义类型由业务方 `editor.registerShape` 提供
3. **editor ↔ canvas 通信直连** — `packages/stage/src/types.ts:249` 的 Magic API（`updatePageId / add / update / remove / select`）和 `packages/editor/src/services/editor.ts` 里所有 `runtime?.xxx?.()` 调用全部删除；editor 直接 mutate DSL → leafer scene diff 重画
4. **StageMask / ActionManager / StageDragResize / ScrollViewer 整包瘦身** — `packages/stage/src/StageMask.ts:358` `StageDragResize.ts` `ActionManager.ts` `util/scroll-viewer.ts` 这些都是为了「跨 iframe 操作 DOM」而存在的胶水代码，leafer 自带 viewport / 选区 / 拖拽 / snap / 辅助线

**核心 trade-off**：editor 画布上看到的视觉是 leafer 画的，不是 Vue/React 组件渲染的。两者通过"shape 函数"对齐，但不能保证 100% 像素级一致。需要「运行时预览」面板让业务方看真实效果。

---

## 1. 现状盘点（基于代码）

### 1.1 editor ↔ runtime 跨边界通信

| 概念 | 现状 | 文件 |
| --- | --- | --- |
| 渲染容器 | iframe（同源直接 src / 跨域 srcdoc） | `packages/stage/src/StageRender.ts:109-126` |
| 跨边界 API | `Magic` 接口（`updateRootConfig / updatePageId / add / update / remove / select`） | `runtime/vue-runtime-help/src/hooks/use-editor-dsl.ts:66-90`、`packages/stage/src/types.ts:240-250` |
| editor 调用 runtime | `editorService` 注入 `runtime` ref + postMessage | `packages/editor/src/services/editor.ts:313-325,432-444` |
| 选区 / 蒙层 | `StageMask` 覆盖在 iframe 之上，监听 pointer 事件 | `packages/stage/src/StageMask.ts:1-358` |
| 拖拽 / 缩放 | 集成 `moveable` 库 + 自定义 `StageDragResize / StageMultiDragResize` | `packages/stage/src/StageDragResize.ts:1-?`、`packages/stage/src/StageMultiDragResize.ts:1-?` |
| 辅助线 / 参考线 | `Rule` + `moveable` 的 guidelines | `packages/stage/src/Rule.ts:1-?` |
| 滚动 / 缩放 | 自定义 `ScrollViewer`，以 page 尺寸为基准 | `packages/editor/src/components/ScrollViewer.vue:1-131`、`packages/editor/src/utils/scroll-viewer.ts:1-167` |
| 组件渲染 | 业务方 `app.registerComponent(type, VueComponent)` → 注入到 runtime | `runtime/vue/page/main.ts:53`、`runtime/vue/playground/main.ts:46` |

### 1.2 DSL → 视觉 链路

```
DSL (MApp) 
  → App.setConfig()
  → App.setPage(id)         # 单例，销毁旧的 Page 实例
  → new Page({config, app}) # 构建 Node 树
  → runtime App.vue: 
      <MagicUiPage config={pageConfig} />
        → useDsl().pageConfig
        → <Container v-for>
          → <Button v-for> ← 业务方注册的 Vue 组件
            → 真实 DOM
  → editor 通过 iframe.contentWindow.document 看到 DOM
  → editor 通过 Magic API 反向操控 runtime
```

**这个链路有 3 个成本**：

1. **跨边界通信成本**：editor 改 style → postMessage → runtime 重新渲染 → 通知 editor。同步变异步，editor 要等 runtime-ready 事件才能选中组件
2. **iframe 创建成本**：跨域用 srcdoc fallback（`StageRender.ts:113-117`），多一层 fetch HTML 解析
3. **Mental model 成本**：业务方要懂 2 套生命周期（Vue/React 组件生命周期 + editor service 状态机）

### 1.3 业务方组件实现

`vue-components/` 和 `react-components/` 下每个 type 一个文件，共 8 个内置 type：
- `page`、`container`、`text`、`button`、`img`、`qrcode`、`overlay`、`page-fragment`、`page-fragment-container`、`iterator-container`
- 都很简单：`text` 是 `<p v-html>`、`button` 是 `<button>`、`container` 是 `<div v-for>` 渲染子项

参考：`vue-components/button/src/index.vue:1-31`、`vue-components/text/src/index.vue:1-37`、`vue-components/container/src/Container.vue:1-46`

---

## 2. 目标态

### 2.1 架构对比

**当前**：

```
┌─────────────────────────────────────────────┐
│  editor (Vue 3)                             │
│  ┌──────────┐  ┌──────────────────────────┐ │
│  │ Sidebar  │  │ StageContainer (DOM)     │ │
│  │ Props    │  │  ├─ StageMask (overlay)  │ │
│  │ PageBar  │  │  │   ├─ Rule / Drag etc. │ │
│  └──────────┘  │  │                        │ │
│                │  └─ <iframe> ←──┐         │ │
│                │      document   │         │ │
│                │                  │         │ │
│                │      ┌───────────┘         │ │
│                │      │ postMessage          │ │
│                │      │ Magic API            │ │
│                │  ┌───┴──────────────┐     │ │
│                │  │ runtime (Vue/React) │   │ │
│                │  │  <MagicUiPage>     │   │ │
│                │  │   <Container>      │   │ │
│                │  │    <Button>        │   │ │
│                │  └───────────────────┘     │ │
│                └──────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**目标**：

```
┌─────────────────────────────────────────────┐
│  editor (Vue 3)                             │
│  ┌──────────┐  ┌──────────────────────────┐ │
│  │ Sidebar  │  │ StageContainer           │ │
│  │ Props    │  │  └─ <canvas>             │ │
│  │ PageBar  │  │      └─ leafer scene     │ │
│  └──────────┘  │          ├─ page frames  │ │
│                │          ├─ shape trees  │ │
│                │          └─ selection box │ │
│                └──────────────────────────┘ │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ PreviewPanel (独立 tab / drawer)     │  │
│  │  └─ <iframe> ← runtime (Vue/React)  │  │
│  │      保留,只用来"看真实效果"         │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 2.2 数据流对比

**当前**：editor 改 DSL → 算 diff → postMessage → runtime 改 DOM → 通知 editor

**目标**：editor 改 DSL → 算 diff → 直接更新 leafer scene（in-process，同步）

### 2.3 API 增减表

| API | 当前 | 目标 | 备注 |
|---|---|---|---|
| `editor.registerShape(type, fn)` | ❌ | ✅ 新增 | leafer shape 注册 |
| `editor.registerComponent(type, VueComponent)` | ❌ | ⚠️ 移到 runtime | runtime 还需要，editor 不需要 |
| `app.registerComponent(type, Component)` | ✅ | ✅ 保留 | runtime 用 |
| `Magic.updatePageId(id)` | ✅ | ❌ 删除 | 改为 `editorService.setActivePage(id)` |
| `Magic.add/update/remove/select` | ✅ | ❌ 删除 | 改为直接 mutate leafer scene |
| `Magic.updateRootConfig` | ✅ | ❌ 删除 | 改为 `editorService.setRoot(dsl)` → leafer 全量重画 |
| `StageRender.setZoom` | ✅ | ❌ 删除 | 改为 `leafer.scaleOfWorld(...)` |
| `StageMask.setLayout / observe` | ✅ | ❌ 删除 | leafer 自带选区 |
| `ScrollViewer` | ✅ | ❌ 删除 | leafer 自带 viewport |
| `editor.renderer: 'iframe' \| 'leafer'` | ❌ | ✅ 新增（P0 阶段） | 平行运行切换 |

---

## 3. 4 个关键改造点（详细）

### 改造 1：StageRender → LeaferRender

**当前**：`StageRender` 创建 iframe → runtime 加载到 iframe → editor 通过 `contentWindow.document` 访问 DOM

**新**：`LeaferRender` 创建 canvas DOM → 构造 `Leafer` 实例 → 监听 DSL 变化，diff leafer scene

```ts
// packages/stage/src/LearferRender.ts (新增)
import { Leafer, Rect, Text, Group, Frame, Image } from 'leafer-ui'
import type { MApp } from '@tmagic/schema'
import type { Render, Runtime, RenderEvents, UpdateData } from './types'

export default class LeaferRender extends EventEmitter implements Render {
  public leafer: Leafer | null = null
  // 维护 MNode.id → leafer UI 的映射，避免每次全量重画
  private nodeMap: Map<Id, IUI> = new Map()
  // 注册的 shape 函数
  private shapeRegistry: Map<string, ShapeFn> = new Map()
  // 业务方在 setRoot 时可以传 rootWidth/rootHeight 决定画布初始尺寸
  // 之后用户 pan/zoom

  constructor(config: { zoom?: number; renderer?: 'canvas' | 'webgl' } = {}) {
    super()
    this.zoom = config.zoom ?? DEFAULT_ZOOM
  }

  public registerShape(type: string, fn: ShapeFn) {
    this.shapeRegistry.set(type, fn)
  }

  public async setRoot(root: MApp) {
    if (!this.leafer) return
    // 全量 / 增量重画：先 diff 旧 scene，再 patch
    diffAndPatch(this.leafer, this.nodeMap, root, this.shapeRegistry)
  }

  public async mount(el: HTMLDivElement) {
    this.leafer = new Leafer({ view: el, fill: '#f5f5f5' })
    this.leafer.tree.add(Frame.one({ name: 'page-root', fill: '#fff' }))
  }

  public async update(data: UpdateData) { /* 单节点更新，diff 局部 */ }
  public async add(data: UpdateData) { /* 增量添加 */ }
  public async remove(data: RemoveData) { /* 增量删除 */ }
  public async select(ids: Id[]) { /* leafer 选区高亮 */ }

  // ... 其余接口跟 StageRender 对齐，保持 StageCore 调用方零改动
}
```

**关键点**：

- `setRoot` 不要每次全量 clear + 重建，会丢 zoom/pan 状态。要做 diff
- 业务方在 `app.registerComponent` 之外，新增一个 `editor.registerShape`。两个注册并行存在
- 老的 `StageRender` 不立即删，作为 P0 阶段 `renderer: 'iframe'` 路径

### 改造 2：MComponent → leafer 视觉映射

**核心问题**：tmagic 的 MComponent 走 Vue/React 渲染，leafer 走 canvas。需要一份"shape 描述"，把 MComponent 翻译成 leafer 节点。

**3 种方案**（推荐度从高到低）：

#### 方案 A：按 type 注册 shape（推荐）

```ts
// editor 提供
editor.registerShape('container', (config, ctx) => {
  const rect = new Rect({
    x: parsePx(config.style.left) ?? 0,
    y: parsePx(config.style.top) ?? 0,
    width: parsePx(config.style.width),
    height: parsePx(config.style.height),
    fill: config.style.backgroundColor ?? 'transparent',
    cornerRadius: parsePx(config.style.borderRadius) ?? 0,
    shadow: parseShadow(config.style.boxShadow),
  })
  rect.name = config.id
  // children 由递归生成
  return { node: rect, children: config.items ?? [] }
})

editor.registerShape('text', (config) => new Text({
  text: config.text ?? '',
  x: parsePx(config.style.left),
  y: parsePx(config.style.top),
  width: parsePx(config.style.width),
  height: parsePx(config.style.height),
  fill: config.style.color,
  fontSize: parsePx(config.style.fontSize) ?? 14,
  fontFamily: config.style.fontFamily ?? 'PingFang SC, sans-serif',
  fontWeight: config.style.fontWeight,
  textAlign: config.style.textAlign ?? 'left',
}))

editor.registerShape('image', (config) => new Image({
  url: config.url,
  x: parsePx(config.style.left),
  y: parsePx(config.style.top),
  width: parsePx(config.style.width),
  height: parsePx(config.style.height),
}))

editor.registerShape('button', (config) => {
  // 按钮是 group：底色矩形 + 文字
  const group = new Group()
  group.add(new Rect({
    width: parsePx(config.style.width),
    height: parsePx(config.style.height),
    fill: config.style.backgroundColor ?? '#409EFF',
    cornerRadius: parsePx(config.style.borderRadius) ?? 4,
  }))
  group.add(new Text({
    text: config.text ?? '',
    fill: config.style.color ?? '#fff',
    fontSize: parsePx(config.style.fontSize) ?? 14,
    textAlign: 'center',
    verticalAlign: 'middle',
  }))
  return { node: group, children: [] }
})

editor.registerShape('qrcode', (config) => {
  // QRCode 比较特殊：runtime 端用库生成 canvas
  // editor 端要么 fallback 到占位，要么提供一个 mock
  return new Rect({
    width: parsePx(config.style.width),
    height: parsePx(config.style.height),
    fill: '#f0f0f0',
  })
})
```

**优点**：跟现有 `app.registerComponent` 模式对称，业务方接入成本低
**缺点**：每个组件 type 都要写一份 shape

#### 方案 B：HTML overlay 兜底复杂组件

对于方案 A 画不好的复杂组件（图表、富文本），在 leafer 容器上叠加一个绝对定位的 HTML 元素：

```ts
function htmlOverlayShape(config, ctx) {
  // 1. leafer 画一个透明 Rect 占位（用于 hit / 选区）
  const placeholder = new Rect({
    x: ..., y: ..., width: ..., height: ...,
    fill: 'transparent', hitSelf: true,
  })
  // 2. editor 单独维护一个 HTML 元素 overlay
  const html = document.createElement('div')
  html.style.cssText = `position: absolute; left: ${x}px; top: ${y}px; ...`
  // html 内部用 Vue 组件渲染（不挂到 app，只读 props 渲染）
  // 3. shape 返回一个标记，让 editor 把 html 元素关联到 placeholder
  return { node: placeholder, overlay: { el: html, mount: (app) => app.mount(html) } }
}
```

**适用**：业务方自定义复杂组件，或者不想写 shape 时
**风险**：HTML overlay 跟 leafer 的 pan/zoom 同步要小心，editor 改动 zoom 时 overlay 位置/尺寸要同步

#### 方案 C：纯 style 推断

只用 `MComponent.style` 推 rect/text/image，不读 type。**不推荐**，丢失组件语义，复杂组件完全没法画

**推荐：方案 A 为主 + 方案 B 兜底**

### 改造 3：editor ↔ canvas 直连，删 Magic API

**当前**（跨边界）：

```ts
// editor 端
await stage.add({ config, parent, parentId, root })
// → postMessage → runtime 拿到
// → runtime 调 app.add(config)
// → runtime 改 DOM
// → 通知 editor "added"
```

**新**（in-process）：

```ts
// editor 端直接改 DSL + leafer scene
async add(data: UpdateData) {
  // 1. 改 DSL（immutable update）
  // 2. 局部更新 leafer scene
  const newNode = this.shapeRegistry.get(data.config.type)(data.config, this)
  this.nodeMap.set(data.config.id, newNode)
  this.leafer?.add(newNode)
  this.emit('add', data)
}
```

**要删的东西**：

- `packages/stage/src/types.ts:240-250` 的 `Magic` 接口里 `updatePageId / updateRootConfig / add / update / remove / select`
- `runtime/vue-runtime-help/src/hooks/use-editor-dsl.ts:66-90` 的 `window.magic?.onRuntimeReady` 整套（保留 runtime 那侧，editor 不再调）
- `runtime/react-runtime-help/src/hooks/use-editor-dsl.ts` 同上
- `packages/editor/src/services/editor.ts` 所有 `runtime?.updatePageId?.()` / `runtime?.select?.()` / `runtime?.update?.()` / `runtime?.add?.()` / `runtime?.remove?.()` 调用
- `runtimeUrl` / `customizedRender` / `renderType` props 降级为 `previewRuntimeUrl` / `previewRender` / `previewRenderType`

**保留 runtime 那侧**：runtime 仍可独立使用（业务方无 editor 场景，runtime 仍要工作）

### 改造 4：StageMask / ActionManager / StageDragResize / ScrollViewer 整包瘦身

| 当前 | 替代 |
|---|---|
| `packages/stage/src/StageMask.ts` (358 行) | 删。leafer 自带选区高亮（`leafer.selector` / `leafer-editor` 插件） |
| `packages/stage/src/StageDragResize.ts` + `StageMultiDragResize.ts` | 删。leafer 自带 `Editor` 插件：拖拽 / resize / rotate / multi-select |
| `packages/stage/src/ActionManager.ts` | 删。leafer 自带 pointer events + selection events |
| `packages/editor/src/components/ScrollViewer.vue` + `utils/scroll-viewer.ts` (167 行) | 删。leafer 自带 viewport pan/zoom（`leafer.move` / `scaleOfWorld`） |
| `packages/stage/src/Rule.ts` | 删。leafer 的 `Editor` 插件自带辅助线 |
| `packages/stage/src/StageFlashHighlight.ts` | 删。leafer `Editor` 自带 hover/flash 高亮 |

**保留的**：
- `packages/stage/src/StageCore.ts` — 保留，改成 `LeaferRender` 的包装
- `packages/stage/src/StageRender.ts` — **保留**（P0 阶段用），后期 `renderer: 'leafer'` 稳定后再删
- `packages/stage/src/MoveableOptionsManager.ts` + `MoveableActionsAble.ts` + `StageHighlight.ts` — 看是否还有用，没用就删

**总体收尾**：leafer 路径下，`packages/stage/src/` 从 16 个文件缩到 4-5 个。

---

## 4. 运行时怎么保留

runtime 完全不动，从"画布渲染源"降级为"预览源"：

**做法 1**（推荐）：编辑器右侧 / 底部加一个"预览" tab / drawer
- 默认折叠，只在用户点开时挂载 iframe
- 用户可以选 runtime 设备类型（mobile / tablet / pc）
- 同步当前编辑的 page（`editorService.state.page`）

**做法 2**：保留 `editor.renderer: 'iframe' \| 'leafer'` 切换开关（双 renderer 平行运行）
- P0 阶段用，业务方默认 `iframe`，手动切 `leafer` 试新
- P1-P2 稳定后改默认 `leafer`
- P3 删 `iframe` 路径

**Preview 面板的代码**：
```vue
<!-- packages/editor/src/layouts/preview/PreviewPanel.vue (新增) -->
<template>
  <div v-if="open" class="m-editor-preview">
    <iframe v-if="runtimeUrl" :src="runtimeUrl" :style="deviceStyle" />
    <component v-else-if="customizedRender" :is="customizedRender" />
  </div>
</template>
```

**保持不变**：
- `vue-components/` `react-components/` 完全保留
- `app.registerComponent` API 保留
- 用户的业务代码零改动

**变更 props**：
```ts
// 旧
{ runtimeUrl, render: customizedRender, renderType }
// 新（语义更清晰）
{ previewRuntimeUrl, previewRender, previewRenderType, renderer: 'iframe' | 'leafer' }
```

`renderer: 'iframe'` 走老逻辑（保留），`renderer: 'leafer'` 走新逻辑。

---

## 5. 跟多 page 无限画布调研的关系

之前那份调研（[multi-page-infinite-canvas.md](./multi-page-infinite-canvas.md)）里很多 Step 现在变成 leafer 自带：

| 之前调研的 Step | leafer 路径下的状态 |
|---|---|
| Step 1 数据模型 + store 增量 | **保留**（多 page 切换 active 仍需要） |
| Step 2 runtime 多 page 渲染 | **简化**：每个 MPage 是一个 leafer Frame，page 之间平铺 |
| Step 3 Page 实例生命周期 | **保留**（Node 树还是要建） |
| Step 4 StageMask / 选区 / 辅助线 | **直接删**（leafer 自带） |
| Step 5 ScrollViewer → CanvasViewer | **直接删**（leafer 自带 viewport） |
| Step 6 page bar 改 setActivePage | **简化**：leafer frame 加 `data-active` 边框即可 |
| Step 7 拖入 / 框选只对 active page 生效 | **保留**（逻辑层要做，leafer 只是渲染） |
| Step 8 缩略图 / page bar 增强 | **保留** |
| Step 9 page 间连接线（可选） | **保留**（leafer 可以画 SVG overlay） |

**结论**：用 leafer 之后，"多 page 无限画布"是顺手送的，不需要单独搞一套改造。两条路可以合并到一份调研 / 实施计划里。

---

## 6. 可行性验证：圆角 / 阴影 / 渐变 / 字体

> 业务方核心担忧：「leafer 画出来的视觉跟 Vue/React 组件的视觉对不上」。先验 4 个最常见的视觉特性。

### 6.1 结论

**4 项全部原生支持**，leafer-ui 的 API 跟 CSS 风格高度一致。

| 特性 | leafer-ui API | CSS 对应 | 来源 |
|---|---|---|---|
| 圆角 | `Rect({ cornerRadius: 8 })` 或 4 角独立 | `border-radius` | 官方对比表 + leafer-design 开源项目 |
| 外阴影 | `Rect({ shadow: { x, y, blur, color } })` | `box-shadow` | 官方对比表 |
| 内阴影 | `Rect({ innerShadow: {...} })` | `box-shadow: inset` | 官方对比表 |
| 多阴影 | `Rect({ shadows: [...] })` | 多个 `box-shadow` | 官方对比表 |
| 线性渐变 | `Rect({ fill: { type: 'linear', stops, angle } })` | `linear-gradient` | 官方对比表 + leafer-design |
| 径向渐变 | `Rect({ fill: { type: 'radial', stops } })` | `radial-gradient` | 官方对比表 |
| 锥形渐变 | `Rect({ fill: { type: 'conic', ... } })` | `conic-gradient` | 官方对比表 |
| 图片填充 | `Rect({ fill: { type: 'image', url } })` | `background-image` | 官方对比表 |
| 字体 | `Text({ fontFamily, fontSize, fontWeight, fontStyle, textAlign })` | `font-*` | leafer-x-tooltip-canvas 插件 config |
| 自定义字体 | CSS `@font-face` / `FontFace` API 加载 → `fontFamily: 'xxx'` 引用 | 浏览器原生 | 浏览器 canvas 2D 渲染走 `document.fonts` |
| 滤镜 | `Rect({ filter: 'blur(4px)' })` | CSS `filter` | 官方对比表 |
| 混合模式 | `Rect({ blendMode: 'multiply' })` | CSS `mix-blend-mode` | 官方对比表 |
| 多 fill 叠层 | `Rect({ fills: [...] })` | 多个 `background-image` | 官方对比表 |
| 描边 | `Rect({ stroke: { type: 'solid', color }, strokeWidth })` | `border` | 官方对比表 |
| zoom 无关 | `Rect({ fixedSize: true, fixedShadow: true })` | — | 官方对比表 |

### 6.2 端到端 minimal demo（10 行验证 4 个特性）

```ts
import { Leafer, Rect, Text } from 'leafer-ui'

// 用一个"按钮"验完 4 个特性：圆角 + 渐变 + 阴影 + 自定义字体
const leafer = new Leafer({ view: '#canvas', width: 400, height: 200 })

leafer.add(new Rect({
  x: 100, y: 70, width: 200, height: 60,
  // ✅ 1. 圆角
  cornerRadius: 30,
  // ✅ 2. 渐变（线性）
  fill: { type: 'linear', stops: [
    { offset: 0, color: '#32cd79' },
    { offset: 1, color: '#1e8b4f' },
  ]},
  // ✅ 3. 阴影
  shadow: { x: 0, y: 4, blur: 12, color: 'rgba(0,0,0,0.2)' },
}))

leafer.add(new Text({
  x: 200, y: 100,
  text: '立即购买',
  // ✅ 4. 自定义字体（系统字体走 fontFamily，中文 web 字体走 @font-face）
  fontFamily: 'PingFang SC, sans-serif',
  fontSize: 18,
  fontWeight: 'bold',
  fill: '#fff',
  textAlign: 'center',
}))
```

**预期结果**：在 `#canvas` div 上画一个带渐变 + 阴影 + 圆角的绿色按钮，中间是白色加粗"立即购买"文字。中文走系统 PingFang 字体。

### 6.3 注意点

1. **结构化对象 ≠ CSS 字符串**：leafer 不解析 CSS 字符串。`box-shadow: '0 2px 8px rgba(0,0,0,0.15)'` 不会直接生效，要转成 `{x:0, y:2, blur:8, color:'rgba(...)'}`。写个 20 行的 CSS-to-leafer 转换函数搞定。

2. **fill 跟 style 字段重名**：tmagic 的 `MComponent.style.backgroundColor`（CSS 风格）跟 leafer 的 `Rect.fill`（leafer 风格）需要映射：

   ```ts
   editor.registerShape('container', (config) => new Rect({
     x: parsePx(config.style.left) ?? 0,
     y: parsePx(config.style.top) ?? 0,
     width: parsePx(config.style.width),
     height: parsePx(config.style.height),
     fill: config.style.backgroundColor,           // 字段映射
     cornerRadius: parsePx(config.style.borderRadius),
     shadow: parseShadow(config.style.boxShadow),  // 字符串 → 对象
   }))
   ```

3. **中文字体加载**：用标准 CSS `@font-face` 或 JS `FontFace` API 加载后，leafer 的 `Text` 节点 `fontFamily` 字段直接引用即可：
   ```ts
   const font = new FontFace('MyFont', 'url(/fonts/my.woff2)')
   await font.load()
   document.fonts.add(font)
   // 之后 leafer Text 节点 fontFamily: 'MyFont' 直接生效
   ```

4. **运行时侧对照验证**：业务方担心 editor 跟 runtime 视觉对不上，提供：
   - 快捷键 `Cmd/Ctrl+P` 打开"运行时预览"面板
   - 每次 style 变更后 `leafer.export('png')` 一张图，跟 runtime iframe 截图做像素 diff（CI 阶段用）

### 6.4 已经在用 leafer 跑生产的设计器

`leafer-design`（https://github.com/leaferjs/leafer-design）是一个基于 leafer-ui 的开源海报设计器，功能列表直接覆盖我们的需求：

> ✅ 边框描边（纯色、线性渐变、径向渐变、图片）
> ✅ 填充（纯色、线性渐变、径向渐变、图片）
> ✅ 文本字体、粗细、大小
> ✅ 多页面支持
> ✅ 画布缩放、拖动模式

证明这套 API 已经在"接近 Figma 风格的设计器"上跑过生产。

---

## 7. 落地步骤

| 阶段 | 内容 | 估时 | 风险 |
|---|---|---|---|
| **P0 — 平行运行** | 保留 StageRender，新增 LeaferRender + `renderer: 'iframe' \| 'leafer'` prop；leafer 走通 container / text / image / button 4 个 built-in shape；leafer 走通 select / drag / pan / zoom | 3-4 周 | 中：leafer 交互手感要调 |
| **P1 — shape 注册 API** | 加 `editor.registerShape`，把 P0 的 4 个 built-in 改走注册表；为 `vue-components/*` 每个 type 加对应 shape（一个组件一个 shape） | 2-3 周 | 中：每个组件 shape 写起来 |
| **P2 — 高级交互** | snap / 辅助线 / 多选 / 框选 / moveable 用 leafer `Editor` 插件替代 | 2-3 周 | 高：交互细节调优 |
| **P3 — 多 page 无限画布** | 在 leafer 场景里挂 N 个 page frame，pan/zoom 全览；多 page 切换 active | 1-2 周 | 低（顺带的） |
| **P4 — 删老代码** | StageMask / ActionManager / StageDragResize / Magic API / iframe 通信全部删 | 2 周 | **高**：要保证零回归 |

**总估时 ~10-14 周**，1 个前端全职。

**里程碑**：

- **M1（P0 完成）**：业务方可以 `renderer: 'leafer'` 切到新画布，container/text/image/button 4 个 type 渲染对齐 Vue 组件
- **M2（P1 完成）**：所有内置 type 都有 shape，业务方的自定义 type 也可以通过 `registerShape` 接进来
- **M3（P2 完成）**：snap / 辅助线 / 多选 / 框选 / 缩放 / 旋转手感对齐 moveable
- **M4（P3 完成）**：多 page 同时渲染 + 无限画布 pan/zoom
- **M5（P4 完成）**：删 `renderer: 'iframe'` 路径，老 iframe / Magic API 全部清理

---

## 8. 关键文件改动清单

| 文件 | 改动类型 | 说明 |
|---|---|---|
| `packages/stage/src/LearferRender.ts` | 新增 | leafer 渲染器 |
| `packages/stage/src/LeaferShapeRegistry.ts` | 新增 | shape 注册中心 |
| `packages/stage/src/LeaferViewport.ts` | 新增 | pan/zoom 控制器（包一层 leafer.move/scaleOfWorld） |
| `packages/stage/src/LeaferSelection.ts` | 新增 | 选区事件桥（leafer selection → editorService.select） |
| `packages/stage/src/types.ts` | 加接口 | `Render` interface 跟 StageRender 对齐，editor service 调用方零改动 |
| `packages/stage/src/StageCore.ts` | 改 | 内部根据 `config.renderer` 选 StageRender / LeaferRender |
| `packages/stage/src/StageRender.ts` | 不变（P0 阶段） | 保留，leafer 稳定后删 |
| `packages/stage/src/StageMask.ts` | 暂保留 | leafer 路径下用不到，stageOverlay 还要 |
| `packages/stage/src/StageDragResize.ts` | 暂保留 | P4 删 |
| `packages/stage/src/ActionManager.ts` | 暂保留 | P4 删 |
| `packages/editor/src/utils/scroll-viewer.ts` | 暂保留 | P4 删 |
| `packages/editor/src/components/ScrollViewer.vue` | 暂保留 | P4 删 |
| `packages/editor/src/editorProps.ts` | 加 prop | `renderer: 'iframe' \| 'leafer'` |
| `packages/editor/src/services/editor.ts` | 改 | 所有 `runtime?.updatePageId?.()` 等调用删掉或改成 leafer 操作 |
| `packages/editor/src/layouts/workspace/viewer/Stage.vue` | 改 | watch(page) 改用 setActivePage + leafer 聚焦 |
| `packages/editor/src/layouts/workspace/viewer/LeaferStage.vue` | 新增 | leafer 专用 Stage 组件 |
| `packages/editor/src/layouts/preview/PreviewPanel.vue` | 新增 | runtime 预览面板（独立 tab / drawer） |
| `runtime/vue-runtime-help/src/hooks/use-editor-dsl.ts` | 保留 | runtime 那侧不变，editor 不再调它 |
| `runtime/react-runtime-help/src/hooks/use-editor-dsl.ts` | 保留 | 同上 |
| `runtime/vue-runtime-help/src/hooks/use-dsl.ts` | 不变 | runtime 端 |
| `runtime/react-runtime-help/src/hooks/use-dsl.ts` | 不变 | 同上 |
| `vue-components/*/src/*.vue` | 不变 | runtime 用，editor 不再直接调 |
| `react-components/*/src/*.tsx` | 不变 | 同上 |
| `docs/research/multi-page-infinite-canvas.md` | 加引用 | 注明"leafer 路径下大部分 Step 自动满足" |
| `playground/src/main.ts` | 加 demo | 演示 `renderer: 'leafer'` 用法 |

**总变更**：~10 个文件新增 / 大改，~5 个文件保留（P4 删），其余业务代码零改动。

---

## 9. 验证标准

完成 M1-M4 后要能验证：

### 功能性

- [ ] 业务方 `renderer: 'leafer'` 切到新画布，4 个内置 type 渲染对齐 Vue 组件（圆角/阴影/渐变/字体都对）
- [ ] 编辑画布拖入组件 → 落点准确（active page 内）
- [ ] 点击选中 → 选区高亮 + 右侧属性面板切换
- [ ] 拖拽改 position → 同步更新到 DSL（store）+ leafer scene
- [ ] 多 page 切换 → 画布滚到对应 page frame
- [ ] 多 page 同时渲染 → 切到 fit-to-all 看到所有 page
- [ ] pan/zoom 流畅（60fps 持续 1 分钟）
- [ ] 撤销 / 重做：editor 操作正常进历史栈
- [ ] Runtime 预览面板：打开后跟 Vue 组件实际渲染一致

### 性能

- [ ] 100 个 page + 1000 个组件，pan/zoom 稳定 60fps
- [ ] 编辑单个 style 改动 < 16ms 重新渲染
- [ ] 冷启动（leafer 初始化 + 全量绘制）< 500ms（不含 runtime 加载）

### 回归

- [ ] 业务方 `renderer: 'iframe'` 走老逻辑，零回归
- [ ] 旧 API 兼容：`editorService.select / update / add / remove` 调用方式不变
- [ ] 旧 props 兼容：`runtimeUrl / render: customizedRender / renderType` 仍能工作（preview 模式）

### 视觉对比

- [ ] 每个内置 type 出一张 leafer 渲染图 + Vue 渲染图，并排对比，肉眼差异 < 5%
- [ ] 中文字体（PingFang / 思源黑体 / 阿里普惠体）在 leafer 渲染下文字粗细 / 间距跟 Vue 一致

---

## 10. 开放问题（需要业务方拍板）

1. **editor 视觉 vs runtime 视觉的差异容忍度**：业务方能接受多大的"看起来不太一样"？纯靠 shape 函数画，会丢掉一些组件细节（自定义动画、复杂 hover 效果、富文本）
2. **复杂组件 fallback 策略**：图表 / 表单 / 富文本这类用户自定义组件，是走「HTML overlay」（所见即所得但实现复杂）还是「占位 + 跳转 runtime 预览」（简单但割裂）？建议先占位，预览兜底
3. **`editor.registerShape` 注册时机**：跟现在 `app.registerComponent` 一样，业务方接入时配两份注册表（一个 runtime 用、一个 editor 用），OK 吗？还是要让用户只写一份（leafer shape 从 Vue 组件自动推导）？后者技术难度大很多，建议先两份
4. **P0 阶段双 renderer 并行，业务方默认走哪个**：建议默认 `iframe`（保守），业务方显式开 `leafer` 试新；稳定后再换默认
5. **runtime 预览面板的 UI 形态**：右侧 drawer / 底部抽屉 / 全屏切换 tab？影响业务方使用习惯
6. **中文字体加载策略**：业务方当前用什么字体（系统 / 阿里普惠 / 自有 webfont）？leafer 走浏览器 canvas 2D 渲染，需要确保字体已加载（用 `document.fonts.ready`）
7. **leafer 的商业插件 PxGrow**：leafer-ui 开源，PxGrow 是商业插件（高级编辑器套件 / 性能优化）。我们需要用吗？目前看开源能力够，不建议
8. **删除 `iframe` 路径的时机**：P4 删，但风险高。建议先在内部 / 灰度业务方跑稳 1-2 个 minor 版本再删

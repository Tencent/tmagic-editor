# leafer 渲染改造 — 完整任务清单

> 把 editor 端从 iframe + StageMask 改成 leafer-ui 直渲染。runtime 完全不动。
> 关联调研：[multi-page-infinite-canvas.md](./multi-page-infinite-canvas.md) / [leafer-renderer-migration.md](./leafer-renderer-migration.md)
> 负责人：roymondchen | 协作：Mavis | 启动：2026-07-31

---

## 0. 总览

**核心包**：`leafer-components/`（新增，跟 `vue-components/` `react-components/` 并列同级，仅 editor 用）

**核心 API 改动**：
- editor 端：删 Magic API 跨边界调用，新增 `editor.registerShape(type, shapeFn)`
- runtime 端：**零改动**
- 业务方接入：1 个新组件 = 3 份实现（vue-component + react-component + leafer-component）

**总工作量**：7 个里程碑（M0-M6），~14 周（1 个前端全职），~50 个原子任务

**总文件变更**：~20 个新增/大改，~5 个删除

---

## 1. 里程碑时间线

| 里程碑 | 主题 | 周 | 关键交付 |
|---|---|---|---|
| **M0** | Foundation | 0.5 | shape builder utils + leafer-components 包骨架 + editor `registerShape` API |
| **M1** | Built-in shapes | 0.5 | 10 个内置 type 全部可渲染（5 完整 + 5 占位） |
| **M2** | LeaferRender core | 2-3 | LeaferRender 类 + DSL diff + StageCore 路由 + editor service 接入 |
| **M3** | Editor 整合 | 2-3 | renderer 切换可用 + Magic API 删 + renderer prop 增量 + playground 跑通 |
| **M4** | 高级交互 | 2-3 | leafer Editor 替代 moveable + 选区/多选/辅助线/历史栈 |
| **M5** | 多 page 无限画布 | 1-2 | 多 page frame 挂载 + active 切换 + fit-to-all |
| **M6** | 删老代码 | 1-2 | StageMask/ActionManager/StageDragResize/ScrollViewer/Magic API 全删 |

---

## 2. M0 — Foundation

### T0.1 shape builder utils

**文件**：`leafer-components/src/utils.ts`（新增）

**内容**：

- `export type ShapeFn = (config: MComponent, ctx: ShapeContext) => IUI | { node: IUI; children?: MNode[] } | null`
- `export const parsePx: (v: any) => number | undefined`
- `export const parseShadow: (cssBoxShadow?: string) => LeaferShadow | undefined`
- `export const parseGradient: (cssGradient: string) => LeaferGradient | undefined`
- `export const parseFontFamily: (v?: string) => string | undefined`
- `export const buildRectShape: (config: MComponent) => Rect`（占位用）
- `export const buildTextShape: (config: MComponent & { text?: string }) => Text`（占位用）

**关键设计**：
- `parseShadow` 处理 `0 2px 8px rgba(0,0,0,0.15)` / `inset` / 多阴影三种 case
- `parseGradient` 支持 `linear-gradient` / `radial-gradient` / `conic-gradient` 字符串
- 所有工具函数纯函数，便于单测

**验收**：
- [ ] `leafer-components/src/utils.ts` 存在
- [ ] `pnpm test leafer-components` 5 个 parse 函数单测全过
- [ ] 覆盖率 ≥ 85%（项目约定）

### T0.2 leafer-components 包骨架

**文件**：`leafer-components/package.json`（新增）

**内容**：

```json
{
  "name": "@leafer-components",
  "version": "0.0.1",
  "type": "module",
  "main": "src/index.ts",
  "peerDependencies": {
    "leafer-ui": "^2.0.0",
    "@tmagic/schema": "*",
    "@tmagic/stage": "*"
  },
  "devDependencies": {
    "leafer-ui": "*",
    "@tmagic/schema": "*",
    "@tmagic/stage": "*"
  }
}
```

**关联**：`pnpm-workspace.yaml` 添加 `leafer-components` 路径

**验收**：
- [ ] `leafer-components/package.json` 存在
- [ ] `pnpm install` 不报错
- [ ] 业务方可 `import buttonShape from '@leafer-components/button'`

### T0.3 editor `registerShape` API

**文件**：`packages/stage/src/LeaferShapeRegistry.ts`（新增）

**内容**：

```ts
import type { ShapeFn } from '@leafer-components/utils'  // 跟 leafer-components 共用 type

export class LeaferShapeRegistry {
  private shapes: Map<string, ShapeFn> = new Map()
  register(type: string, shape: ShapeFn) { this.shapes.set(type, shape) }
  get(type: string): ShapeFn | undefined { return this.shapes.get(type) }
  has(type: string): boolean { return this.shapes.has(type) }
  list(): string[] { return Array.from(this.shapes.keys()) }
}
```

**文件**：`packages/stage/src/index.ts`（导出）

**验收**：
- [ ] `LeaferShapeRegistry` 类可注册 / 查 / 列
- [ ] 导出在 `@tmagic/stage` 主入口
- [ ] 单测覆盖 register/get/has/list

---

## 3. M1 — Built-in shapes

### T1.1 `text` shape

**文件**：`leafer-components/text/src/index.ts`（新增）

**内容**：

```ts
import { Text } from 'leafer-ui'
import { parsePx, type ShapeFn } from '../../utils'

const shape: ShapeFn = (config) => {
  const c = config as MComponent & { text?: string }
  return new Text({
    text: c.text ?? '',
    x: parsePx(c.style?.left) ?? 0,
    y: parsePx(c.style?.top) ?? 0,
    width: parsePx(c.style?.width),
    height: parsePx(c.style?.height),
    fill: c.style?.color,
    fontSize: parsePx(c.style?.fontSize) ?? 14,
    fontFamily: c.style?.fontFamily,
    fontWeight: c.style?.fontWeight,
    textAlign: c.style?.textAlign ?? 'left',
  })
}

export default shape
```

**验收**：playground 加一个 `text` 节点，画布显示文字

### T1.2 `button` shape

**文件**：`leafer-components/button/src/index.ts`（新增）

**内容**：Group[Rect + Text]，15 行（见调研文档 §3 改造 2 完整示例）

**验收**：playground 加一个 `button` 节点，画布显示带底色 + 文字的圆角矩形

### T1.3 `img` shape

**文件**：`leafer-components/img/src/index.ts`（新增）

**内容**：leafer `Image` 节点 + `url: config.url`

**验收**：playground 加一个 `img` 节点，画布显示图片

### T1.4 `container` shape

**文件**：`leafer-components/container/src/index.ts`（新增）

**内容**：leafer `Frame` 节点 + children 递归（ctx.children = config.items）

**验收**：嵌套 container 渲染正确

### T1.5 `overlay` shape

**文件**：`leafer-components/overlay/src/index.ts`（新增）

**内容**：跟 container 几乎一致（都是 Group 容器），可后续区分

**验收**：overlay 容器渲染正确

### T1.6 `page` shape

**文件**：`leafer-components/page/src/index.ts`（新增）

**内容**：leafer `Frame` 节点 + 全屏 `width/height` + children

**验收**：page 根容器渲染正确

### T1.7 `qrcode` placeholder

**文件**：`leafer-components/qrcode/src/index.ts`（新增）

**内容**：buildRectShape 占位，注释说明「runtime 用 qrcode 库，editor 暂时占位」

**验收**：qrcode 节点渲染为浅灰矩形

### T1.8 `page-fragment-container` placeholder

**文件**：`leafer-components/page-fragment-container/src/index.ts`（新增）

**内容**：buildRectShape 占位，注释说明「跟跨页引用有关，业务方可在 runtime 预览看真实效果」

### T1.9 `iterator-container` placeholder

**文件**：`leafer-components/iterator-container/src/index.ts`（新增）

**内容**：buildRectShape 占位

### T1.10 `page-fragment` placeholder

**文件**：`leafer-components/page-fragment/src/index.ts`（新增）

**内容**：buildRectShape 占位

### T1.11 统一入口

**文件**：`leafer-components/src/index.ts`（新增）

**内容**：

```ts
// AUTO-GENERATED-style: 手动维护,新增 type 时记得加一行
export { default as button } from '../button/src'
export { default as text } from '../text/src'
// ... 10 行
```

**验收**：`import * as shapes from '@leafer-components'` 拿到 10 个 shape

---

## 4. M2 — LeaferRender core

### T2.1 Render interface 抽象

**文件**：`packages/stage/src/types.ts`（改）

**内容**：从 StageRender 抽 `Render` interface：

```ts
export interface Render {
  mount(el: HTMLDivElement): Promise<void>
  setRoot(root: MApp, pageId?: Id): Promise<void>
  update(data: UpdateData): Promise<void>
  add(data: UpdateData): Promise<void>
  remove(data: RemoveData): Promise<void>
  select(ids: Id[]): Promise<void>
  setZoom(zoom: number): void
  destroy(): void
  on<E extends keyof RenderEvents>(event: E, listener: (...args: any[]) => void): this
  emit<E extends keyof RenderEvents>(event: E, ...args: any[]): boolean
}
```

**验收**：StageRender / LeaferRender 都实现这个 interface

### T2.2 LeaferRender 类

**文件**：`packages/stage/src/LeaferRender.ts`（新增，~250 行）

**内容**：
- 构造时 `new Leafer({ view, fill: '#f5f5f5' })`
- `mount` 创建 leafer 实例 + page frame 根 group
- `setRoot` 全量 diff（先清空再重建，**P0 阶段**够用，P1 优化增量 diff）
- `update` / `add` / `remove` 单节点 patch
- `select` 设置 leafer 节点的 `selected` 状态
- `setZoom` 调 `leafer.scaleOfWorld(origin, factor)`
- 内部维护 `nodeMap: Map<Id, IUI>` 用于反查
- 集成 `@leafer-components/*` 调对应 shape 函数

**关键设计**：
- 全量 `setRoot` 用 `leafer.tree.destroy()` 清空 → 重建（**P0 阶段**接受）
- 增量 `update` / `add` / `remove` 用 `nodeMap` 反查，再走 `leafer.add/remove`
- 抛错用 `leafer.sky` 层的 toast（M2 阶段先 console.error）

**验收**：
- [ ] LeaferRender 类实现 Render interface
- [ ] `mount` 成功创建 canvas
- [ ] `setRoot` 渲染 8 个内置 type
- [ ] `add` / `update` / `remove` 局部更新正常

### T2.3 DSL diff 算法

**文件**：`packages/stage/src/LeaferRender.ts` 内部 `diffAndPatch` 函数

**内容**：
- 比对 `oldMap: Map<Id, IUI>` 和 `newMap: Map<Id, IUI>`（按 DSL 全量构建）
- 找出 add / update / remove 三类 diff
- 按需调 leafer 的 add/remove/setAttrs

**P0 阶段**简化：只做 full setRoot，diff 留到 P1

**验收**：
- [ ] T2.2 的 setRoot 调用清晰
- [ ] 二次 setRoot 不抖动（leafer scene 复用）

### T2.4 StageCore 路由

**文件**：`packages/stage/src/StageCore.ts`（改）

**内容**：
- 构造时根据 `config.renderer === 'leafer'` 选 LeaferRender
- 老的 `config.runtimeUrl / config.render` 路径走 StageRender
- 内部统一调 `this.renderer.xxx()`，对调用方透明

**验收**：
- [ ] `renderer: 'iframe'` 走 StageRender（老逻辑）
- [ ] `renderer: 'leafer'` 走 LeaferRender（新逻辑）
- [ ] 切换不报错，事件正常 emit

### T2.5 editor service 接入

**文件**：`packages/editor/src/services/editor.ts`（改）

**内容**：
- 删所有 `this.get('stage')?.renderer?.runtime?.getApp?.()?.page?.emit('editor:select', ...)` 调用（line 313-325）
- 删所有 `runtime?.updatePageId?.(page.id)` 调用（line 243, 378, 419）
- 删所有 `stage?.add/update/remove` 通过 runtime 的链路，改为直接 `stage.add/update/remove`（走 Render interface）
- 自动 import leafer-components 全部 shape，在 initService 时 register

**验收**：
- [ ] `grep -r "runtime?\." packages/editor/src` 结果为 0
- [ ] 拖入组件在 leafer 画布上立即出现（无延迟）
- [ ] 选区高亮正常

### T2.6 editor service 启动时注册 shape

**文件**：`packages/editor/src/initService.ts`（改）

**内容**：

```ts
import * as leaferComponents from '@leafer-components'

// 在 initServiceState 之后:
for (const [type, shape] of Object.entries(leaferComponents)) {
  stageRenderer.registerShape(type, shape)
}
```

**验收**：
- [ ] editor 启动时自动注册 10 个 shape
- [ ] 业务方零感知

---

## 5. M3 — Editor 整合

### T3.1 renderer 切换可用

> **修订**：原计划"新增 PreviewPanel.vue"——错的。主画布的 `MagicStage`（`packages/editor/src/layouts/workspace/viewer/Stage.vue:6`）就是 runtime iframe 本身，已经承载了"runtime 预览"职责。切到 leafer 路径后，业务方想看 Vue/React runtime 渲染，**直接 `renderer: 'iframe'` 切回去**就行，不需要新增组件。
> 
> 真正要做的是确保 renderer 切换工作正常：
> - 业务方能切 `renderer: 'iframe'` 看到 Vue/React runtime（走老的 StageRender）
> - 业务方能切 `renderer: 'leafer'` 看到 leafer 渲染
> - 切换不重载整页，只重挂载 stage
> - 默认 renderer 改成 `'leafer'`，旧业务方切到 `'iframe'` 立即可用
> 
> 如果以后要加 side-by-side 分屏预览，那是 v2 增强，不在 M3 必做范围。

**文件**：
- `packages/stage/src/StageCore.ts`（确保 `config.renderer` 路由正确）
- `packages/editor/src/services/editor.ts`（确保 `stage` 切换时正确重建）

**验收**：
- [ ] `renderer: 'iframe'` 走 StageRender，主画布显示 Vue/React 组件
- [ ] `renderer: 'leafer'` 走 LeaferRender，主画布显示 leafer 渲染
- [ ] 切换不报错，editor 状态保留（DSL / 选区 / 历史栈不丢）

### T3.2 删 Magic API editor 端调用

**文件**：
- `packages/editor/src/services/editor.ts`（删 line 313-325 等 `runtime?.`）
- `packages/editor/src/initService.ts`（删 `runtime?.updatePageId?.()`）

**验收**：
- [ ] `grep "runtime?." packages/editor/src/` 结果为 0
- [ ] runtime 那侧 `use-editor-dsl.ts` **保留不动**

### T3.3 editor props 增量（不改名）

> **修订**：原计划"把 `runtimeUrl / render / renderType` 改成 `preview*`"——错的。`runtimeUrl` 这个 prop 描述的是"runtime 入口 URL"，跟 runtime 是主画布还是预览无关。改名是 breaking change，徒增迁移成本。`renderer: 'iframe' | 'leafer'` 这个新 prop 才真正描述了主画布渲染源的新行为。`runtimeUrl / render / renderType` 三个 prop **不动**。

**文件**：`packages/editor/src/editorProps.ts`（改）

**内容**：
- 保留 `runtimeUrl / render / renderType` 三个 prop 不动
- 新增 `renderer: 'iframe' | 'leafer'`，默认 `'leafer'`
- `StageCore` 根据 `config.renderer` 选 StageRender / LeaferRender

**验收**：
- [ ] 旧 props 全部不改动
- [ ] 业务方接入零迁移成本
- [ ] `renderer` 默认 `'leafer'`，业务方显式 `'iframe'` 走老逻辑

### T3.4 playground 验证

**文件**：`playground/src/main.ts`（改）

**内容**：

```ts
import * as leaferComponents from '@leafer-components'

// 启动 editor 后,立即注册 leafer shape
for (const [type, shape] of Object.entries(leaferComponents)) {
  editor.registerShape(type, shape)
}
```

**验收**：
- [ ] playground 启动后画布显示 8 个内置 type
- [ ] 拖入 component list 里的组件，画布上能落点
- [ ] `renderer: 'iframe' \| 'leafer'` 切换工作正常

---

## 6. M4 — 高级交互

### T4.1 leafer Editor 插件接入

**文件**：`packages/stage/src/LeaferRender.ts`（改）

**内容**：
- 启用 leafer `Editor` 插件（替代 moveable）
- 监听 `drag` / `resize` / `rotate` 事件
- 抛到 editor service 更新 DSL

**关键设计**：leafer 事件坐标 → 算 delta → 改 `config.style.top/left/width/height` → 走 editor service.update

**验收**：
- [ ] 拖动节点位置变化
- [ ] 拖角改尺寸
- [ ] 改 style 进历史栈

### T4.2 选区 / 多选

**文件**：`packages/stage/src/LeaferRender.ts`（改）

**内容**：
- leafer selection events → editorService.select(id) / multiSelect(ids)
- 框选（leafer 内置）→ 同上
- 反向：editorService.select(id) → leafer selector 同步

**验收**：
- [ ] 单选 / 多选 / 框选正常
- [ ] editorService.select 反向同步到画布

### T4.3 辅助线 / snap

**文件**：`packages/stage/src/LeaferRender.ts`（改）

**内容**：
- leafer `Editor.snap = true` + `Editor.guide = true`
- 自定义 snap 规则（只对齐 active page 内节点）

**验收**：
- [ ] 拖动有辅助线
- [ ] snap 阈值 4px

### T4.4 撤销 / 重做

**文件**：`packages/editor/src/services/editor.ts`（改）

**内容**：
- leafer drag 结束后调 `editorService.update()`，自动进 history 栈（现有机制）
- 撤销 / 重做时反向更新 leafer scene

**验收**：
- [ ] 改 style 后 Ctrl+Z 撤销
- [ ] 撤销后画布同步

---

## 7. M5 — 多 page 无限画布

### T5.1 多 page frame 挂载

**文件**：`packages/stage/src/LeaferRender.ts`（改）

**内容**：
- `setRoot(magicApp)` 遍历 `magicApp.items`，每个 MPage 一个 leafer `Frame`
- Frame 按 grid 平铺（默认间距 100px）
- 一次性挂载所有 page，pan/zoom 全览

**验收**：
- [ ] 同时看到 N 个 page
- [ ] 缩到 fit-to-all 能看到所有 page

### T5.2 active page 切换

**文件**：`packages/editor/src/services/editor.ts`（改）

**内容**：
- 新增 `setActivePage(id)` action
- 改对应 leafer frame 的 `data-active="true|false"`，leafer 端加边框视觉
- 不再销毁 / 重建 Page 实例（App.allPages 缓存）

**验收**：
- [ ] 切换 active 立即有视觉反馈
- [ ] Page 实例不重建

### T5.3 page bar 改跳转

**文件**：`packages/editor/src/layouts/page-bar/PageBar.vue`（改）

**内容**：
- `switchPage(id)` 调 `editorService.setActivePage(id)` + `leafer.focusToPage(id)`
- 平移动画过渡

**验收**：
- [ ] 点击 page tab 平移到对应 page
- [ ] 切换不进历史栈

### T5.4 fit-to-all 快捷键

**文件**：`packages/stage/src/LeaferRender.ts`（改）

**内容**：
- 监听 Shift+1 触发 fit-to-all
- 监听 Z（或 F）触发 fit-to-active
- 监听 0 触发 100% 缩放

**验收**：
- [ ] 三个快捷键工作
- [ ] 平滑过渡动画

---

## 8. M6 — 删老代码

### T6.1 删 StageMask

**文件**：删除 `packages/stage/src/StageMask.ts`

**验收**：
- [ ] TS 编译通过
- [ ] `grep "StageMask" packages/` 结果只在 types.ts 注释里

### T6.2 删 StageDragResize / StageMultiDragResize

**文件**：删除 `packages/stage/src/StageDragResize.ts` `StageMultiDragResize.ts`

**验收**：TS 编译通过

### T6.3 删 ActionManager

**文件**：删除 `packages/stage/src/ActionManager.ts`

**验收**：TS 编译通过

### T6.4 删 ScrollViewer

**文件**：删除
- `packages/editor/src/components/ScrollViewer.vue`
- `packages/editor/src/utils/scroll-viewer.ts`

**验收**：TS 编译通过

### T6.5 删 Moveable 集成

**文件**：
- `packages/stage/src/MoveableOptionsManager.ts`
- `packages/stage/src/MoveableActionsAble.ts`

**验收**：`grep -r "moveable" packages/stage/src/` 移除

### T6.6 删 StageRender 路径

**文件**：
- `packages/stage/src/StageRender.ts` 标记 deprecated，P6 阶段删
- editor `renderer: 'iframe'` 路径删

**前置条件**：
- M0-M5 全部完成
- 业务方跑稳 1-2 个 minor 版本
- 灰度 100% 业务方无回滚

**验收**：
- [ ] StageRender.ts 删除
- [ ] editorProps `renderer` prop 简化为只剩 `'leafer'`

### T6.7 删 Magic API（runtime 端清理）

**文件**：
- `runtime/vue-runtime-help/src/hooks/use-editor-dsl.ts`（保留 runtime 那侧，editor 那侧已删）
- `runtime/react-runtime-help/src/hooks/use-editor-dsl.ts`（同上）

**说明**：runtime 那侧的 Magic API 仍保留，因为 runtime 可能被独立使用（不是 editor 上下文）

**验收**：
- [ ] editor 端无 `magic?.onRuntimeReady` 调用
- [ ] runtime 端 Magic API 仍 work

---

## 9. 风险清单

| # | 风险 | 触发阶段 | 缓解 |
|---|---|---|---|
| 1 | leafer 选区/拖拽手感跟 moveable 差异 | M4 | 重点打磨 + 灰度对比 |
| 2 | 中文字体加载时机 | M0 | `document.fonts.ready` + `FontFace` API 提前加载 |
| 3 | 业务方自定义 type 接入 | M1-M2 | 提供文档 + 示例 + 单元测试 |
| 4 | DSL 频繁改动 leafer scene 性能 | M2 | 增量 diff + RAF 节流 |
| 5 | 删 StageRender 时业务方有意外回滚 | M6 | 长灰度 + 强监控 + 快速回滚开关 |
| 6 | page bar 切换不再是切 DOM 的 UX 差异 | M5 | 视觉对比 + 业务方验证 |

---

## 10. 关键文件路径索引

### 新增

- `leafer-components/package.json`
- `leafer-components/src/index.ts` + `utils.ts`
- `leafer-components/<type>/src/index.ts`（10 个 type × 1 文件）
- `packages/stage/src/LeaferRender.ts`
- `packages/stage/src/LeaferShapeRegistry.ts`

### 改

- `packages/stage/src/StageCore.ts`（双 renderer 路由）
- `packages/stage/src/types.ts`（Render interface）
- `packages/stage/src/index.ts`（导出新增）
- `packages/editor/src/services/editor.ts`（删 Magic API + 自动注册 shape）
- `packages/editor/src/initService.ts`（自动注册 shape）
- `packages/editor/src/editorProps.ts`（props 改名 + 新增 renderer）
- `packages/editor/src/layouts/page-bar/PageBar.vue`（page 切换改 setActivePage）
- `playground/src/main.ts`（注册 shape）

### 删（M6 阶段）

- `packages/stage/src/StageMask.ts`
- `packages/stage/src/StageDragResize.ts`
- `packages/stage/src/StageMultiDragResize.ts`
- `packages/stage/src/ActionManager.ts`
- `packages/stage/src/MoveableOptionsManager.ts`
- `packages/stage/src/MoveableActionsAble.ts`
- `packages/stage/src/StageRender.ts`（P6 阶段删）
- `packages/editor/src/components/ScrollViewer.vue`
- `packages/editor/src/utils/scroll-viewer.ts`

### 不动

- `runtime/vue-runtime-help/`
- `runtime/react-runtime-help/`
- `vue-components/`（业务方按需加）
- `react-components/`（业务方按需加）
- `playground/src/pages/`, `playground/src/configs/`（业务方代码零改动）

---

## 11. 整体验证标准

### M0 完成

- [ ] `pnpm test leafer-components` 全过
- [ ] `registerShape('button', ...)` 在 editor service 里能调

### M1 完成

- [ ] playground 跑起来，10 个内置 type 在画布上都有视觉
- [ ] 每个 type 的 `.shape.ts` 文件 ≤ 30 行

### M2 完成

- [ ] 拖入 component list 里的组件，leafer 画布立即出现
- [ ] 选区高亮正常
- [ ] 单测覆盖 ≥ 85%

### M3 完成

- [ ] `renderer: 'iframe' | 'leafer'` 切换可用，业务方零迁移成本
- [ ] editor 端无 `runtime?.` 调用（`grep` 验证）
- [ ] `runtimeUrl / render / renderType` 三个 prop 保持不变（不破现有业务方接入）

### M4 完成

- [ ] 拖拽 / 改尺寸 / 旋转 流畅
- [ ] 多选 / 框选 / 辅助线 / snap 正常
- [ ] 撤销 / 重做 正常

### M5 完成

- [ ] 同时渲染 N 个 page
- [ ] fit-to-all 看到所有
- [ ] fit-to-active 居中
- [ ] 切换 active 立即视觉反馈

### M6 完成

- [ ] StageMask / ActionManager / StageDragResize / ScrollViewer / StageRender 全部删除
- [ ] `renderer: 'leafer'` 唯一路径
- [ ] TS 编译通过
- [ ] 业务方跑 1-2 个 minor 版本无回滚

---

## 12. 关键决策回顾

- **leafer-components 仅 editor 用**（不是 runtime 替代品）
- **runtime 完全不动**（vue-components / react-components 保持原样）
- **shape 是手写**（不搞 codegen，每个 type 一个文件 5-30 行）
- **Magic API 删 editor 端调用，runtime 端保留**（runtime 可能被独立用）
- **P0-P5 双 renderer 平行运行**（`renderer: 'iframe' | 'leafer'` 切换），P6 删 `iframe` 路径
- **Page 实例不销毁**（App.allPages LRU 缓存，多 page 无限画布顺手做）
- **改造前先查现状**（见 §12.1）

### 12.1 改造前先查现状（反思记录）

调研时两次连续犯错，列下来提醒后续：

1. **T3.1 提"新增 PreviewPanel.vue"**：实际 `MagicStage`（`packages/editor/src/layouts/workspace/viewer/Stage.vue:6`）就是主画布 iframe 本身，runtime 预览职责它已经承担了。切到 leafer 后，业务方用 `renderer: 'iframe'` 切回去就能看 runtime，根本不需要新组件。
2. **T3.3 提"runtimeUrl → previewRuntimeUrl"**：`runtimeUrl` 这个 prop 名字规范且描述准确（"runtime 入口 URL"），跟 runtime 是主画布还是预览无关。改名是 breaking change 且徒增迁移成本。真正要加的是 `renderer: 'iframe' \| 'leafer'` 这个新 prop。

**教训**：做改造类任务前，**先 `grep` 关键概念**（已有组件 / prop / service / 类型），列出"现有机制"再提"新增/重命名"。

- 接到改造任务，第一动作应该是 `grep` + 列出现状，不是 `write` + 提方案
- 优先"加开关"（`renderer: 'a' | 'b'`、`useXxx()`），少做"换名字"
- 反思时如果发现自己两次都倾向"加法"（新增/重命名），停下来问自己"是不是没看现状"

---

## 13. 进度追踪

每个任务的 `Status: pending | in_progress | completed` 由执行者维护。

| 任务 | 状态 | 负责人 | 完成时间 |
|---|---|---|---|
| T0.1 shape builder utils | pending | | |
| T0.2 leafer-components 包骨架 | pending | | |
| T0.3 editor `registerShape` API | pending | | |
| T1.1 text shape | pending | | |
| T1.2 button shape | pending | | |
| ... | | | |
| T6.7 删 Magic API | pending | | |

（详细 50 个任务的表格在 issue tracker 里维护，doc 这份只列里程碑进度）

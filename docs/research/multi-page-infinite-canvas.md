# 调研：多页面同时渲染的无限画布

> 目标：底层继续使用 tmagic-editor，把「单页编辑器」改成「多页面同时渲染 + 无限画布」模式。
> 类比：Figma 的「一个 file 里多个 frame」概念，但粒度提到 MPage（业务页面）这一层；tldraw 的「多 page」借鉴其概念模型，不借鉴其切换式 UI。

> **更新（2026-07-31）**：如果走 leafer-ui 替换 iframe + StageMask 方案，本调研里的 **Step 4（StageMask 适配）/ Step 5（ScrollViewer → CanvasViewer）/ Step 6（page bar 改 setActivePage 的画布部分）大量简化或自动满足**。详细对比见 [leafer-renderer-migration.md §5](./leafer-renderer-migration.md#5-跟多-page-无限画布调研的关系)。建议两条路合并为一份实施计划。

---

## 0. 一句话总结

**关键改造点 = 4 个**：

1. **Runtime 渲染**：从「渲染单 pageConfig」改为「渲染所有 pageConfig，每个 page 包在一个 frame 容器里」，并把当前选中 page 提升为「active / 不可 active 两种状态」。
2. **画布坐标空间**：从「以当前 page 尺寸为基准」改为「以无限画布为基准 + 每个 page 在画布上有自己的 anchor 坐标」，StageMask / 辅助线 / 选区都要支持跨 page 上下文。
3. **编辑器 store**：保留 `state.page`（当前编辑页），但新增 `state.canvasLayout`（pageId → `{x, y, width, height}`），让 page bar 不再是「切换渲染」，而是「聚焦 / 滚动到 anchor」。
4. **交互细节**：拖入组件只对 active page 生效；多选框选只命中 active page；page bar 点击改为「跳转 + 聚焦」而非「销毁 + 重建 Page 实例」。

**核心风险 = 2 个**：

- tmagic 的 `App.page` / `Page` 实例是「单例 + 切换即销毁重建」，要保留这个能力（避免 N 个 page 同时存活导致性能崩），但同时让 runtime 视觉上渲染 N 个 page 的内容 → 需要把「Page 实例生命周期」和「Page 视觉渲染」解耦。
- 辅助线 / Magic 选区 / 蒙层都依赖 `mask.page` 这个单例 DOM 引用。改成多 page 后要解决「现在选中的 page 是谁」这个事实切换。

---

## 1. 现状盘点（基于代码）

### 1.1 数据模型

| 概念 | 现状 | 文件 |
| --- | --- | --- |
| App 根 | `MApp`（`type: 'app'`）含 `items: (MPage \| MPageFragment)[]` | `packages/schema/src/index.ts:198-211` |
| Page | `MPage extends MContainer`（`type: 'page'`），DSL 里有 items[] | `packages/schema/src/index.ts:184-188` |
| Page 实例（运行时） | `class Page extends Node`，持有 `nodes: Map<Id, Node>`，按 `MContainer` 子树构建 | `packages/core/src/Page.ts:33-145` |
| App 实例（运行时） | `class App`，**只持有 `this.page: Page \| undefined`**，是「单当前页」语义 | `packages/core/src/App.ts:35-334`，关键方法 `setPage(id)` `:180-203` |
| Page 切换 | `App.setPage(id)`：销毁旧 Page 实例 → 新建 → 触发 `page-change` 事件 | `packages/core/src/App.ts:180-203` |

### 1.2 渲染管线

| 层级 | 现状 | 文件 |
| --- | --- | --- |
| Editor store | `state.page` 是当前编辑页（store 里也是单例） | `packages/editor/src/services/editor.ts:101-116` |
| Page bar | 横向 tab 列表，点击 → `editorService.select(id)` 切换 store.page | `packages/editor/src/layouts/page-bar/PageBar.vue:132-134` |
| Runtime 入口 | 单一 `<MagicUiPage config={pageConfig} />` | `runtime/react/page/App.tsx:31`、`runtime/vue/page/App.vue:2` |
| useDsl | 监听 `app.page-change` 事件，**返回单 pageConfig** | `runtime/vue-runtime-help/src/hooks/use-dsl.ts:25-34` |
| useEditorDsl | 编辑器端桥接，`updatePageId(id)` 调 `app.setPage(id)`，单 page 切换 | `runtime/vue-runtime-help/src/hooks/use-editor-dsl.ts:73-89` |
| StageRender | 单一 iframe / native container 渲染 runtime | `packages/stage/src/StageRender.ts:248-275` |
| StageMask | `public page: HTMLElement \| null`，蒙层 / 选区 / 辅助线都基于单 page DOM | `packages/stage/src/StageMask.ts:69-188` |
| ScrollViewer | 以单 page 尺寸为滚动范围 + translate 偏移 | `packages/editor/src/components/ScrollViewer.vue`、`packages/editor/src/utils/scroll-viewer.ts:1-167` |
| Zoom | 通过 `StageRender.setZoom` 配合 ScrollViewer，作用于单 page | `packages/stage/src/StageRender.ts:101-103` |

### 1.3 关键单例依赖

经过全仓搜索，下面这些点都依赖「只有一个 page DOM」：

1. `App.page` — 运行时 page 实例
2. `editorService.state.page` — 编辑器 store 当前页
3. `StageMask.page` — 蒙层关联的 page DOM
4. `StageMask.pageScrollParent` — page 的滚动父元素
5. `useDsl().pageConfig` — runtime 端 page 配置
6. `useEditorDsl().curPageId` — 编辑器 runtime 端当前页 id
7. `pageChange` 事件语义 — 隐含「渲染目标变了」

---

## 2. 目标态

### 2.1 视觉与交互目标

| 维度 | 目标 |
| --- | --- |
| 画布 | 无限 pan/zoom，可以远远缩到全览 N 个 page，也可以 zoom 到 100% 编辑单个 page |
| Page 布局 | 每个 page 在无限画布上有自己的 anchor 坐标（x, y）和尺寸（width, height），默认 grid 排列 |
| 同时渲染 | 视口内的所有 page 全部渲染（lazy 加载视口外 page） |
| 选中态 | 同一时刻只有一个 page 是「active」（可编辑），其他是「idle」（只读 + 半透明 overlay） |
| 切换 active | 点击某个 idle page → 该 page 高亮，组件树 / 属性面板 / 蒙层 / 辅助线都切到该 page |
| 拖入 / 编辑 | 拖入组件只对 active page 生效，框选只命中 active page |
| 页面关系 | 可选：page 之间能画连接线（活动流程图），不在第一版范围 |
| Page bar | 保留，作为「page 列表 + 缩略图 + 跳转」入口，**不再是「渲染切换」** |
| Runtime 复用 | 仍然只挂一个 runtime iframe；runtime 内部多 page 协调；性能：冷启动 / 热切换不变慢 |

### 2.2 与现有架构的兼容性

| 现有 | 兼容方案 |
| --- | --- |
| `MApp.items: (MPage \| MPageFragment)[]` | **完全保留**，DSL 形态不变 |
| Page 实例化流程（`Page` 类） | **完全保留**，每个 page 还是一棵 Node 树 |
| 组件 / 事件 / 数据源 | **完全保留**，每 page 内的逻辑零改动 |
| `App.page` 单例 | **变成「当前 active page」，加 `App.allPages: Map<Id, Page>` 缓存全部已构建的 Page 实例** |
| `App.setPage(id)` 语义 | **变成 `App.setActivePage(id)`：只是切 active，Page 实例不重建**（但首次访问 id 仍要走原 Page 构造） |
| `editorService.state.page` | **保留**，语义变成「active page」 |
| `useDsl.pageConfig` | **改成 `useDsl()` 返回 `pageConfigs: Ref<Map<Id, MPage>>`**；每个 page 渲染时按 id 取自己的 config |
| `page-change` 事件 | **改名 + 改语义**：`active-page-change`，并新增 `canvas-layout-change` 事件 |
| `StageMask.page` | **改成 `StageMask.activePage`**，选区 / 辅助线只绑 active |
| `ScrollViewer` | **改造成 pan/zoom viewer**，从「以 page 尺寸为基准」改为「以画布尺寸为基准 + matrix transform」 |
| `runtimeUrl`（iframe） | **保留**，N 个 page 共享一个 runtime 实例；CSS 隔离靠 `.magic-ui-page` 选择器 |

---

## 3. 改造方案（按实施顺序）

### Step 1：数据模型 + store 增量（先动这里，影响面最小）

**目标**：保留所有现有数据，加两样新东西：`canvasLayout` 和 `allPageConfigs`。

涉及文件：
- `packages/schema/src/index.ts` — 给 `MPage` 加可选的 `canvasLayout?: { x: number; y: number; width: number; height: number; }`（默认从 page 自身 style 推）
- `packages/editor/src/type.ts` — store state 加 `canvasLayout: Record<Id, CanvasLayout>`、`visiblePageIds?: Id[]`（性能优化用，可选）
- `packages/editor/src/services/editor.ts` — `set('canvasLayout', ...)` 配套 action；新增 `setCanvasLayout(id, layout)`、`setActivePage(id)` 区分于 `select(id)`

**关键 API 拆分**：

```ts
// editor service
select(id):  // 现有：选中节点（包含 page / page-fragment），会触发 set('page', page)
setActivePage(id):  // 新增：只切 active page，state.page = page，不重渲染 page 树
getCanvasLayout(id): CanvasLayout | null
setCanvasLayout(id, layout): void
```

`select(id)` 对 page 节点的行为从「切 page + 选中 page」拆成「调用 setActivePage + 选中 page」，对组件节点的行为不变（但内部先确保 active page 是该节点所属 page）。

### Step 2：Runtime 渲染从单 page 改为多 page

**目标**：runtime 端同时挂载所有 page，每个 page 是一个 `<MagicUiPage>` 实例，根容器是「无限画布」。

涉及文件：
- `runtime/vue/page/App.vue`、`runtime/react/page/App.tsx` — 改根组件
- `runtime/vue-runtime-help/src/hooks/use-dsl.ts`、`runtime/react-runtime-help/src/hooks/use-dsl.ts` — `pageConfig` → `pageConfigs: ComputedRef<Map<Id, MPage>>`，加 `activePageId` ref
- `runtime/vue-runtime-help/src/components/MagicUiCanvasPage.vue`（新增） — 替代直接 `<MagicUiPage>`，包一层提供 `.magic-ui-page-frame` + `data-page-id` + `data-active="true|false"` + 坐标 `transform: translate(x, y) scale(zoom)`

**关键设计**：

```vue
<!-- runtime/vue/page/App.vue -->
<template>
  <div class="magic-ui-canvas" :style="canvasStyle">
    <MagicUiCanvasPage
      v-for="page in pages"
      :key="page.id"
      :config="page"
      :active="page.id === activePageId"
      :layout="canvasLayout[page.id]"
    />
  </div>
</template>
```

```css
.magic-ui-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;        /* 画布外层不滚动，由 ScrollViewer/pan 控 */
  background: #f5f5f5;     /* 区别于 page 内白底 */
}
.magic-ui-page-frame {
  position: absolute;
  /* transform 由 props 动态给 */
}
.magic-ui-page-frame[data-active="false"] {
  pointer-events: none;    /* idle page 不可点 */
  filter: brightness(0.95);
}
```

**active 切换的视觉效果**：active page 有边框 / 阴影；idle page 半透明 + 不可交互。

### Step 3：Page 实例生命周期与渲染解耦

**目标**：N 个 page 都能被 runtime 渲染，但 Page 实例只在被「首次访问」时构造。

涉及文件：
- `packages/core/src/App.ts` — `this.page` 保留为「active page」；新增 `this.allPages: Map<Id, Page> = new Map()`、`getOrCreatePage(id)` 方法
- `packages/core/src/Page.ts` — 单 page 行为不变

**关键改动**：

```ts
// App.ts
public allPages: Map<Id, Page> = new Map();

public getOrCreatePage(id: Id): Page | undefined {
  if (this.allPages.has(id)) return this.allPages.get(id);
  const cfg = this.dsl?.items.find(p => `${p.id}` === `${id}`);
  if (!cfg) return undefined;
  const page = new Page({ config: cfg, app: this });
  this.allPages.set(id, page);
  return page;
}

public setActivePage(id: Id) {
  const page = this.getOrCreatePage(id);
  if (!page) return;
  this.page = page;  // 保留兼容
  super.emit('active-page-change', page);
}

// 删掉 setPage 里的「destroy 旧 page」逻辑
public setPage(id: Id) {
  // 兼容旧调用，语义改成「setActivePage」
  this.setActivePage(id);
}

// destroy() 改为遍历 allPages
public destroy() {
  this.allPages.forEach(p => p.destroy());
  this.allPages.clear();
  // ...
}
```

**性能考量**：
- 用户有 100 个 page 时，全部构造会爆内存 → 加 `maxLivePages`（默认 5-10），LRU 淘汰冷 page
- 淘汰的 page 仍在 `dsl.items` 里，runtime 还能渲染（runtime 拿 `pageConfigs` 从 dsl 取，不需要 page 实例），但 `App.getNode(id)` 在被淘汰 page 里会返回 undefined，需要上层按需重建

### Step 4：StageMask / 选区 / 辅助线适配

**目标**：选区 / 辅助线 / 蒙层只对 active page 生效，坐标系以画布为基准。

涉及文件：
- `packages/stage/src/StageMask.ts` — `page` → `activePage`，`setLayout(el)` 不变（el 永远在 active page 内）
- `packages/stage/src/StageRender.ts` — `getTargetElement(id)` 要扫所有 page DOM（按 `data-page-id` 过滤，或全局 getElById 后校验）
- `packages/stage/src/types.ts` — Runtime 接口 `updatePageId` 保留兼容（语义改成 `setActivePageId`），新增 `setCanvasLayout(id, layout)`

**关键改动**：

```ts
// StageMask.ts
public activePage: HTMLElement | null = null;  // 替代 page
public pageFrames: Map<Id, HTMLElement> = new Map();  // 全部 page DOM

public observePageFrame(pageId: Id, el: HTMLElement) {
  this.pageFrames.set(pageId, el);
  if (pageId === this.currentActiveId) {
    this.activePage = el;
  }
}
```

**辅助线要决定**：辅助线只对齐 active page 内的元素，还是全画布所有 page 元素？
- 推荐：只对齐 active page（活动页面内 snap 体验不变，跨 page snap 容易误触）
- 实施：`computeGuides` 从 `app.page.nodes` 改成 `app.activePage.nodes`，约束范围

### Step 5：ScrollViewer 改造成 pan/zoom viewer

**目标**：从「以 page 尺寸滚动」改为「以画布为无限空间 + 仿 Figma 的 pan/zoom」。

涉及文件：
- `packages/editor/src/components/ScrollViewer.vue` — 改名为 `CanvasViewer.vue`（或保留旧名，加 prop `mode: 'page' | 'canvas'`）
- `packages/editor/src/utils/scroll-viewer.ts` — `CanvasViewer` 类（新增），继承 EventEmitter，pan 改 transform 而不是 scroll

**关键设计**：

```ts
class CanvasViewer {
  private scale = 1;       // 整体缩放
  private panX = 0;        // 画布平移 X
  private panY = 0;        // 画布平移 Y

  setViewport(pan: Point, scale: number) {
    this.panX = pan.x;
    this.panY = pan.y;
    this.scale = scale;
    this.target.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }

  fitToActivePage(pageLayout: CanvasLayout, containerSize: Size) {
    // 类似 Figma 的「按 Z 聚焦到当前 page」
    this.setViewport(
      {
        x: containerSize.width / 2 - (pageLayout.x + pageLayout.width / 2) * this.scale,
        y: containerSize.height / 2 - (pageLayout.y + pageLayout.height / 2) * this.scale,
      },
      this.scale,
    );
  }

  fitToAllPages(pages: CanvasLayout[], containerSize: Size) {
    // 类似 Figma 的「Shift + 1」缩放到全览
    const bounds = computeBounds(pages);
    // ... 自适应计算 pan + scale
  }
}
```

**平移 / 缩放交互**：
- 滚轮 = 缩放（以光标位置为锚点，仿 Figma）
- Space + 拖拽 / 中键拖拽 = 平移
- Trackpad 双指拖 = 平移，捏合 = 缩放
- 复用现有 `StageMask` 的 wheelHandler 思路，但要区分「缩放」vs「滚动」

### Step 6：编辑器侧 page 切换交互

**目标**：page bar 点击不再是「销毁 + 重建」，是「平移 + 聚焦 + 高亮 active」。

涉及文件：
- `packages/editor/src/layouts/page-bar/PageBar.vue` — `switchPage(id)` 改为 `setActivePage(id)` + 调 `CanvasViewer.focusToPage(id)`
- `packages/editor/src/layouts/workspace/viewer/Stage.vue` — `watch(page, ...)` 改为 `setActivePage` + 平移动画

```ts
// PageBar.vue
const switchPage = (id: Id) => {
  // 不再调 editorService.select(id)（那会触发 select 事件 + 历史栈）
  // 改为：
  editorService.setActivePage(id);
  canvasViewer.focusToPage(id);
};
```

**要不要保留 select(pageId) 兼容**？建议保留，但内部转发到 setActivePage + addToSelection。

### Step 7：拖入 / 框选只对 active page 生效

**目标**：现有拖入逻辑已经基于 `state.page`，state.page 改成 active page 后自然只对 active 生效。要修的是「跨 page 框选」——

涉及文件：
- `packages/stage/src/ActionManager.ts` — `multiSelect` 选区范围限定在 active page DOM 内
- `packages/editor/src/layouts/workspace/viewer/Stage.vue` — `dropHandler` 已基于 `page.value`，自动正确

**额外考虑**：拖入组件时如果光标在 idle page 区域，是否自动切到该 page？
- 推荐：**是**，光标在哪个 page 上，drop 时就 setActivePage 到那个 page，再 add。减少误操作。

### Step 8（可选）：缩略图 / page bar 增强

- page tab 右侧加小缩略图（按画布当前 zoom 渲染一份小图，或者用 `@zumer/snapdom` 抓 page DOM 成图）
- page bar 改为左侧 dock（Figma 风格），tab 缩略图纵向排列

### Step 9（可选）：page 间连接线

- 新增 `MNode.type = 'flow-link'`，source / target 指向不同 pageId
- 画布层渲染 SVG overlay，按 anchor 坐标连线
- **不建议放进第一版**，独立 feature

---

## 4. 关键技术风险与对策

### 风险 1：N 个 page 全实例化内存爆炸

**对策**：
- LRU 缓存，maxLivePages 默认 5-10
- 超限时淘汰最冷 page（保留 dsl 引用，销毁 Node 实例 + DOM）
- 重新访问被淘汰 page 时按需重建（`getOrCreatePage` 已就位）
- runtime 端有 `pageConfigs: Map<Id, MPage>`（直接从 dsl.items 取，**不依赖 Page 实例**），所以即使 Page 实例被淘汰，runtime 仍然能渲染

### 风险 2：辅助线 / 选区坐标错位

**对策**：
- 所有事件坐标都先过 `getCanvasMatrix()` 反变换到画布坐标
- 选区 / 辅助线生成时限定 `app.activePage.nodes`（不要全画布）
- 拖入组件时按 `canvasLayout[activePageId]` 算初始 top/left

### 风险 3：page 之间 z-index / 遮挡

**对策**：
- 默认 z-index 按 page 在 dsl.items 里的顺序：后面的盖前面的
- active page 永远 z-index 最高
- 切换 active 时 z-index 动画过渡（CSS transition）

### 风险 4：runtime 端 useDsl 单 pageConfig 假设被打破

**对策**：
- `useDsl` 升级为 `useCanvasDsl`，返回 `{ pageConfigs, activePageId, canvasLayout }`
- 旧 `useDsl` 保留为 `useCanvasDsl().pageConfigs.get(activePageId)` 的 thin wrapper，**不立即删除**，给业务方迁移时间
- 在 `@deprecated` 里标 `useDsl`，1-2 个 minor 版本后删

### 风险 5：第三方业务组件假设「只有一个 page 根节点」

**对策**：
- 业务组件的 `useDsl` 仍然能拿到单 pageConfig（见风险 4 wrapper）
- 业务组件的 `useEditorDsl().root.value` 仍然能拿到 MApp 根
- 业务组件自己只需要改「监听哪个 page」——默认监听 active page，需要监听全部的用新 hook

---

## 5. 业界参考

| 产品 | 多 page 模型 | 无限画布 | 我们的借鉴点 |
| --- | --- | --- | --- |
| **Figma** | 1 file = 多 page，每 page 内多 frame | ✅ 无限 + pan/zoom | 「多 frame 模式」概念上同构；fit-to-page / fit-to-all 交互 |
| **tldraw** | 多 page，**单 page 同时渲染** | ✅ 无限 | page 概念 + 切换交互；page 内坐标空间定义 |
| **excalidraw** | 单 page（无 page 概念） | ✅ 无限 | library 拖入的多元素管理 |
| **FigJam** | 多 page 切 | ✅ 无限 | sticky note 自由摆放概念 |
| **Miro / Mural** | 多 board 切 | ✅ 无限 | board 内 frame 概念 |

**最直接的参考 = Figma**，但 Figma 的「frame」≠ tmagic 的「MPage」：
- Figma frame = 视觉容器，可嵌套，可画连接线
- tmagic MPage = 业务页面，DSL 顶层节点，**不能嵌套**（但 pageFragment 可被引用）

我们要做的是「把 Figma 那种『多个 frame 放在一个 file』的 UX 借过来，套到 tmagic 的『多 MPage』场景」。

---

## 6. 实施路线建议

| 阶段 | 内容 | 风险 | 估时（仅供参考） |
| --- | --- | --- | --- |
| **P0 — 基础** | Step 1（store 增量）+ Step 6（page bar 改 setActivePage） | 低，向后兼容 | 1 周 |
| **P0 — 渲染** | Step 2（runtime 多 page 渲染）+ Step 3（Page 实例缓存） | 中，runtime 改根组件 | 2 周 |
| **P1 — 交互** | Step 4（StageMask 适配）+ Step 7（drop 切 active） | 中 | 1-2 周 |
| **P1 — 画布** | Step 5（ScrollViewer → CanvasViewer） | 高，交互手感要打磨 | 2 周 |
| **P2 — 增强** | Step 8（缩略图）/ Step 9（连接线，可选） | 低 | 1-2 周 |

**总估时 ~6-8 周**，按 1 个前端全职算。

**里程碑**：
- M1（P0 完成）：可以同时看到 N 个 page，点击切换 active，但画布仍然受限于原 ScrollViewer 行为（没真正的 pan/zoom）
- M2（P1 完成）：画布变成真正的无限 pan/zoom，可以缩放到全览，可以聚焦到单 page
- M3（P2 完成）：page bar 缩略图、flow link（可选）

---

## 7. 关键文件改动清单（汇总）

| 文件 | 改动类型 | 说明 |
| --- | --- | --- |
| `packages/schema/src/index.ts` | 加字段 | `MPage.canvasLayout?: { x, y, width, height }` |
| `packages/core/src/App.ts` | 改 | `page` → `activePage`，加 `allPages` + `getOrCreatePage` + `setActivePage` |
| `packages/core/src/Page.ts` | 不变 | 单 page 行为零改动 |
| `packages/editor/src/services/editor.ts` | 加 action | `setActivePage`、`setCanvasLayout`，调整 `select` 对 page 的行为 |
| `packages/editor/src/type.ts` | 加字段 | store state 加 `canvasLayout` |
| `packages/editor/src/layouts/workspace/viewer/Stage.vue` | 改 | `watch(page)` 改用 setActivePage + CanvasViewer |
| `packages/editor/src/layouts/page-bar/PageBar.vue` | 改 | `switchPage` 改 setActivePage + 调 CanvasViewer.focusToPage |
| `packages/editor/src/components/ScrollViewer.vue` | 改/重命名 | 加 `mode: 'page' \| 'canvas'`，canvas 模式即新 CanvasViewer |
| `packages/editor/src/utils/scroll-viewer.ts` | 加类 | `CanvasViewer` 类（pan + zoom + fit） |
| `packages/stage/src/StageMask.ts` | 改 | `page` → `activePage`，加 `pageFrames` map |
| `packages/stage/src/StageRender.ts` | 改 | `getTargetElement` 扫所有 page DOM |
| `packages/stage/src/types.ts` | 加接口 | `Runtime.setActivePageId` / `Runtime.setCanvasLayout` |
| `runtime/vue/page/App.vue` | 重写根 | 改 `<MagicUiCanvasPage v-for>` |
| `runtime/react/page/App.tsx` | 重写根 | 同上 |
| `runtime/vue-runtime-help/src/hooks/use-dsl.ts` | 加 / 改 | 新增 `useCanvasDsl`，旧 `useDsl` 保留为 wrapper |
| `runtime/react-runtime-help/src/hooks/use-dsl.ts` | 同上 | 同上 |
| `runtime/vue-runtime-help/src/components/MagicUiCanvasPage.vue` | 新增 | 单 page frame 容器组件 |
| `runtime/react-runtime-help/src/components/MagicUiCanvasPage.tsx` | 新增 | 同上 |

**未列出的影响点**（需要 grep 全面评估后再做）：
- 所有使用 `editorService.get('page')` 的地方，行为不变（仍是 active page），但需要确认没有「假设 page 切换会重置 DOM」的逻辑
- 所有 `useDsl().pageConfig` 的业务方，建议加 deprecation 提示，但**不强制**改（wrapper 能撑住）
- 第三方 iframe runtime（`stageOverlay` / `stage.ts` 里的 `customizedRender`）—— 评估是否要支持多 page 模式

---

## 8. 验证标准

完成 P0 + P1 后要能验证：

- [ ] 同时挂 3+ page 在画布上，pan/zoom 流畅（60fps）
- [ ] 切换 active page < 100ms（无白屏）
- [ ] 拖入组件：drop 在 active page 区域内 → 加到 active；drop 在 idle page 区域 → 自动切 active 再加
- [ ] 框选：只在 active page 范围内生效
- [ ] 缩放到全览（fit-to-all）：能看到所有 page 的 frame
- [ ] 缩放到聚焦（fit-to-active）：当前 active page 居中显示
- [ ] page bar 点击 = 切 active + 平移到该 page，不销毁 Page 实例
- [ ] 历史栈（撤销 / 重做）：page 切换不进历史栈，page 内部编辑进历史栈
- [ ] 跨 page 引用（pageFragment）：仍按现有机制工作，不受影响
- [ ] 单 page 模式（业务方不启用 infinite canvas）向后兼容：旧用法零改动

---

## 9. 开放问题（需要业务方拍板）

1. **page 之间要不要画连接线**（活动流程图）？第一版砍掉 / 第一版做？
2. **缩略图**：page bar 缩略图是实时抓 DOM 还是提前缓存？实时抓需要用 `@zumer/snapdom`，可能阻塞 UI 线程，建议后台 worker 缓存。
3. **多 page 命名空间**：DSL 里的 `MPage.id` 现在是业务自己定的，多 page 同时渲染时 `getElById` 会不会跨 page 撞 id？需要扫一遍业务方数据。
4. **active page 的视觉提示**：边框 / 阴影 / 顶栏高亮，选哪种？Figma 是顶栏高亮 + 边框 + 阴影叠用。
5. **历史栈粒度**：page 切换是否要进历史栈？目前是不进，保持不变。
6. **业务组件升级**：第三方业务组件假设「只有一个 page 」，要不要提供一个 `useActivePageId()` hook 帮他们无痛迁移？

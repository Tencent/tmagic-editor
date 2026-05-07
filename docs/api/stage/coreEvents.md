# stage事件

## mounted

- **参数**：（无）
- **详情**：stage 挂载完成后触发

## runtime-ready

- **参数**：
  - `runtime: Runtime`：runtime 实例
- **详情**：runtime 准备就绪时触发

## page-el-update

- **参数**：
  - `el: HTMLElement`：当前页面的根节点元素
- **详情**：当前页面的根节点变化时触发，stage 会同步根节点和画布的大小

## change-guides

- **参数**：
  - `data: GuidesEventData`：参考线数据，包含 `type`（参考线方向）和 `guides`（参考线位置数组）
- **详情**：参考线变化时触发

## select

- **参数**：
  - `el: HTMLElement`：被选中的元素
  - `event: MouseEvent`：触发选中的鼠标事件
- **详情**：单选选中元素时触发

## multi-select

- **参数**：
  - `els: HTMLElement[]`：被选中的元素列表
  - `event: MouseEvent`：触发选中的鼠标事件
- **详情**：多选选中元素时触发

## dblclick

- **参数**：
  - `event: MouseEvent`：鼠标双击事件
- **详情**：画布元素被双击时触发

## update

- **参数**：
  - `data: UpdateEventData`：更新事件数据，包含被更新的元素及其样式信息（`width`、`height`、`left`、`top`、`transform` 等）和 `parentEl`
- **详情**：拖拽/缩放等操作更新组件时触发

## sort

- **参数**：
  - `data: SortEventData`：排序数据，包含 `src`（源节点 id）、`dist`（目标节点 id）以及 `root`
- **详情**：组件排序变化时触发

## select-parent

- **参数**：（无）
- **详情**：触发选中父级节点时抛出

## rerender

- **参数**：（无）
- **详情**：需要重新渲染画布时触发

## remove

- **参数**：
  - `data: RemoveEventData`：被移除元素的数据
- **详情**：从画布删除组件时触发

## highlight

- **参数**：
  - `el: HTMLElement`：被高亮的元素
- **详情**：高亮元素时触发

## mousemove

- **参数**：
  - `event: MouseEvent`：鼠标移动事件
- **详情**：鼠标在画布上移动**且命中带 magic id 的节点元素**时触发；若 `getElementFromPoint` 拿不到带 id 的节点（例如悬空在画布空白处），则不会派发该事件

## mouseleave

- **参数**：
  - `event: MouseEvent`：鼠标离开事件
- **详情**：鼠标离开画布时触发

## drag-start

- **参数**：
  - `event: OnDragStart`：moveable 的拖拽开始事件
- **详情**：开始拖拽元素时触发

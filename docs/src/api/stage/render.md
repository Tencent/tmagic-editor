# StageRender

## 配置

### core

- **类型：** [StageCore](./core.md)
  
- **详情：**
  
StageCore实例

## 属性

### core

- **类型：** [StageCore](./core.md)
  
- **详情：**

StageCore实例

### contentWindow

- **类型：** RuntimeWindow | null

```ts
interface RuntimeWindow extends Window {
  magic: Magic;
}

interface Magic {
  /** 当前页面的根节点变化时调用该方法，编辑器会同步该el和stage的大小，该方法由stage注入到iframe.contentWindow中 */
  onPageElUpdate: (el: HTMLElement) => void;

  onRuntimeReady: (runtime: Runtime) => void;
}
```
  
- **详情：**

组件的js、css执行的环境，直接渲染为当前window，iframe渲染则为iframe.contentWindow

### runtime

- **类型：** Runtime | null

```ts
interface Runtime {
  getApp?: () => Core;
  beforeSelect?: (el: HTMLElement) => Promise<boolean> | boolean;
  // 编辑器Dsl整个改变时调用
  updateRootConfig?: (config: MApp) => void;
  // 选择页面时调用
  updatePageId?: (id: Id) => void;
  // 选中组件时调用
  select?: (id: Id) => Promise<HTMLElement> | HTMLElement;
  // 添加组件时调用
  add?: (data: UpdateData) => void;
  // 更新组件时调用
  update?: (data: UpdateData) => void;
  // 流式布局下拖动组件后调用
  sortNode?: (data: SortEventData) => void;
  // 删除组件时调用
  remove?: (data: RemoveData) => void;
}
```
  
- **详情：**

用于编辑器与画布的交互

### iframe

- **类型：** HTMLIFrameElement
  
- **详情：**

### runtimeUrl

- **类型：** string
  
- **详情：**

## 方法

### destroy

- **返回：**

  - `{void}`

- **用法：**

  销毁实例

### mount

- **参数：**

  - `{HTMLDivElement} el` 将页面挂载到该Dom节点上

- **返回：**

  - `{void}`

- **用法：**

  挂载Dom节点


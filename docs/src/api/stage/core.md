# StageCore

## 配置

### canSelect

- **类型：** Function
  
- **默认值：** (el: HTMLElement) => !!el.id
  
- **详情：**
  
  判断Dom节点是否能被选中

### moveableOptions

- **类型：** (el: HTMLElement) => boolean
  
- **默认值：** (el: HTMLElement) => !!el.id
  
- **详情：**
  
  选中框配置选项，使用的是[moveable](https://github.com/daybrush/moveable)第三方库
  
  ### runtimeUrl

- **类型：** string
  
- **默认值：** undefined
  
- **详情：**
  
  runtime 的HTML地址，可以是一个HTTP地址，如果和编辑器不同域，需要设置跨域，也可以是一个相对或绝对路径
  
  ### render

- **类型：** (renderer: StageCore) => Promise\<HTMLElement\> | HTMLElement
  
- **默认值：** undefined
  
- **详情：**
  
  画布渲染的内容，通常是通过解析[modelValue](#modelValue)来渲染出DOM，return的DOM结构需要有一个根节点。

### autoScrollIntoView

- **类型：** boolean
  
- **默认值：** undefined
  
- **详情：**
  
选中组件时，是否自动滚动该组件到可视区域


### updateDragEl

- **类型：** (el: HTMLDivElement, target: HTMLElement) => void;
  
- **默认值：** undefined
  
- **详情：**
  
当选中框与组件不贴合时，可以通过此方法进行调整


## 属性

### selectedDom

- **类型：** Element | undefined
  
- **详情：**
  
当前选中的Dom

### highlightedDom

- **类型：** Element | undefined
  
- **详情：**
  
当前高亮的Dom

### renderer

- **类型：** [StageRender](./render.md)
  
- **详情：**
  
StageRender实例

### mask

- **类型：** [StageMask](./mask.md)
  
- **详情：**
  
StageMask实例


### dr

- **类型：** [StageDragResize](./drag-resize.md)
  
- **详情：**
  
StageDragResize实例

### config

- **类型：** Object
  
- **详情：**
  
初始化配置

### container

- **类型：** HTMLDivElement
  
- **详情：**
  
画布根节点

## 方法

### mount

- **参数：**

  - `{HTMLDivElement} el` 将stage挂载到该Dom节点上

- **返回：**

  - `{void}`

- **用法：**

  挂载Dom节点

### clearGuides

- **返回：**

  - `{void}`

- **用法：**

  清空所有参考线

### destroy

- **返回：**

  - `{void}`

- **用法：**

  销毁实例


### getElementFromPoint

- **参数：**

  - `{MouseEvent} event`

- **返回：**

  - `{Promise<void>}`


### select

- **参数：**

  - `{Id | HTMLElement} idOrEl` 组件Dom节点的id属性，或者Dom节点
  - `{MouseEvent} MouseEvent`

- **返回：**

  - `{Promise<void>}`

- **用法：**

  选中组件

### update

- **参数：**

  - `{UpdateData} data` 更新的数据

```ts
interface UpdateData {
  config: MNode;
  root: MApp;
}
```

- **返回：**

  - `{Promise<void>}`

- **用法：**

  更新选中的节点

### highlight

- **参数：**

  - `{HTMLElement | Id} idOrEl` 组件Dom节点的id属性，或者Dom节点

- **返回：**

  - `{Promise<void>}`

- **用法：**

  高亮选中组件

### sortNode

- **参数：**

  - `{SortEventData} data`

```ts
interface SortEventData {
  src: Id;
  dist: Id;
  root?: MApp;
}
```

- **返回：**

  - `{Promise<void>}`

### add

- **参数：**

  - `{UpdateData} data`


```ts
interface UpdateData {
  config: MNode;
  root: MApp;
}
```

- **返回：**

  - `{Promise<void>}`

### remove

- **参数：**

  - `{UpdateData} data`


```ts
interface UpdateData {
  config: MNode;
  root: MApp;
}
```

- **返回：**

  - `{Promise<void>}`

### setZoom

- **参数：**

  - `{number} zoom`

- **返回：**

  - `{void}`

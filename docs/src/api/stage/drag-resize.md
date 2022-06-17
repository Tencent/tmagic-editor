# StageDragResize

## 配置

### core

- **类型：** [StageCore](./core.md)
  
- **详情：**
  
StageCore实例

### container

- **类型：** HTMLElement
  
- **详情：**
  
选中框容器

## 属性

### core

- **类型：** [StageCore](./core.md)
  
- **详情：**

### container

- **类型：** HTMLElement
  
- **详情：**
  
选中框容器

### target

- **类型：** HTMLElement
  
- **详情：**
  
目标节点

### dragEl

- **类型：** HTMLElement
  
- **详情：**
  
目标节点在蒙层中的占位节点

### moveable

- **类型：** [moveable](https://github.com/daybrush/moveable)
  
- **详情：**
  
moveable实例

### horizontalGuidelines

- **类型：** number[]
  
- **详情：**
  
水平参考线

### verticalGuidelines

- **类型：** number[]
  
- **详情：**
  
垂直参考线

### elementGuidelines

- **类型：** HTMLElement[]
  
- **详情：**
  
对齐元素集合

### mode

- **类型：** Mode

```ts
enum Mode {
  /** 绝对定位布局 */
  ABSOLUTE = 'absolute',
  /** 固定定位布局 */
  FIXED = 'fixed',
  /** 流式布局 */
  SORTABLE = 'sortable',
}
```
  
- **详情：**
  
布局方式：流式布局、绝对定位、固定定位

## 方法


### select

- **参数：**

  - `{HTMLElement} el` 组件Dom节点
  - `{MouseEvent} MouseEvent`

- **返回：**

  - `{void}`

- **用法：**

  将选中框渲染并覆盖到选中的组件Dom节点上方

  当选中的节点是不是absolute时，会创建一个新的节点出来作为拖拽目标

### updateMoveable

- **参数：**

  - `{HTMLElement} el` 组件Dom节点

- **返回：**

  - `{void}`

- **用法：**

  初始化选中框并渲染出来

### setGuidelines

- **参数：**

  - `{GuidesType} type` 参考线类型
  - `{number[]} guidelines` 参考线偏移值

```ts
/** 参考线类型 */
export enum GuidesType {
  /** 水平 */
  HORIZONTAL = 'horizontal',
  /** 垂直 */
  VERTICAL = 'vertical',
}
```

- **返回：**

  - `{void}`

- **用法：**

  设置参考线

### clearGuides

- **返回：**

  - `{void}`

- **用法：**

  情况参考线

### destroy

- **返回：**

  - `{void}`

- **用法：**

  销毁实例


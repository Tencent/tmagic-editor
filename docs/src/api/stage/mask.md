# StageMask

## 配置

### core

- **类型：** [StageCore](./core.md)
  
- **详情：**
  
StageCore实例

## 属性

### content

- **类型：** HTMLDivElement
  
- **详情：**
  
蒙层的Dom节点

### wrapper

- **类型：** HTMLDivElement
  
- **详情：**
  
蒙层的容器Dom节点，用于实现滚动

### core

- **类型：** [StageCore](./core.md)
  
- **详情：**
  
StageCore实例

### page

- **类型：** HTMLElement | null
  
- **详情：**
  
当前页面组件Dom节点

### pageScrollParent

- **类型：** HTMLElement | null
  
- **详情：**
  
页面组件的滚动父节点

### scrollTop

- **类型：** number
  
- **详情：**
  
垂直滚动位移

### scrollLeft

- **类型：** number
  
- **详情：**
  
水平滚动位移

### width

- **类型：** number
  
- **详情：**
  
蒙层宽度，不应该手动设置，会自动同步[page](#page)

### height

- **类型：** number
  
- **详情：**
  
蒙层高度，不应该手动设置，会自动同步[page](#page)

### wrapperHeight

- **类型：** number
  
- **详情：**
  
蒙层容器高度

### wrapperWidth

- **类型：** number
  
- **详情：**
  
蒙层容器宽度

### maxScrollTop

- **类型：** number
  
- **详情：**
  
最大垂直滚动位移

### maxScrollLeft

- **类型：** number
  
- **详情：**
  
最大水平滚动位移

## 方法

### mount

- **参数：**

  - `{HTMLDivElement} el` 将蒙层挂载到该Dom节点上

- **返回：**

  - `{void}`

- **用法：**

  挂载Dom节点

### scrollIntoView

- **参数：**

  - `{Element} el` 需要滚动的节点

- **返回：**

  - `{void}`

- **用法：**

  将指定节点滚动到可视区域

### destroy

- **返回：**

  - `{void}`

- **用法：**

  销毁实例

### setLayout

- **参数：**

  - `{Element} el`


- **返回：**

  - `{void}`

- **用法：**

  根据节点设置模式，固定模式wrap与content宽高保持一直


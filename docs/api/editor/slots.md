# Editor组件 slots

## header

- **详情：** 编辑器最顶部区域

- **默认：** 无

- **示例：**

```html
<template>
  <m-editor>
    <template #header>
      <div class="custom-header">自定义头部内容</div>
    </template>
  </m-editor>
</template>
```

## nav

- **详情：** 编辑器顶部菜单栏

- **默认：** [NavMenu.vue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/layouts/NavMenu.vue)

- **插槽 Props：**
  - `editorService`: editorService 实例

:::warning
属性配置[menu](./props.md#menu)由默认组件接收，如设置该slot，[menu](./props.md#menu)配置将失效
:::

- **示例：**

```html
<template>
  <m-editor>
    <template #nav="{ editorService }">
      <div class="custom-nav">
        <button @click="save">保存</button>
      </div>
    </template>
  </m-editor>
</template>
```

## content-before

- **详情：** 编辑器主要内容区域之前

- **默认：** 无

## src-code

- **详情：** 源码查看区域

- **默认：** 默认的代码编辑器

- **插槽 Props：**
  - `editorService`: editorService 实例

## sidebar

- **详情：** 左边栏

- **默认：** [Sidebar.vue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/layouts/sidebar/Sidebar.vue)

- **插槽 Props：**
  - `editorService`: editorService 实例

:::warning
属性配置[sidebar](./props.md#sidebar)由默认组件接收，如设置该slot，[sidebar](./props.md#sidebar)配置将失效
:::

- **示例：**

```html
<template>
  <m-editor>
    <template #sidebar="{ editorService }">
      <div class="custom-sidebar">
        <!-- 自定义侧边栏内容 -->
      </div>
    </template>
  </m-editor>
</template>
```

## component-list

- **详情：** 左边栏中的组件列表

- **默认：** 默认的组件列表

- **插槽 Props：**
  - `componentGroupList`: 组件分组列表

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## component-list-panel-header

- **详情：** 左边栏中的组件列表内上方位置

- **默认：** 无

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## component-list-item

- **详情：** 左边栏中的组件列表中组件item

- **默认：** 图片加文案

- **插槽 Props：**
  - `component`: 组件配置对象

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

- **示例：**

```html
<template>
  <m-editor>
    <template #component-list-item="{ component }">
      <div class="custom-item">
        <span>{{ component.text }}</span>
      </div>
    </template>
  </m-editor>
</template>
```

## layer-panel-header

- **详情：** 左边栏中的已选组件（组件树）内顶部位置

- **默认：** 无

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## layer-node-content

- **详情：** 左边栏中的已选组件（组件树）节点完整内容

- **默认：** 组件名称加id和工具按钮

- **插槽 Props：**
  - `data`: 节点数据

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## layer-node-label

- **详情：** 左边栏中的已选组件（组件树）节点标签部分

- **默认：** 组件名称加id

- **插槽 Props：**
  - `data`: 节点数据

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

- **示例：**

```html
<template>
  <m-editor>
    <template #layer-node-label="{ data }">
      <span>{{ data.type }} - {{ data.name }}</span>
    </template>
  </m-editor>
</template>
```

## layer-node-tool

- **详情：** 左边栏中的已选组件（组件树）节点右侧工具区域

- **默认：** 无

- **插槽 Props：**
  - `data`: 节点数据

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## code-block-panel-header

- **详情：** 左边栏中的代码块列表内顶部位置

- **默认：** 无

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## code-block-panel-tool

- **详情：** 左边栏中的代码块列表中代码块右侧位置

- **默认：** 无

- **插槽 Props：**
  - `id`: 代码块id
  - `data`: 代码块数据

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## code-block-panel-search

- **详情：** 左边栏中的代码块列表搜索框位置

- **默认：** 无

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## data-source-panel-tool

- **详情：** 左边栏中的数据源列表中数据源右侧位置

- **默认：** 无

- **插槽 Props：**
  - `data`: 数据源数据

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## data-source-panel-search

- **详情：** 左边栏中的数据源列表搜索框位置

- **默认：** 无

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## workspace

- **详情：** 编辑器中间区域

- **默认：** [Workspace.vue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/layouts/workspace/Workspace.vue)

- **插槽 Props：**
  - `editorService`: editorService 实例

## stage

- **详情：** 画布

- **默认：** [Stage.vue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/layouts/workspace/Stage.vue)

## workspace-content

- **详情：** 编辑器中间区域内，画布上方位置

- **默认：** 无

- **插槽 Props：**
  - `editorService`: editorService 实例

## page-bar

- **详情：** 编辑器中间区域底部页面标签栏

- **默认：** 默认的页面标签栏

## page-bar-add-button

- **详情：** 页面标签栏中的"添加页面"按钮

- **默认：** 默认的添加按钮

## page-bar-title

- **详情：** 编辑器中间区域底部页面标题

- **默认：** 页面名称

- **插槽 Props：**
  - `page`: 页面配置对象

- **示例：**

```html
<template>
  <m-editor>
    <template #page-bar-title="{ page }">
      <span>{{ page.name }} - {{ page.id }}</span>
    </template>
  </m-editor>
</template>
```

## page-bar-popover

- **详情：** 编辑器中间区域底部页面标题悬浮框内容

- **默认：** 页面详细信息

- **插槽 Props：**
  - `page`: 页面配置对象

## page-list-popover

- **详情：** 页面列表弹出框内容

- **默认：** 页面列表

- **插槽 Props：**
  - `list`: 页面列表

## props-panel

- **详情：** 编辑器右侧属性配置

- **默认：** [PropsPanel.vue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/layouts/PropsPanel.vue)

## props-panel-header

- **详情：** 编辑器右侧属性配置内顶部区域

- **默认：** 无

## content-after

- **详情：** 编辑器主要内容区域之后

- **默认：** 无

## footer

- **详情：** 编辑器底部区域

- **默认：** 无

## empty

- **详情：** 当前没有页面时，编辑器中间区域

- **默认：** [AddPageBox.vue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/layouts/AddPageBox.vue)

- **插槽 Props：**
  - `editorService`: editorService 实例

- **示例：**

```html
<template>
  <m-editor>
    <template #empty="{ editorService }">
      <div class="custom-empty">
        <p>暂无页面</p>
        <button @click="createFirstPage">创建第一个页面</button>
      </div>
    </template>
  </m-editor>
</template>
```

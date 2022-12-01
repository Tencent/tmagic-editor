# Editor组件 slots

## nav

- **详情：** 编辑器顶部菜单栏

- **默认：** [NavMenu.vue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/layouts/NavMenu.vue)

:::warning
属性配置[menu](./props.md#menu)由默认组件接收，如设置该slot，[menu](./props.md#menu)配置将失效
:::

## sidebar

- **详情：** 左边栏

- **默认：** [Sidebar.vue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/layouts/sidebar/Sidebar.vue)

:::warning
属性配置[sidebar](./props.md#sidebar)由默认组件接收，如设置该slot，[sidebar](./props.md#sidebar)配置将失效
:::

## component-list-panel-header

- **详情：** 左边栏中的组件列表内上方位置

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## component-list-item

- **详情：** 左边栏中的组件列表中组件item

- **默认：** 图片加文案

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## layer-panel-header

- **详情：** 左边栏中的已选组件（组件树）内顶部位置

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## layer-node-content

- **详情：** 左边栏中的已选组件（组件树）节点

- **默认：** 组件名称加id

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## code-block-panel-header

- **详情：** 左边栏中的代码块列表内顶部位置

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## code-block-panel-tool

- **详情：** 左边栏中的代码块列表中代码块右侧位置

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## code-block-edit-panel-header

- **详情：** 代码块弹窗编辑器中弹窗顶部区域

:::warning
如设置了[sidebar](#sidebar)插槽，此插槽将失效
:::

## workspace

- **详情：** 编辑器中间区域

- **默认：** [Workspace.vue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/layouts/workspace/Workspace.vue)

## stage

- **详情：** 画布

- **默认：** [Stage.vue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/layouts/workspace/Stage.vue)

## workspace-content

- **详情：** 编辑器中间区域内

## page-bar-title

- **详情：** 编辑器中间区域底部页面标题

## page-bar-popover

- **详情：** 编辑器中间区域底部页面标题悬浮框

## props-panel

- **详情：** 编辑器右侧属性配置

- **默认：** [PropsPanel.vue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/layouts/PropsPanel.vue)

## props-panel-header

- **详情：** 编辑器右侧属性配置内顶部区域

## empty

- **详情：** 当前没有页面时，编辑器中间区域

- **默认：** [AddPageBox.vue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/layouts/AddPageBox.vue)

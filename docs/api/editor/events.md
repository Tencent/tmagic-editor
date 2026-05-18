# Editor组件 events

## props-panel-mounted

- **详情：** 编辑器右侧组件属性配置加载完毕后触发

- **事件回调函数：** `(instance: InstanceType<typeof FormPanel>) => void`

  > [`FormPanel.vue`](https://github.com/Tencent/tmagic-editor/blob/master/packages/editor/src/layouts/props-panel/FormPanel.vue) 是属性面板组件实例

## props-panel-unmounted

- **详情：** 编辑器右侧组件属性配置卸载时触发

- **事件回调函数：** () => void

## update:modelValue

- **详情：** 当 [modelValue](./props.md#modelvalue-v-model)(DSL) 变化时触发，配合 `v-model` 使用

- **事件回调函数：** `(value: MApp | null) => void`

  ::: details 查看 MApp 及关联类型定义
  <<< @/../packages/schema/src/index.ts#MApp{ts}

  <<< @/../packages/schema/src/index.ts#MComponent{ts}

  <<< @/../packages/schema/src/index.ts#NodeType{ts}

  <<< @/../packages/schema/src/index.ts#MPage{ts}

  <<< @/../packages/schema/src/index.ts#MPageFragment{ts}

  <<< @/../packages/schema/src/index.ts#CodeBlockDSL{ts}

  <<< @/../packages/schema/src/index.ts#DataSourceSchema{ts}

  <<< @/../packages/schema/src/index.ts#DataSourceDeps{ts}
  :::

## props-form-error

- **详情：** 属性表单校验失败时触发

- **事件回调函数：** (e: any) => void

## props-submit-error

- **详情：** 属性表单提交失败时触发

- **事件回调函数：** (e: any) => void

  注意：`Editor.vue` 中该 emit 的类型签名为 `[e: any]`，运行时通常为 `Error` 实例（来自 `submitForm` 抛错），但也可能是 element-plus 校验返回的 `invalidFields` 结构，业务侧消费时建议先做类型判断

## layer-node-dblclick

- **详情：** "已选组件"面板中组件树节点被双击时触发

  默认行为（切换可展开节点的展开/收起状态）会先于该事件执行；可通过 [`beforeLayerNodeDblclick`](./props.md#beforelayernodedblclick) 钩子拦截，返回 `false` 时该事件不会被触发

- **事件回调函数：** `(event: MouseEvent, data: TreeNodeData) => void`

  ::: details 查看 TreeNodeData 及关联类型定义
  <<< @/../packages/editor/src/type.ts#TreeNodeData{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}
  :::

- **示例：**

```html
<template>
  <m-editor @layer-node-dblclick="onLayerNodeDblclick"></m-editor>
</template>

<script setup>
const onLayerNodeDblclick = (event, data) => {
  console.log('双击节点', data.id, data.type);
};
</script>
```

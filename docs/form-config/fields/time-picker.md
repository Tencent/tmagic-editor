# TimePicker 时间选择器

用于选择或输入日期

## 基础用法

<demo-block type="form" :config="[{
  type: 'time',
  name: 'time',
  text: '时间选择器'
}]">
<template #source>
<p>
在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
</p>
</template>
</demo-block>

## 禁用状态

<demo-block type="form" :config="[{
  type: 'time',
  name: 'time',
  text: '时间选择器',
  disabled: () => true
}]">
<template #source>
<p>
在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
</p>
</template>
</demo-block>

## Attributes

| 参数        | 说明           | 类型                                                                                                                                              | 可选值 | 默认值 |
| ----------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| name        | 绑定值         | string                                                                                                                                            | —      | —      |
| placeholder | 输入框占位文本 | string                                                                                                                                            | —      | —      |
| text        | 表单标签       | string                                                                                                                                            | —      | —      |
| disabled    | 是否禁用       | boolean / `FilterFunction` | —      | false  |

::: details 查看 FilterFunction 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}
:::


## 配置类型

::: details 查看 TimeConfig 配置类型定义
<<< @/../packages/form-schema/src/base.ts#TimeConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

<<< @/../packages/form-schema/src/base.ts#Input{ts}

:::

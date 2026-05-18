# Textarea 文本域

## 基础用法

<demo-block type="form" :config="[{
  type: 'textarea',
  name: 'textarea',
  text: '文本域'
}]">
<template #source>

<p>
在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
</p>
</template>
</demo-block>

## 禁用状态

<demo-block type="form" :config="[{
  type: 'textarea',
  name: 'textarea',
  text: '文本域',
  disabled: () => true
}]">
<template #source>

<p>
通过 disabled 属性指定是否禁用 input 组件
</p>
</template>
</demo-block>

## Input Attributes

| 参数        | 说明               | 类型                                                                                                                                                     | 可选值 | 默认值 |
| ----------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| name        | 绑定值             | string                                                                                                                                                   | —      | —      |
| placeholder | 输入框占位文本     | string                                                                                                                                                   | —      | —      |
| text        | 表单标签           | string                                                                                                                                                   | —      | —      |
| disabled    | 是否禁用           | boolean / `FilterFunction` | —      | false  |
| placeholder | 输入框占位文本     | string                                                                                                                                                   | —      | —      |
| trim        | 是否去掉首尾空格   | boolean                                                                                                                                                  | —      | false  |
| filter      | 过滤值             | string / Function                                                                                                                                        | number | -      |
| onChange    | 值变化时触发的函数 | `OnChangeHandler`          | —      | -      |

::: details 查看 FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 TextareaConfig 配置类型定义
<<< @/../packages/form-schema/src/base.ts#TextareaConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

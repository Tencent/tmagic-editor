# FormDialog组件 props

## config

- **详情：** 表单配置

- **默认值：** `[]`

- **类型：** `FormConfig`

  ::: details 查看 FormConfig 及关联类型定义
  <<< @/../packages/form-schema/src/base.ts#FormConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#FormItemConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#ChildConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#DynamicTypeConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#FormItem{ts}
  :::

- **示例：**

```html
<template>
  <m-form-dialog :config="config"></m-form-dialog>
</template>

<script setup>
  import { ref } from "Vue";

  const config = ref([
    {
      name: "text",
      text: "文本",
    },
    {
      name: "multiple",
      text: "多行文本",
      type: "switch",
    },
  ]);
</script>
```

## values

- **详情：** 表单初始化值

- **默认值：** `{}`

- **类型：** `Object`

- **示例：**

```html
<template>
  <m-form-dialog :values="values"></m-form-dialog>
</template>

<script setup>
  import { ref } from 'Vue';

  const values = ref([
    text: 'text',
    multiply: true,
  ]);
</script>
```

## parentValues

- **详情：** 父级表单值，会透传给内部 Form 组件

- **类型：** `Object`

## width

- **详情：** 弹窗宽度

- **类型：** `string | number`

## labelWidth

- **详情：**

表单域标签的宽度，例如 '50px'。 作为 Form 直接子元素的 form-item 会继承该值。 支持 auto。

- **默认值：** `'200px'`

- **类型：** `string`

## fullscreen

- **详情：** 是否全屏。
- **默认值：** false

- **类型：** `boolean`

## disabled

- **详情：** 是否禁用该表单内的所有组件。 若设置为 true，则表单内组件上的 disabled 属性不再生效。

- **默认值：** false

- **类型：** `boolean`

## inline

- **详情：** 行内表单模式

- **类型：** `boolean`

## labelPosition

- **详情：** 表单域标签的位置， 当设置为 left 或 right 时，则也需要设置 label-width 属性

- **类型：** `string`

## zIndex

- **详情：** 弹窗的 z-index

- **类型：** `number`

## title

- **详情：** 弹出标题

- **类型：** `string`

## size

- **详情：** 用于控制该表单内组件的尺寸

- **类型：** `'small' | 'default' | 'large'`

## confirmText

- **详情：** 提交按钮文案

- **默认值：** `'确定'`

- **类型：** `string`

## preventSubmitDefault

- **详情：** 是否阻止内部 Form 原生 submit 事件的默认行为

- **类型：** `boolean`

## useFieldTextInError

- **详情：** 透传给内部 `Form`，控制表单校验失败时错误提示前缀是否使用字段的 `text` 文案。`false` 时直接使用字段 `name`

- **默认值：** `true`

- **类型：** `boolean`

## closeOnClickModal

- **详情：** 是否可以通过点击 modal 关闭 Dialog

- **默认值：** `false`

- **类型：** `boolean`

## closeOnPressEscape

- **详情：** 是否可以通过按下 ESC 关闭 Dialog

- **默认值：** `false`

- **类型：** `boolean`

## destroyOnClose

- **详情：** 关闭时销毁 Dialog 中的元素

- **默认值：** `false`

- **类型：** `boolean`

## showClose

- **详情：** 是否显示关闭按钮

- **默认值：** `true`

- **类型：** `boolean`

## showCancel

- **详情：** 是否显示底部取消按钮

- **默认值：** `true`

- **类型：** `boolean`

# FormDialog组件 props

## config

- **详情：**  表单配置

- **默认值：** `[]`

- **类型：** [FormConfig](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/form/src/schema.ts#L706)

- **示例：**
  
```html
<template>
  <m-form-dialog :config="config"></m-form-dialog>
</template>

<script setup>
import { ref } from 'Vue';

const config = ref([
  {
    name: 'text',
    text: '文本',
  },
  {
    name: 'multiple',
    text: '多行文本',
    type: 'switch',
  },
]);
</script>
```

## values

- **详情：**  表单初始化值

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

## width

- **详情：** 弹窗宽度

- **类型：** `string | number`

## labelWidth

- **详情：** 

表单域标签的宽度，例如 '50px'。 作为 Form 直接子元素的 form-item 会继承该值。 支持 auto

- **默认值：** `'200px'`

- **类型：** `string | number`

## fullscreen

- **详情：** 弹出是否全屏
  
- **默认值：** false

- **类型：** boolean

## disabled

- **详情：** 是否禁用该表单内的所有组件。 若设置为 true，则表单内组件上的 disabled 属性不再生效

- **默认值：** false

- **类型：**  `boolean`

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

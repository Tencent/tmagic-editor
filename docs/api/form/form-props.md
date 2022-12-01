# Form组件属性 props

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

## initValues

- **详情：**  表单初始化值

- **默认值：** `{}`

- **类型：** `Object`

- **示例：**
  
```html
<template>
  <m-form-dialog :init-values="initValues"></m-form-dialog>
</template>

<script setup>
import { ref } from 'Vue';

const initValues = ref([
  text: 'text',
  multiply: true,
]);
</script>
```

## labelWidth

- **详情：** 

表单域标签的宽度，例如 '50px'。 作为 Form 直接子元素的 form-item 会继承该值。 支持 auto

- **默认值：** `'200px'`

- **类型：** `string | number`

## disabled

- **详情：** 是否禁用该表单内的所有组件。 若设置为 true，则表单内组件上的 disabled 属性不再生效

- **默认值：** false

- **类型：**  `boolean`

## height

- **详情：**
  
  

- **默认值：** 



- **类型：** 

## stepActive

- **详情：**
  
  

- **默认值：** 



- **类型：** 

## size

- **详情：** 用于控制该表单内组件的尺寸

- **类型：** `'small' | 'default' | 'large'`


## inline

- **详情：** 行内表单模式	

- **默认值：** false

- **类型：** `boolean`

## labelPosition

- **详情：** 表单域标签的位置， 当设置为 left 或 right 时，则也需要设置 label-width 属性
  
- **默认值：**  ’right'

- **类型：** `'left' | 'right' | 'top`

## keyProp

- **详情：** 作为表单项的组件实例的key

- **默认值：** `'__key'`

- **类型：** `string`

## popperClass

- **详情：** tooltip弹出层的class

- **类型：** `string`

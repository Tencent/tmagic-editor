# Input 输入框

通过鼠标或键盘输入字符

## 基础用法

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框'
}]">
<template #source>

<p>
Input输入框的type为'text', 是type的默认值，所以可以不配置
</p>
</template>
</demo-block>

## 禁用状态

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  disabled: () => true
}]">
<template #source>

<p>
通过 disabled 属性指定是否禁用 input 组件
</p>
</template>
</demo-block>

## 复合型输入框

后置内容

<demo-block type="form" :config="[{
  name: 'text',
  text: '重量',
  append: '公斤'
}]">
<template #source>

<p>
可以通过配置append来增加一个后置内容。
</p>
</template>
</demo-block>

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  append: {
    type: 'button',
    text: '操作',
    handler: (mForm, { model, values, formValue, setModel, setFormValue }) => {
      // 处理逻辑
    }
  }
}]">
<template #source>

<p>
可以通过配置append来增加一个后置按钮。
</p>
</template>
</demo-block>

## 过滤内容

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  filter: 'number'
}]">
<template #source>

<p>
设置filter为'number'，可以将值转换成数值，也可以配置一个函数来自由转换。
</p>
</template>
</demo-block>

## 去掉首尾空格

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  trim: true
}]">
<template #source>

<p>
设置trim为true'，可以去掉首尾空格。
</p>
</template>
</demo-block>

## 显示详情

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  tooltip: true
}]">
<template #source>

<p>
通过配置 tooltip，在输入时显示提示内容。
</p>
</template>
</demo-block>

## Input Attributes

| 参数        | 说明               | 类型                                                                                                                                                      | 可选值 | 默认值 |
| ----------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| name        | 绑定值             | string                                                                                                                                                    | —      | —      |
| text        | 表单标签           | string                                                                                                                                                    | —      | —      |
| placeholder | 输入框占位文本     | string                                                                                                                                                    | —      | —      |
| disabled    | 是否禁用           | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/form-schema/src/base.ts#L195)  | —      | false  |
| clearable   | 是否可清空         | boolean                                                                                                                                                   | —      | true   |
| tooltip     | 输入时显示内容     | string / [ToolTipConfigType](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/form-schema/src/base.ts#L90) | —      | —      |
| trim        | 是否去掉首尾空格   | boolean                                                                                                                                                   | —      | false  |
| filter      | 过滤值             | string / Function                                                                                                                                         | number | -      |
| prepend     | 前置内容           | string                                                                                                                                                    | —      | -      |
| append      | 后置内容           | string / Object                                                                                                                                           | —      | -      |
| onChange    | 值变化时触发的函数 | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/form-schema/src/base.ts#L30)            | —      | -      |

## append Attributes

| 参数    | 说明     | 类型     | 可选值 | 默认值 |
| ------- | -------- | -------- | ------ | ------ |
| type    | 内容类型 | string   | button | —      |
| text    | 文本内容 | string   | —      | —      |
| handler | 点击操作 | Function | —      | -      |

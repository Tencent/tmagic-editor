# NumberRange 数字范围输入框

用于输入数字范围

## 基础用法

<demo-block type="form" :config="[{
  type: 'number-range',
  name: 'numberRange',
  text: '数字范围'
}]">
<template #source>

<p>
type为'number-range'
</p>
</template>
</demo-block>

## Attributes

| 参数      | 说明                          | 类型                                                                                                                                                     | 可选值 | 默认值 |
| --------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| name      | 绑定值（数组形式 [min, max]） | string                                                                                                                                                   | —      | —      |
| text      | 表单标签                      | string                                                                                                                                                   | —      | —      |
| disabled  | 是否禁用                      | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/form-schema/src/base.ts#L195) | —      | false  |
| clearable | 是否可清空                    | boolean                                                                                                                                                  | —      | true   |
| onChange  | 值变化时触发的函数            | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/form-schema/src/base.ts#L30)           | —      | -      |

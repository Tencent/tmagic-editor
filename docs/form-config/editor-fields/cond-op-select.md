# CondOpSelect 条件操作选择器

用于选择条件操作符的选择器。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'cond-op-select',
  name: 'op',
  text: '操作符'
}
```

## 指定父级字段

```js
{
  type: 'cond-op-select',
  name: 'op',
  text: '操作符',
  parentFields: ['field1', 'field2']
}
```

## Attributes

| 参数         | 说明               | 类型                                                                                                                                                     | 可选值 | 默认值 |
| ------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| name         | 绑定值             | string                                                                                                                                                   | —      | —      |
| text         | 表单标签           | string                                                                                                                                                   | —      | —      |
| disabled     | 是否禁用           | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/form-schema/src/base.ts#L195) | —      | false  |
| parentFields | 父级字段           | string[]                                                                                                                                                 | —      | —      |
| onChange     | 值变化时触发的函数 | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/form-schema/src/base.ts#L30)           | —      | -      |

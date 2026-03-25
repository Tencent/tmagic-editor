# DisplayConds 显示条件配置

用于配置组件显示条件的表单组件。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'display-conds',
  name: 'displayConds',
  text: '显示条件'
}
```

## 带标题前缀

```js
{
  type: 'display-conds',
  name: 'displayConds',
  text: '显示条件',
  titlePrefix: '条件'
}
```

## Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| titlePrefix  | 标题前缀    | string   | — | —   |
| parentFields  | 父级字段    | string[] / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | —   |
| onChange  | 值变化时触发的函数  | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |

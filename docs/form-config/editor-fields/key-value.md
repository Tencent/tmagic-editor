# KeyValue 键值对

用于配置键值对数据的表单组件。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'key-value',
  name: 'params',
  text: '参数'
}
```

## 高级模式

设置 `advanced` 为 `true`，可切换到代码编辑模式。

```js
{
  type: 'key-value',
  name: 'params',
  text: '参数',
  advanced: true
}
```

## Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| advanced  | 是否支持高级模式（代码编辑）    | boolean   | — | false   |
| onChange  | 值变化时触发的函数  | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |

# Code 代码编辑器

代码编辑器字段，用于编辑代码内容。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'code',
  name: 'code',
  text: '代码'
}
```

## 指定语言

```js
{
  type: 'code',
  name: 'code',
  text: '代码',
  language: 'javascript'
}
```

## 自动调整大小

```js
{
  type: 'code',
  name: 'code',
  text: '代码',
  autosize: {
    minRows: 3,
    maxRows: 10
  }
}
```

## Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| language  | 代码语言    | string   | javascript/typescript/json等 | —   |
| height  | 编辑器高度    | string   | — | —   |
| parse  | 是否解析代码    | boolean   | — | false   |
| options  | 编辑器配置项    | object   | — | —   |
| autosize  | 自动调整大小配置    | object   | — | —   |
| onChange  | 值变化时触发的函数  | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |

## autosize Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| minRows | 最小行数 | number | — | — |
| maxRows | 最大行数 | number | — | — |

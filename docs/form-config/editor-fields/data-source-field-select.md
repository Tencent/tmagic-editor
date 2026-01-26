# DataSourceFieldSelect 数据源字段选择器

用于选择数据源字段的级联选择器。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'data-source-field-select',
  name: 'field',
  text: '数据源字段'
}
```

## 返回字段key

```js
{
  type: 'data-source-field-select',
  name: 'field',
  text: '数据源字段',
  value: 'key'
}
```

## 限制字段类型

```js
{
  type: 'data-source-field-select',
  name: 'field',
  text: '数据源字段',
  dataSourceFieldType: ['string', 'number']
}
```

## 父子节点不关联

```js
{
  type: 'data-source-field-select',
  name: 'field',
  text: '数据源字段',
  checkStrictly: true
}
```

## Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| value  | 返回值类型    | string   | key/value | —   |
| checkStrictly  | 是否严格遵守父子节点不互相关联    | boolean / Function   | — | —   |
| dataSourceFieldType  | 允许选择的字段类型    | DataSourceFieldType[]   | — | —   |
| fieldConfig  | 自定义字段配置    | ChildConfig   | — | —   |
| notEditable  | 是否不可编辑数据源（disable控制是否可选择）    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| onChange  | 值变化时触发的函数  | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |

## value说明
- `key`: 不编译，返回数据源id和字段name
- `value`: 编译后返回数据源data[field]

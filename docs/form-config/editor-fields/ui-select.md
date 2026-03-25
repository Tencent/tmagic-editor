# UISelect 组件选择器

用于在画布中选择组件的选择器。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'ui-select',
  name: 'targetId',
  text: '目标组件'
}
```

## Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| onChange  | 值变化时触发的函数  | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |

## 使用说明

1. 点击"点击此处选择"按钮进入选择模式
2. 在画布中点击目标组件完成选择
3. 选择后会显示组件名称和ID
4. 可通过清除按钮清空选择
5. 点击组件名称可跳转到对应组件

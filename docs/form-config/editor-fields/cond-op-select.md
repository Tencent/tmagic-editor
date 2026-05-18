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
| disabled     | 是否禁用           | boolean / `FilterFunction` | —      | false  |
| parentFields | 父级字段           | string[]                                                                                                                                                 | —      | —      |
| onChange     | 值变化时触发的函数 | `OnChangeHandler`           | —      | -      |

::: details 查看 FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 CondOpSelectConfig 配置类型定义
<<< @/../packages/form-schema/src/editor.ts#CondOpSelectConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

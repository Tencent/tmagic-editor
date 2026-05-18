# DataSourceMethodSelect 数据源方法选择器

用于选择数据源方法的选择器。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'data-source-method-select',
  name: 'method',
  text: '数据源方法'
}
```

## 禁止编辑

```js
{
  type: 'data-source-method-select',
  name: 'method',
  text: '数据源方法',
  notEditable: true
}
```

## Attributes

| 参数        | 说明                                        | 类型                                                                                                                                                     | 可选值 | 默认值 |
| ----------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| name        | 绑定值                                      | string                                                                                                                                                   | —      | —      |
| text        | 表单标签                                    | string                                                                                                                                                   | —      | —      |
| disabled    | 是否禁用                                    | boolean / `FilterFunction` | —      | false  |
| notEditable | 是否不可编辑数据源（disable控制是否可选择） | boolean / `FilterFunction` | —      | false  |
| onChange    | 值变化时触发的函数                          | `OnChangeHandler`           | —      | -      |

::: details 查看 FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 DataSourceMethodSelectConfig 配置类型定义
<<< @/../packages/form-schema/src/editor.ts#DataSourceMethodSelectConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

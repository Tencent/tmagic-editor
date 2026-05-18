# DataSourceSelect 数据源选择器

用于选择数据源的下拉选择器。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'data-source-select',
  name: 'dataSource',
  text: '数据源'
}
```

## 过滤数据源类型

```js
{
  type: 'data-source-select',
  name: 'dataSource',
  text: '数据源',
  dataSourceType: 'http'
}
```

## 返回数据源ID

```js
{
  type: 'data-source-select',
  name: 'dataSource',
  text: '数据源',
  value: 'id'
}
```

## Attributes

| 参数           | 说明                                        | 类型                                                                                                                                                     | 可选值      | 默认值 |
| -------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ |
| name           | 绑定值                                      | string                                                                                                                                                   | —           | —      |
| text           | 表单标签                                    | string                                                                                                                                                   | —           | —      |
| placeholder    | 输入框占位文本                              | string                                                                                                                                                   | —           | —      |
| disabled       | 是否禁用                                    | boolean / `FilterFunction` | —           | false  |
| dataSourceType | 数据源类型过滤                              | string                                                                                                                                                   | base/http等 | —      |
| value          | 返回值类型                                  | string                                                                                                                                                   | id/value    | —      |
| notEditable    | 是否不可编辑数据源（disable控制是否可选择） | boolean / `FilterFunction` | —           | false  |
| onChange       | 值变化时触发的函数                          | `OnChangeHandler`           | —           | -      |

::: details 查看 FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 DataSourceSelect 配置类型定义
<<< @/../packages/form-schema/src/editor.ts#DataSourceSelect{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

<<< @/../packages/form-schema/src/base.ts#Input{ts}

:::

## value说明

- `id`: 不编译，返回数据源id
- `value`: 编译后返回数据源data

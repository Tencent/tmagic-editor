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

## 值校验

安装 `@tmagic/editor` 后该字段会自动注册内置 `typeMatch` 校验规则：须为数据源路径 `string[]`，有 `fieldConfig` 且非路径值时跳过。服务数据未就绪时仅做基础形态校验。详见[表单校验 - Editor 字段内置规则](/form-config/rules.md#editor-字段内置规则)。

## Attributes

| 参数                | 说明                                        | 类型                                                                                                                                                     | 可选值    | 默认值 |
| ------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| name                | 绑定值                                      | string                                                                                                                                                   | —         | —      |
| text                | 表单标签                                    | string                                                                                                                                                   | —         | —      |
| disabled            | 是否禁用                                    | boolean / `FilterFunction` | —         | false  |
| value               | 返回值类型                                  | string                                                                                                                                                   | key/value | —      |
| checkStrictly       | 是否严格遵守父子节点不互相关联              | boolean / Function                                                                                                                                       | —         | —      |
| dataSourceFieldType | 允许选择的字段类型                          | DataSourceFieldType[]                                                                                                                                    | —         | —      |
| fieldConfig         | 自定义字段配置                              | ChildConfig                                                                                                                                              | —         | —      |
| notEditable         | 是否不可编辑数据源（disable控制是否可选择） | boolean / `FilterFunction` | —         | false  |
| onChange            | 值变化时触发的函数                          | `OnChangeHandler`           | —         | -      |

::: details 查看 FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 DataSourceFieldSelectConfig 配置类型定义
<<< @/../packages/form-schema/src/editor.ts#DataSourceFieldSelectConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

## value说明

- `key`: 不编译，返回数据源id和字段name
- `value`: 编译后返回数据源data[field]

# EventSelect 事件选择器

用于配置组件或数据源事件的选择器。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'event-select',
  name: 'events',
  text: '事件配置',
  src: 'component'
}
```

## 数据源事件

```js
{
  type: 'event-select',
  name: 'events',
  text: '事件配置',
  src: 'datasource'
}
```

## Attributes

| 参数                   | 说明               | 类型                                                                                                                                                     | 可选值               | 默认值 |
| ---------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------ |
| name                   | 绑定值             | string                                                                                                                                                   | —                    | —      |
| text                   | 表单标签           | string                                                                                                                                                   | —                    | —      |
| disabled               | 是否禁用           | boolean / `FilterFunction` | —                    | false  |
| src                    | 事件来源           | string                                                                                                                                                   | datasource/component | —      |
| labelWidth             | 标签宽度           | string                                                                                                                                                   | —                    | —      |
| eventNameConfig        | 事件名称表单配置   | FormItem                                                                                                                                                 | —                    | —      |
| actionTypeConfig       | 动作类型配置       | FormItem                                                                                                                                                 | —                    | —      |
| targetCompConfig       | 联动组件配置       | FormItem                                                                                                                                                 | —                    | —      |
| compActionConfig       | 联动组件动作配置   | FormItem                                                                                                                                                 | —                    | —      |
| codeActionConfig       | 联动代码配置       | FormItem                                                                                                                                                 | —                    | —      |
| dataSourceActionConfig | 联动数据源配置     | FormItem                                                                                                                                                 | —                    | —      |
| onChange               | 值变化时触发的函数 | `OnChangeHandler`           | —                    | -      |

::: details 查看 FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 EventSelectConfig 配置类型定义
<<< @/../packages/form-schema/src/editor.ts#EventSelectConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

## src说明

- `component`: 组件事件
- `datasource`: 数据源事件

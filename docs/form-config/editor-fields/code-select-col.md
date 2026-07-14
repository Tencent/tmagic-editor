# CodeSelectCol 代码块选择列

代码块选择器的列组件，支持选择代码块并配置参数。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'code-select-col',
  name: 'codeId',
  text: '代码块'
}
```

## 禁止编辑

```js
{
  type: 'code-select-col',
  name: 'codeId',
  text: '代码块',
  notEditable: true
}
```

## 值校验

安装 `@tmagic/editor` 后该字段会自动注册内置 `typeMatch` 校验规则：要求 `string`，有代码块 DSL 时须为已有 codeId。服务数据未就绪时仅做基础形态校验。详见[表单校验 - Editor 字段内置规则](/form-config/rules.md#editor-字段内置规则)。

## Attributes

| 参数        | 说明                                        | 类型                                                                                                                                                     | 可选值 | 默认值 |
| ----------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| name        | 绑定值                                      | string                                                                                                                                                   | —      | —      |
| text        | 表单标签                                    | string                                                                                                                                                   | —      | —      |
| disabled    | 是否禁用                                    | boolean / `FilterFunction` | —      | false  |
| notEditable | 是否不可编辑代码块（disable控制是否可选择） | boolean / `FilterFunction` | —      | false  |
| onChange    | 值变化时触发的函数                          | `OnChangeHandler`           | —      | -      |

::: details 查看 FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 CodeSelectColConfig 配置类型定义
<<< @/../packages/form-schema/src/editor.ts#CodeSelectColConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

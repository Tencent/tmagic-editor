# CodeSelect 代码块选择器

用于选择代码块并配置参数的组件。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'code-select',
  name: 'codeSelect',
  text: '代码块'
}
```

## 功能说明

CodeSelect 组件支持：

- 选择代码块
- 选择数据源方法
- 配置代码块参数

## 值校验

安装 `@tmagic/editor` 后该字段会自动注册内置 `typeMatch` 校验规则：做 `{ hookType: 'code', hookData }` 的浅层结构校验，`codeId` / 数据源方法存在性由内部单元格各自校验。服务数据未就绪时仅做基础形态校验。详见[表单校验 - Editor 字段内置规则](/form-config/rules.md#editor-字段内置规则)。

## Attributes

| 参数      | 说明               | 类型                                                                                                                                                     | 可选值 | 默认值 |
| --------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| name      | 绑定值             | string                                                                                                                                                   | —      | —      |
| text      | 表单标签           | string                                                                                                                                                   | —      | —      |
| disabled  | 是否禁用           | boolean / `FilterFunction` | —      | false  |
| className | 自定义类名         | string                                                                                                                                                   | —      | —      |
| onChange  | 值变化时触发的函数 | `OnChangeHandler`           | —      | -      |

::: details 查看 FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 CodeSelectConfig 配置类型定义
<<< @/../packages/form-schema/src/editor.ts#CodeSelectConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

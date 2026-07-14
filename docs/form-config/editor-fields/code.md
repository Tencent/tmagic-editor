# Code 代码编辑器

代码编辑器字段，用于编辑代码内容。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'vs-code',
  name: 'code',
  text: '代码'
}
```

## 指定语言

```js
{
  type: 'vs-code',
  name: 'code',
  text: '代码',
  language: 'javascript'
}
```

## 自动调整大小

```js
{
  type: 'vs-code',
  name: 'code',
  text: '代码',
  autosize: {
    minRows: 3,
    maxRows: 10
  }
}
```

## 值校验

安装 `@tmagic/editor` 后该字段会自动注册内置 `typeMatch` 校验规则：默认要求 `string`，`parse: true` 时跳过校验。详见[表单校验 - Editor 字段内置规则](/form-config/rules.md#editor-字段内置规则)。

## Attributes

| 参数          | 说明                       | 类型                                                                                                                                                     | 可选值                       | 默认值 |
| ------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------ |
| name          | 绑定值                     | string                                                                                                                                                   | —                            | —      |
| text          | 表单标签                   | string                                                                                                                                                   | —                            | —      |
| disabled      | 是否禁用                   | boolean / `FilterFunction` | —                            | false  |
| language      | 代码语言                   | string                                                                                                                                                   | javascript/typescript/json等 | —      |
| height        | 编辑器高度                 | string                                                                                                                                                   | —                            | —      |
| parse         | 是否解析代码               | boolean                                                                                                                                                  | —                            | false  |
| options       | 编辑器配置项               | object                                                                                                                                                   | —                            | —      |
| autosize      | 自动调整大小配置           | object                                                                                                                                                   | —                            | —      |
| mFormItemType | 传入代码编辑器的自定义类型 | string                                                                                                                                                   | —                            | —      |
| onChange      | 值变化时触发的函数         | `OnChangeHandler`           | —                            | -      |

::: details 查看 FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 CodeConfig 配置类型定义
<<< @/../packages/form-schema/src/editor.ts#CodeConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

## autosize Attributes

| 参数    | 说明     | 类型   | 可选值 | 默认值 |
| ------- | -------- | ------ | ------ | ------ |
| minRows | 最小行数 | number | —      | —      |
| maxRows | 最大行数 | number | —      | —      |

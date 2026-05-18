# CodeLink 代码链接

通过弹窗链接的方式编辑代码内容。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'code-link',
  name: 'codeLink',
  text: '代码配置'
}
```

## 自定义弹窗标题

```js
{
  type: 'code-link',
  name: 'codeLink',
  text: '代码配置',
  formTitle: '编辑代码'
}
```

## Attributes

| 参数        | 说明               | 类型                                                                                                                                                     | 可选值 | 默认值 |
| ----------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| name        | 绑定值             | string                                                                                                                                                   | —      | —      |
| text        | 表单标签           | string                                                                                                                                                   | —      | —      |
| disabled    | 是否禁用           | boolean / `FilterFunction` | —      | false  |
| formTitle   | 弹窗标题           | string                                                                                                                                                   | —      | —      |
| codeOptions | 代码编辑器配置项   | object                                                                                                                                                   | —      | —      |
| onChange    | 值变化时触发的函数 | `OnChangeHandler`           | —      | -      |

::: details 查看 FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 CodeLinkConfig 配置类型定义
<<< @/../packages/form-schema/src/editor.ts#CodeLinkConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

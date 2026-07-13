# Input 输入框

通过鼠标或键盘输入字符

## 基础用法

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框'
}]">
<template #source>

<p>
Input输入框的type为'text', 是type的默认值，所以可以不配置
</p>
</template>
</demo-block>

## 禁用状态

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  disabled: () => true
}]">
<template #source>

<p>
通过 disabled 属性指定是否禁用 input 组件
</p>
</template>
</demo-block>

## 复合型输入框

后置内容

<demo-block type="form" :config="[{
  name: 'text',
  text: '重量',
  append: '公斤'
}]">
<template #source>

<p>
可以通过配置append来增加一个后置内容。
</p>
</template>
</demo-block>

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  append: {
    type: 'button',
    text: '操作',
    handler: (mForm, { model, values, formValue, setModel, setFormValue }) => {
      // 处理逻辑
    }
  }
}]">
<template #source>

<p>
可以通过配置append来增加一个后置按钮。
</p>
</template>
</demo-block>

## 过滤内容

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  filter: 'number'
}]">
<template #source>

<p>
设置filter为'number'，可以将值转换成数值，也可以配置一个函数来自由转换。
</p>
</template>
</demo-block>

## 表单校验

可通过 `rules` 配置校验规则。其中 `typeMatch: true` 会按字段 type（以及 `filter` / `valueFormat` 等）校验值是否合法，详见[表单校验](/form-config/rules.md)。

```ts
{
  name: 'text',
  text: '输入框',
  rules: [
    { required: true, message: '请输入' },
    { typeMatch: true, message: '值类型不合法' },
  ],
}
```

## 去掉首尾空格

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  trim: true
}]">
<template #source>

<p>
设置trim为true'，可以去掉首尾空格。
</p>
</template>
</demo-block>

## 显示详情

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  tooltip: true
}]">
<template #source>

<p>
通过配置 tooltip，在输入时显示提示内容。
</p>
</template>
</demo-block>

## Input Attributes

| 参数        | 说明               | 类型                                                                                                                                                      | 可选值 | 默认值 |
| ----------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| name        | 绑定值             | string                                                                                                                                                    | —      | —      |
| text        | 表单标签           | string                                                                                                                                                    | —      | —      |
| placeholder | 输入框占位文本     | string                                                                                                                                                    | —      | —      |
| disabled    | 是否禁用           | boolean / `FilterFunction`  | —      | false  |
| clearable   | 是否可清空         | boolean                                                                                                                                                   | —      | true   |
| tooltip     | 输入时显示内容     | string / `ToolTipConfigType` | —      | —      |
| trim        | 是否去掉首尾空格   | boolean                                                                                                                                                   | —      | false  |
| filter      | 过滤值             | string / Function                                                                                                                                         | number | -      |
| rules       | 表单验证规则       | `Rule[]`                                                                                                                                                  | —      | —      |
| prepend     | 前置内容           | string                                                                                                                                                    | —      | -      |
| append      | 后置内容           | string / Object                                                                                                                                           | —      | -      |
| onChange    | 值变化时触发的函数 | `OnChangeHandler`            | —      | -      |

::: details 查看 FilterFunction / OnChangeHandler / ToolTipConfigType 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}

<<< @/../packages/form-schema/src/base.ts#ToolTipConfigType{ts}

<<< @/../packages/form-schema/src/base.ts#Rule{ts}
:::


## 配置类型

::: details 查看 TextConfig 配置类型定义
<<< @/../packages/form-schema/src/base.ts#TextConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

<<< @/../packages/form-schema/src/base.ts#Input{ts}

:::

## append Attributes

| 参数    | 说明     | 类型     | 可选值 | 默认值 |
| ------- | -------- | -------- | ------ | ------ |
| type    | 内容类型 | string   | button | —      |
| text    | 文本内容 | string   | —      | —      |
| handler | 点击操作 | Function | —      | -      |

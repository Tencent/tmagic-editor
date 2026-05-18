# NumberRange 数字范围输入框

用于输入数字范围

## 基础用法

<demo-block type="form" :config="[{
  type: 'number-range',
  name: 'numberRange',
  text: '数字范围'
}]">
<template #source>

<p>
type为'number-range'
</p>
</template>
</demo-block>

## Attributes

| 参数      | 说明                          | 类型                                                                                                                                                     | 可选值 | 默认值 |
| --------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| name      | 绑定值（数组形式 [min, max]） | string                                                                                                                                                   | —      | —      |
| text      | 表单标签                      | string                                                                                                                                                   | —      | —      |
| disabled  | 是否禁用                      | boolean / `FilterFunction` | —      | false  |
| clearable | 是否可清空                    | boolean                                                                                                                                                  | —      | true   |
| onChange  | 值变化时触发的函数            | `OnChangeHandler`           | —      | -      |

::: details 查看 FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 NumberRangeConfig 配置类型定义
<<< @/../packages/form-schema/src/base.ts#NumberRangeConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

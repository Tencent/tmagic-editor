# Display 只读文本

用于显示，不可编辑

## 基础用法

<demo-block type="form" :config="[{
  type: 'display',
  name: 'display',
  text: '只读文本',
  defaultValue: 'display'
}]">
<template #source>
<p>
在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
</p>
</template>
</demo-block>

## Input Attributes

| 参数 | 说明     | 类型   | 可选值 | 默认值 |
| ---- | -------- | ------ | ------ | ------ |
| name | 绑定值   | string | —      | —      |
| text | 表单标签 | string | —      | —      |

## 配置类型

::: details 查看 DisplayConfig 配置类型定义
<<< @/../packages/form-schema/src/base.ts#DisplayConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

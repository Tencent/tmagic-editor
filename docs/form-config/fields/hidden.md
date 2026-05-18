# Hidden 隐藏域

改值体现于最终提交的表单中，用于例如编辑记录的id这种场景中

## 基础用法

<demo-block type="form" :config="[{
  type: 'hidden',
  name: 'hidden'
}]">
<template #source>
<p>
在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
</p>
</template>
</demo-block>

## Input Attributes

| 参数 | 说明   | 类型   | 可选值 | 默认值 |
| ---- | ------ | ------ | ------ | ------ |
| name | 绑定值 | string | —      | —      |

## 配置类型

::: details 查看 HiddenConfig 配置类型定义
<<< @/../packages/form-schema/src/base.ts#HiddenConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

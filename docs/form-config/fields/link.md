# Link 链接

用于显示，不可编辑

## 基础用法

<demo-block type="form" :config="[{
  type: 'link',
  name: 'link',
  text: '链接',
  href: 'https://tencent.github.io/tmagic-editor/playground/index.html#/'
}]">
<template #source>
<p>
通过配置 href，点击链接可跳转到指定地址。
</p>
</template>
</demo-block>

## 打开表单

<demo-block type="form" :config="[{
  type: 'link',
  name: 'link',
  text: '链接',
  form: [{
    name: 'text',
    text: 'input'
  }]
}]">
<template #source>
<p>
通过配置 form，点击链接打开一个弹窗表单进行编辑。
</p>
</template>
</demo-block>

## Input Attributes

| 参数 | 说明     | 类型   | 可选值 | 默认值 |
| ---- | -------- | ------ | ------ | ------ |
| name | 绑定值   | string | —      | —      |
| text | 表单标签 | string | —      | —      |

## 配置类型

::: details 查看 LinkConfig 配置类型定义
<<< @/../packages/form-schema/src/base.ts#LinkConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

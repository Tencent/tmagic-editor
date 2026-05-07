# Link 链接

用于显示，不可编辑

## TS 定义

```typescript
interface Link extends FormItem {
  type: "link";
  href?: string | typeof LinkHrefFunction;
  css?: {
    [key: string]: string | number;
  };
  disabledCss?: {
    [key: string]: string | number;
  };
  formTitle?: string;
  formWidth?: number | string;
  displayText?: string | typeof LinkDisplayTextFunction;
  form: FormConfig | typeof LinkFormFunction;
  fullscreen?: boolean;
}
```

点击查看[FormItem](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/form-schema/src/base.ts#L90)的定义

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

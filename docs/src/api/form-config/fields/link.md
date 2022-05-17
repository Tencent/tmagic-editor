# Link 链接

用于显示，不可编辑

## TS 定义

```typescript
interface Link extends FormItem {
  type: 'link';
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
}
```

点击查看[FormItem](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)的定义

## 基础用法

<demo-block type="form" :config="[{
  type: 'link',
  name: 'link',
  text: '链接',
  href: 'https://tencent.github.io/tmagic-editor/playground/index.html#/'
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
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
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>


## Input Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |

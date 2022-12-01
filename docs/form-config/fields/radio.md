# Radio 单选框

在一组备选项中进行单选

## TS 定义

```typescript
interface RedioGroup extends FormItem {
  type: 'redioGroup';
  options: {
    value: any;
    text: string;
  }[];
}
```

点击查看[FormItem](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)的定义

## 基础用法

由于选项默认可见，不宜过多，若选项过多，建议使用 Select 选择器。

<demo-block type="form" :config="[{
  type: 'radio-group',
  name: 'radio',
  text: '选项',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ]
}]">
  <template #source>
    <p>
      要使用 Radio 组件，只需要配置type: 'radio-group'。
    </p>
  </template>
</demo-block>

## 禁用状态

单选框不可用的状态。

<demo-block type="form" :config="[{
  type: 'radio-group',
  name: 'radio',
  text: '选项',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ],
  disabled: () => true
}]">
  <template #source>
    <p>
      只要在配置中设置 disabled 属性即可，它接受一个 Boolean ， true 为禁用，也可以接受一个返回 Boolean 的函数。
    </p>
  </template>
</demo-block>

## RadioGroup Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)    | — | false   |
| options  | 选项  | Array   | — | -   |
| onChange  | 值变化时触发的函数  | [OnChangeHandler ](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)    | — | -   |

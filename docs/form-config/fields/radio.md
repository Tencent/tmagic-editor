# Radio 单选框

在一组备选项中进行单选

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

| 参数      | 说明               | 类型                                                                                                                                                     | 可选值           | 默认值  |
| --------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------- |
| name      | 绑定值             | string                                                                                                                                                   | —                | —       |
| text      | 表单标签           | string                                                                                                                                                   | —                | —       |
| disabled  | 是否禁用           | boolean / `FilterFunction` | —                | false   |
| childType | 子项展示形式       | string                                                                                                                                                   | default / button | default |
| options   | 选项               | Array                                                                                                                                                    | —                | -       |
| onChange  | 值变化时触发的函数 | `OnChangeHandler`          | —                | -       |

::: details 查看 FormItem / FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 RadioGroupConfig 配置类型定义
<<< @/../packages/form-schema/src/base.ts#RadioGroupConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

## options item

| 参数    | 说明                     | 类型                      | 可选值 | 默认值 |
| ------- | ------------------------ | ------------------------- | ------ | ------ |
| value   | 选项的值                 | string / number / boolean | —      | —      |
| text    | 选项的标签               | string                    | —      | —      |
| icon    | 选项的图标组件           | any                       | —      | —      |
| tooltip | 鼠标悬停时显示的提示内容 | string                    | —      | —      |

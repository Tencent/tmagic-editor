# Form组件属性 props

## config

- **详情：** 表单配置

- **默认值：** `[]`

- **类型：** `FormConfig`

  ::: details 查看 FormConfig 及关联类型定义
  <<< @/../packages/form-schema/src/base.ts#FormConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#FormItemConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#ChildConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#DynamicTypeConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#FormItem{ts}
  :::

- **示例：**

```html
<template>
  <m-form-dialog :config="config"></m-form-dialog>
</template>

<script setup>
  import { ref } from "Vue";

  const config = ref([
    {
      name: "text",
      text: "文本",
    },
    {
      name: "multiple",
      text: "多行文本",
      type: "switch",
    },
  ]);
</script>
```

## initValues

- **详情：** 表单初始化值

- **默认值：** `{}`

- **类型：** `Object`

- **示例：**

```html
<template>
  <m-form-dialog :init-values="initValues"></m-form-dialog>
</template>

<script setup>
  import { ref } from 'Vue';

  const initValues = ref([
    text: 'text',
    multiply: true,
  ]);
</script>
```

## lastValues

- **详情：** 需对比的值（开启对比模式时传入）

- **默认值：** `{}`

- **类型：** `Object`

## isCompare

- **详情：** 是否开启对比模式

- **默认值：** `false`

- **类型：** `boolean`

## showDiff

- **详情：**

  自定义“是否展示对比内容”的判断函数（仅在 `isCompare === true` 时生效）。

  - 不传：使用默认逻辑 `!isEqual(curValue, lastValue)`（基于 lodash `isEqual`）；
  - 传函数：完全以函数返回值为准，返回 `true` 才展示前后两份对比内容。

  该 prop 通过 `formState` 透传到所有层级的 Container 中，调用方只需在 MForm 这一层传一次即可对整棵表单生效。

  典型场景：某些字段语义上相等但结构不同（例如 `code-select` 字段中 `''` 与 `{ hookType: 'code', hookData: [] }` 应视为相等），调用方在此处显式声明，避免被 `isEqual` 误判为差异。

- **类型：** `(data: { curValue: any; lastValue: any; config: FormItemConfig }) => boolean`

- **示例：**

```html
<template>
  <m-form :config="config" :is-compare="true" :last-values="lastValues" :show-diff="showDiff"></m-form>
</template>

<script setup>
  import { isEqual } from 'lodash-es';

  const showDiff = ({ curValue, lastValue, config }) => {
    if (config?.type === 'code-select') {
      // 业务侧自定义：双方都是“空形态”视为相等，不展示对比
      const isEmpty = (v) =>
        v === '' || v === undefined || v === null ||
        (typeof v === 'object' && v.hookType === 'code' && Array.isArray(v.hookData) && v.hookData.length === 0);
      if (isEmpty(curValue) && isEmpty(lastValue)) return false;
    }
    return !isEqual(curValue, lastValue);
  };
</script>
```

## parentValues

- **详情：** 父级表单值

- **默认值：** `{}`

- **类型：** `Object`

## labelWidth

- **详情：**

表单域标签的宽度，例如 '50px'。 作为 Form 直接子元素的 form-item 会继承该值。 支持 auto

- **默认值：** `'200px'`

- **类型：** `string`

## disabled

- **详情：** 是否禁用该表单内的所有组件。 若设置为 true，则表单内组件上的 disabled 属性不再生效

- **默认值：** false

- **类型：** `boolean`

## height

- **详情：** 表单容器的高度，会作为内联样式 `height` 应用到表单根元素上

- **默认值：** `'auto'`

- **类型：** `string`

## stepActive

- **详情：** 当表单包含 step 容器时，控制当前激活的步骤

- **默认值：** `1`

- **类型：** `string | number`

## size

- **详情：** 用于控制该表单内组件的尺寸

- **类型：** `'small' | 'default' | 'large'`

## inline

- **详情：** 行内表单模式

- **默认值：** false

- **类型：** `boolean`

## labelPosition

- **详情：** 表单域标签的位置， 当设置为 left 或 right 时，则也需要设置 label-width 属性
- **默认值：** `'right'`

- **类型：** `string`

## keyProp

- **详情：** 作为表单项的组件实例的key

- **默认值：** `'__key'`

- **类型：** `string`

## popperClass

- **详情：** tooltip弹出层的class

- **类型：** `string`

## preventSubmitDefault

- **详情：** 是否阻止表单原生 submit 事件的默认行为

- **类型：** `boolean`

## extendState

- **详情：** 扩展 formState 的钩子函数，返回的对象会被合并到 formState 上

- **类型：** `(state: FormState) => Record<string, any> | Promise<Record<string, any>>`

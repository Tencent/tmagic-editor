# Checkbox 多选框

一组备选项中进行多选

## 基础用法

单独使用可以表示两种状态之间的切换。

<demo-block type="form" :config="[{
  type: 'checkbox',
  name: 'checkbox',
  text: '选项'
}]">
  <template #source>
    <p>
      要使用 Checkbox 组件，只需要配置 type: 'checkbox'，选中意味着变量的值为 true。默认绑定变量的值会是 Boolean，选中为 true。
    </p>
  </template>
</demo-block>

## 禁用状态

多选框不可用状态。

<demo-block type="form" :config="[{
  type: 'checkbox',
  name: 'checkbox',
  text: '选项',
  disabled: () => true
}]">
  <template #source>
    <p>
     设置 disabled 属性即可，它接受一个 Boolean，true 为禁用，也可以接受一个返回 Boolean 的函数。
    </p>
  </template>
</demo-block>

## 自定义选中值

通过 `activeValue` 和 `inactiveValue` 自定义选中和未选中时的值。

<demo-block type="form" :config="[{
  type: 'checkbox',
  name: 'checkbox',
  text: '选项',
  activeValue: 'yes',
  inactiveValue: 'no'
}]">
  <template #source>
    <p>
      设置 activeValue 为选中时的值，inactiveValue 为未选中时的值。
    </p>
  </template>
</demo-block>

## 数值类型

当需要绑定数值类型时，可以使用 `filter: 'number'` 配合默认的 activeValue/inactiveValue。

<demo-block type="form" :config="[{
  type: 'checkbox',
  name: 'checkbox',
  text: '选项',
  filter: 'number'
}]">
  <template #source>
    <p>
      配置 filter 为 'number' 时，默认 activeValue 为 1，inactiveValue 为 0。
    </p>
  </template>
</demo-block>

## 使用 Label 显示

通过 `useLabel` 属性控制是否使用 label 作为显示内容。

<demo-block type="form" :config="[{
  type: 'checkbox',
  name: 'checkbox',
  text: '选项',
  useLabel: true
}]">
  <template #source>
    <p>
      设置 useLabel 为 true 时，不显示 text 内容，由外部 label 控制显示。
    </p>
  </template>
</demo-block>

## 多选框组

适用于多个勾选框绑定到同一个数组的情景，通过是否勾选来表示这一组选项中选中的项。

<demo-block type="form" :config="[{
  type: 'checkbox-group',
  name: 'checkbox',
  text: '选项',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 },
    { text: '选项3', value: 3 }
  ]
}]">
  <template #source>
    <p>
      checkbox-group 元素能把多个 checkbox 管理为一组，绑定值为数组类型。
    </p>
  </template>
</demo-block>

## 多选框组禁用选项

在选项中设置 `disabled` 可禁用单个选项。

<demo-block type="form" :config="[{
  type: 'checkbox-group',
  name: 'checkbox',
  text: '选项',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2, disabled: true },
    { text: '选项3', value: 3 }
  ]
}]">
  <template #source>
    <p>
      在 options 中设置 disabled: true 可禁用该选项。
    </p>
  </template>
</demo-block>

## 动态选项

options 支持函数形式，可根据表单状态动态生成选项。

```typescript
{
  type: 'checkbox-group',
  name: 'checkbox',
  text: '选项',
  options: (mForm, { model, formValue }) => {
    // 根据表单值动态返回选项
    return [
      { text: '选项A', value: 'a' },
      { text: '选项B', value: 'b' }
    ];
  }
}
```

## Checkbox Attributes

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| name | 绑定值 | string | — | — |
| text | 表单标签 | string | — | — |
| disabled | 是否禁用 | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form-schema/src/base.ts) | — | false |
| activeValue | 选中时的值 | string / number | — | true（filter 为 'number' 时默认 1） |
| inactiveValue | 未选中时的值 | string / number | — | false（filter 为 'number' 时默认 0） |
| useLabel | 是否使用外部 label 显示 | boolean | — | false |
| filter | 值过滤器 | 'number' / Function | — | — |
| onChange | 值变化时触发的函数 | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form-schema/src/base.ts) | — | — |

## CheckboxGroup Attributes

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| name | 绑定值 | string | — | — |
| text | 表单标签 | string | — | — |
| disabled | 是否禁用 | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form-schema/src/base.ts) | — | false |
| options | 选项列表 | Array / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form-schema/src/base.ts) | — | — |
| onChange | 值变化时触发的函数 | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form-schema/src/base.ts) | — | — |

## options item

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| value | 选项的值 | any | — | — |
| text | 选项的标签 | string | — | — |
| disabled | 是否禁用该选项 | boolean | — | false |

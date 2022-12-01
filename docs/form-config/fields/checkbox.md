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
      要使用 Checkbox 组件，只需要配置type: 'checkbox'，选中意味着变量的值为true。默认绑定变量的值会是 Boolean ，选中为 true 。
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
     设置 disabled 属性即可，它接受一个 Boolean ， true 为禁用，也可以接受一个返回 Boolean 的函数。
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
    { text: '选项2', value: 2 }
  ]
}]">
  <template #source>
    <p>
      checkbox-group 元素能把多个 checkbox 管理为一组。
    </p>
  </template>
</demo-block>


## Checkbox Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)    | — | false   |
| activeValue  | 选中时的值	    | string / number / Function   | — | 1   |
| inactiveValue  | 没有选中时的值  | string / number / Function   | — | 0   |
| onChange  | 值变化时触发的函数  | [OnChangeHandler ](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |

## CheckboxGroup Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| onChange  | 值变化时触发的函数  | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |
| options  | 选项  | Array   | — | -   |

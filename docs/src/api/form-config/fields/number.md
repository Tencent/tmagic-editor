# InputNumber 计数器

仅允许输入标准的数字值，可定义范围

## 基础用法

<demo-block type="form" :config="[{
  type: 'number',
  name: 'number',
  text: '计数器'
}]">
  <template #source>
    <p>
      type为'number'
    </p>
  </template>
</demo-block>

## 禁用状态

<demo-block type="form" :config="[{
  type: 'number',
  name: 'number',
  text: '计数器',
  disabled: () => true
}]">
  <template #source>
    <p>
      disabled 属性接受一个 Boolean，设置为 true 即可禁用整个组件，也可以接受一个返回 Boolean 的函数，如果你只需要控制数值在某一范围内，可以设置 min 属性和 max 属性，不设置 min 和 max 时，最小值为 0。
    </p>
  </template>
</demo-block>

## 步数

允许定义递增递减的步数控制

<demo-block type="form" :config="[{
  type: 'number',
  name: 'number',
  text: '计数器',
  step: 10
}]">
  <template #source>
    <p>
      设置 step 属性可以控制步长，接受一个 Number 。
    </p>
  </template>
</demo-block>


## Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|----------|-------------- |----------|--------------------------------  |-------- |
| name | 绑定值 | string | — | — |
| placeholder  | 输入框占位文本   | string |       —        |      —   |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| min      | 设置计数器允许的最小值 | number | — | -Infinity |
| max      | 设置计数器允许的最大值 | number | — | Infinity |
| step     | 计数器步长           | number   | — | 1 |
| onChange  | 值变化时触发的函数  | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |

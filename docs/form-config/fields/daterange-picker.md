# DateRangePicker 日期范围选择器

用于选择或输入日期范围

## 基础用法

<demo-block type="form" :config="[{
  type: 'daterange',
  name: 'daterange',
  text: '日期范围'
}]">
  <template #source>
    <p>
      type为'daterange'
    </p>
  </template>
</demo-block>

## 绑定多个字段

可以通过配置 `names` 来将日期范围绑定到两个不同的字段上。

<demo-block type="form" :config="[{
  type: 'daterange',
  names: ['startTime', 'endTime'],
  text: '日期范围'
}]">
  <template #source>
    <p>
      配置 names 属性，将开始时间和结束时间分别绑定到 startTime 和 endTime 字段。
    </p>
  </template>
</demo-block>

## Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| name | 绑定值（数组形式） | string | — | — |
| names | 绑定值（拆分为两个字段） | string[] | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| dateFormat | 日期格式 | string | — | YYYY/MM/DD |
| timeFormat | 时间格式 | string | — | HH:mm:ss |
| valueFormat | 绑定值的格式 | string | — | YYYY/MM/DD HH:mm:ss |
| defaultTime | 默认时间 | Date[] | — | — |
| onChange  | 值变化时触发的函数  | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |

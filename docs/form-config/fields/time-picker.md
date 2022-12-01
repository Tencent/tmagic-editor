# TimePicker 时间选择器

 用于选择或输入日期

## 基础用法

<demo-block type="form" :config="[{
  type: 'time',
  name: 'time',
  text: '时间选择器'
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>

## 禁用状态

<demo-block type="form" :config="[{
  type: 'time',
  name: 'time',
  text: '时间选择器',
  disabled: () => true
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>


## Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| name | 绑定值 | string | — | — |
| placeholder  | 输入框占位文本   | string |       —        |      —   |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [Function](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |

# Switch 开关

表示两种相互对立的状态间的切换，多用于触发「开/关」。

## 基本用法

<demo-block type="form" :config="[{
  type: 'switch',
  name: 'switch',
  text: '开关'
}]"></demo-block>

## 扩展的 value 类型

<demo-block type="form" :config="[{
  type: 'switch',
  name: 'switch',
  text: '开关',
  activeValue: 'on',
  inactiveValue: 'off'
}]">
  <template #source>
    <p>
      设置 activeValue 和 inactiveValue 属性，接受 Boolean , String 或 Number 类型的值。
    </p>
  </template>
</demo-block>

## 禁用状态

<demo-block type="form" :config="[{
  type: 'switch',
  name: 'switch',
  text: '开关',
  disabled: true
}]">
  <template #source>
    <p>
      设置 disabled 属性，接受一个 Boolean，设置 true 即可禁用。
    </p>
  </template>
</demo-block>


## Attributes

| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| disabled  | 是否禁用    | boolean / [Function](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| active-value  | switch 打开时的值    | boolean / string / number | — | true |
| inactive-value  | switch 关闭时的值    | boolean / string / number | — | false |

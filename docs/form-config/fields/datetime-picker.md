# DateTimePicker 日期时间选择器

在同一个选择器里选择日期和时间

## 基础用法

<demo-block type="form" :config="[{
  type: 'datetime',
  name: 'dateTime',
  text: '日期时间选择器'
}]">
  <template #source>
    <p>
      通过设置 <code>type: 'datetime'</code> 使用日期时间选择器，可以同时选择日期和时间。
    </p>
  </template>
</demo-block>

## 带占位符

<demo-block type="form" :config="[{
  type: 'datetime',
  name: 'dateTime',
  text: '日期时间选择器',
  placeholder: '请选择日期时间'
}]">
  <template #source>
    <p>
      通过 <code>placeholder</code> 属性设置输入框的占位文本。
    </p>
  </template>
</demo-block>

## 禁用状态

<demo-block type="form" :config="[{
  type: 'datetime',
  name: 'dateTime',
  text: '日期时间选择器',
  disabled: () => true
}]">
  <template #source>
    <p>
      通过 <code>disabled</code> 属性禁用日期时间选择器，支持布尔值或函数。
    </p>
  </template>
</demo-block>

## 日期格式

使用 `format` 指定输入框的格式；使用 `valueFormat` 指定绑定值的格式。

默认情况下，组件接受并返回格式化后的字符串。以下为可用的格式化字串，以 UTC 2017年1月2日 03:04:05 为例：

:::warning
请注意大小写
:::

| 格式 | 含义 | 备注 | 举例 |
|------|------|------|------|
| `YYYY` | 年 | | 2017 |
| `M`  | 月 | 不补0 | 1 |
| `MM` | 月 | | 01 |
| `D`  | 日 | 不补0 | 2 |
| `DD` | 日 | | 02 |
| `H`  | 小时 | 24小时制；不补0 | 3 |
| `HH` | 小时 | 24小时制 | 03 |
| `h`  | 小时 | 12小时制，须和 `A` 或 `a` 使用；不补0 | 3 |
| `hh` | 小时 | 12小时制，须和 `A` 或 `a` 使用 | 03 |
| `m`  | 分钟 | 不补0 | 4 |
| `mm` | 分钟 | | 04 |
| `s`  | 秒 | 不补0 | 5 |
| `ss` | 秒 | | 05 |
| `A`  | AM/PM | 仅 `format` 可用，大写 | AM |
| `a`  | am/pm | 仅 `format` 可用，小写 | am |
| `x`  | JS时间戳（毫秒） | 仅 `valueFormat` 可用 | 1483326245000 |
| `X`  | Unix时间戳（秒） | 仅 `valueFormat` 可用 | 1483326245 |

<demo-block type="form" :config="[{
  type: 'datetime',
  name: 'dateTime',
  text: '日期时间选择器',
  format: 'YYYY-MM-DD HH:mm',
  valueFormat: 'x'
}]">
  <template #source>
    <p>
      自定义格式化：显示格式为 <code>YYYY-MM-DD HH:mm</code>，绑定值格式为时间戳。
    </p>
  </template>
</demo-block>

## Attributes

| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| name | 绑定值的字段名 | string | — | — |
| text | 表单标签 | string | — | — |
| placeholder | 输入框占位文本 | string | — | — |
| disabled | 是否禁用 | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts) | — | false |
| format | 显示在输入框中的格式 | string | 见[日期格式](#日期格式) | YYYY/MM/DD HH:mm:ss |
| valueFormat | 绑定值的格式 | string | 见[日期格式](#日期格式) | YYYY/MM/DD HH:mm:ss |
| defaultTime | 选择日期后的默认时间值 | Date | — | — |
| onChange | 值变化时触发的函数 | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts) | — | — |

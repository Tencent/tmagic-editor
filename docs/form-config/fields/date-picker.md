# DatePicker 日期选择器

用于选择或输入日期

## 基础用法

<demo-block type="form" :config="[{
  type: 'date',
  name: 'date',
  text: '日期选择器'
}]">
  <template #source>
    <p>
      以日期为基本单位，基础的日期选择控件
    </p>
  </template>
</demo-block>

## 禁用状态

<demo-block type="form" :config="[{
  type: 'date',
  name: 'date',
  text: '日期选择器',
  disabled: () => true
}]">
  <template #source>
    <p>
      通过 <code>disabled</code> 属性禁用日期选择器
    </p>
  </template>
</demo-block>

## 占位符

<demo-block type="form" :config="[{
  type: 'date',
  name: 'date',
  text: '日期选择器',
  placeholder: '请选择日期'
}]">
  <template #source>
    <p>
      通过 <code>placeholder</code> 属性设置输入框占位文本
    </p>
  </template>
</demo-block>

## 日期格式

使用`format`指定输入框的格式；使用`valueFormat`指定绑定值的格式。

默认情况下，组件的 `format` 默认值为 `YYYY/MM/DD`，`valueFormat` 默认值为 `YYYY/MM/DD`。以下为可用的格式化字串，以 UTC 2017年1月2日 03:04:05 为例：

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
| `x` | JS时间戳 | 组件绑定值为`number`类型 | 1483326245000 |
| `[MM]` | 不需要格式化字符 | 使用方括号标识不需要格式化的字符 (如  [A] [MM])  | MM |

<demo-block type="form" :config="[{
  type: 'date',
  name: 'date',
  text: '日期选择器',
  format: 'YYYY-MM-DD',
  valueFormat: 'x'
}]">
  <template #source>
    <p>
      设置 <code>valueFormat</code> 为 <code>timestamp</code>，绑定值将返回时间戳格式
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
| format | 显示在输入框中的格式 | string | 见[日期格式](#日期格式) | YYYY/MM/DD |
| valueFormat | 绑定值的格式。不指定则绑定值为 Date 对象 | string | 见[日期格式](#日期格式) | YYYY/MM/DD |
| onChange | 值变化时触发的函数 | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts) | — | — |

## TypeScript 定义

```typescript
interface DateConfig extends FormItem, Input {
  type: 'date';
  format?: 'YYYY-MM-dd HH:mm:ss' | string;
  valueFormat?: 'YYYY-MM-dd HH:mm:ss' | string;
}
```


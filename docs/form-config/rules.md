# 表单校验

`@tmagic/form` 字段可通过 `rules` 配置校验规则，兼容 [async-validator](https://github.com/yiminghe/async-validator)（Element Plus 内部使用）的常见能力，并额外支持按字段 `type` 做值类型 / 选项匹配校验（`typeMatch`）。

## 基础用法

```ts
{
  name: 'title',
  text: '名称',
  rules: [
    { required: true, message: '请输入名称' },
    { typeMatch: true, message: '名称类型不合法' },
  ],
}
```

`rules` 类型见下方 [`Rule`](#类型定义)。未配置 `typeMatch` 时，现有表单行为不变。

## typeMatch

开启 `typeMatch: true` 后，表单会按字段 `config.type`（及关联配置）校验当前值是否合法。空值（`undefined` / `null` / `''`，多选类空数组 `[]`）直接通过，必填请继续使用 `required`。

### 内置映射

| 字段 type | 期望值 |
| --- | --- |
| `text` / `textarea` / `color-picker` / `html` / 默认无 type | `string`；若 `filter: 'number'` 则为 `number`；`filter` 为自定义函数时跳过内置类型校验 |
| `display` / `hidden` | 不校验 |
| `number` | `number`（非 NaN） |
| `number-range` | 长度为 2 的数字数组 |
| `date` / `datetime` / `time` | 按 `valueFormat` 校验；`x` / `timestamp` 期望 `number`，其余按 [Day.js format](https://day.js.org/docs/en/display/format) 严格解析字符串 |
| `daterange` / `timerange` | 无 `names` 时为长度为 2 的数组，元素按 `valueFormat` 校验；有 `names` 时跳过 |
| `switch` / `checkbox` | 值必须是解析后的 `activeValue` / `inactiveValue` 之一（显式配置优先；未配置且 `filter === 'number'` 时为 `1`/`0`；否则为 `true`/`false`） |
| `select` | 单选：值 ∈ options；`multiple`：数组且每项 ∈ options；`allowCreate` / `remote`：只校验基础形态，不做 options 枚举 |
| `radio-group` / `radioGroup` | 值 ∈ options |
| `checkbox-group` / `checkboxGroup` | 数组且每项 ∈ options |
| `cascader` | 有 `valueSeparator` 时可为 `string` 或 `array`；默认 `emitPath` 为路径数组；`emitPath: false` 为叶子值；`multiple` 为数组；静态 options 校验路径/叶子；`remote` 只做形态校验 |
| `table` / `group-list` / `groupList` | `array` |
| 容器类（`row` / `tab` / `fieldset` / `panel` / `step` / `flex-layout` / `link` / `component` / `dynamic-field` 等） | 不校验 |

日期类默认 `valueFormat` 与字段组件一致：

- `date`：`YYYY/MM/DD`
- `datetime` / `daterange`：`YYYY/MM/DD HH:mm:ss`
- `time` / `timerange`：`HH:mm:ss`

### 与自定义 validator 共存

同一条 rule 同时配置了 `typeMatch` 与 `validator` 时，会先做类型匹配校验，通过后再执行自定义 `validator`。

```ts
{
  name: 'age',
  type: 'number',
  rules: [
    {
      typeMatch: true,
      message: '年龄必须是数字',
      validator: ({ value, callback }) => {
        if (value < 0) {
          callback(new Error('年龄不能小于 0'));
          return;
        }
        callback();
      },
    },
  ],
}
```

## 扩展自定义 type 规则

业务可覆盖内置规则，或为自定义字段 type 注册校验。自定义规则优先于内置规则。

### 运行时注册

```ts
import {
  registerTypeMatchRule,
  registerTypeMatchRules,
  deleteTypeMatchRule,
  clearTypeMatchRules,
} from '@tmagic/form';

// 覆盖内置 text
registerTypeMatchRule('text', (value, { message }) => {
  if (typeof value !== 'string') {
    return message || '值类型应为字符串';
  }
});

// 扩展业务字段
registerTypeMatchRule('vs-code', (value, { message }) => {
  if (typeof value !== 'string') {
    return message || '代码字段应为字符串';
  }
});

// 批量注册
registerTypeMatchRules({
  foo: (value) => (Array.isArray(value) ? undefined : '应为数组'),
});

// 删除 / 清空
deleteTypeMatchRule('foo');
clearTypeMatchRules();
```

自定义校验器签名：`(value, context) => string | undefined`。返回错误文案表示失败，返回 `undefined` 表示通过。`context` 包含 `fieldType`、`mForm`、`props`、`message`。

### 安装时注册

```ts
import MagicForm from '@tmagic/form';

app.use(MagicForm, {
  typeMatchRules: {
    'my-field': (value, { message }) => {
      if (typeof value !== 'string') {
        return message || 'my-field 应为字符串';
      }
    },
  },
});
```

## 示例

### select 选项匹配

```ts
{
  name: 'status',
  type: 'select',
  options: [
    { text: '启用', value: 1 },
    { text: '禁用', value: 0 },
  ],
  rules: [
    { required: true, message: '请选择状态' },
    { typeMatch: true, message: '状态值不合法' },
  ],
}
```

### date 按 valueFormat 校验

```ts
{
  name: 'birthday',
  type: 'date',
  valueFormat: 'YYYY-MM-DD',
  rules: [{ typeMatch: true, message: '日期格式不正确' }],
}
```

### text + filter: number

```ts
{
  name: 'width',
  type: 'text',
  filter: 'number',
  rules: [{ typeMatch: true, message: '宽度应为数字' }],
}
```

## 类型定义

::: details 查看 Rule 类型定义
<<< @/../packages/form-schema/src/base.ts#Rule{ts}
:::

::: details 查看 TypeMatchValidator / TypeMatchValidateContext 类型定义
<<< @/../packages/form/src/utils/typeMatch.ts#TypeMatchValidator{ts}

<<< @/../packages/form/src/utils/typeMatch.ts#TypeMatchValidateContext{ts}
:::

::: details 查看 FormInstallOptions 类型定义
<<< @/../packages/form/src/plugin.ts#FormInstallOptions{ts}
:::

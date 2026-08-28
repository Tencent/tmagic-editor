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

`validator` 除了调用 `callback` 外，也兼容 async-validator 的返回值约定：返回 `false` 或 `Error` / 错误数组表示失败，返回 `true` 表示通过，返回 `Promise` 则以 resolve / reject 为结果，内部抛出的异常会转成校验失败。同步与异步 `typeMatch` 下这些约定行为一致，且只会上报一次结果（既调 `callback` 又返回 `Promise` 时以先到的为准）。

## 扩展自定义 type 规则

业务可覆盖内置规则，或为自定义字段 type 注册校验。自定义规则优先于内置规则。

### 运行时注册

```ts
import { registerField, registerFields, unregisterField, clearFields } from '@tmagic/form';

// 覆盖内置 text
registerField('text', {
  typeMatch: (value, { message }) => {
    if (typeof value !== 'string') {
      return message || '值类型应为字符串';
    }
  },
});

// 扩展业务字段
registerField('vs-code', {
  typeMatch: (value, { message }) => {
    if (typeof value !== 'string') {
      return message || '代码字段应为字符串';
    }
  },
});

// 批量注册
registerFields({
  foo: { typeMatch: (value) => (Array.isArray(value) ? undefined : '应为数组') },
});

// 删除 / 清空该 type 的全部登记（含 typeMatch）
unregisterField('foo');
clearFields();
```

自定义校验器签名：`(value, context) => string | undefined | Promise<string | undefined>`。返回错误文案表示失败，返回 `undefined` 表示通过。`context` 包含 `fieldType`、`mForm`、`props`、`message`。

### 异步校验

自定义校验器可以返回 `Promise`，用于需要异步确认取值是否合法的场景（如请求接口校验 id 是否存在）。内置规则均为同步。

```ts
import { registerField } from '@tmagic/form';

registerField('mod-select', {
  typeMatch: async (value, { message }) => {
    const exists = await checkModExists(value);
    if (!exists) {
      return message || `模块(${value})不存在`;
    }
  },
});
```

异步校验器通过后才会执行同一条 rule 上的自定义 `validator`。需要注意几点：

- **校验器自身失败不算校验失败。** Promise 被 reject（如接口异常）时只打印错误、该字段按通过处理，避免网络故障阻塞操作。需要把失败暴露给用户时请在校验器内部 catch 并返回错误文案。
- **建议自行缓存请求结果。** 每次校验都会执行校验器，无缓存会导致逐次输入都发请求；也可以给 rule 配 `trigger: 'blur'` 降低触发频率。
- **只有最新一轮校验的结论会被采用。** 新一轮校验开始后，上一轮针对旧值、尚未返回的校验不再使用自己的结论，而是等最新一轮出结论后一起结算，因此旧结论不会晚到覆盖新结论，`form.validate()` 也不会对一个尚未校验完的值返回成功。

### 安装时注册

```ts
import MagicForm from '@tmagic/form';
import MyField from './MyField.vue';

app.use(MagicForm, {
  fields: {
    'my-field': {
      component: MyField,
      typeMatch: (value, { message }) => {
        if (typeof value !== 'string') {
          return message || 'my-field 应为字符串';
        }
      },
    },
  },
});
```

### Editor 字段内置规则

安装 `@tmagic/editor` 时会把 `editorFields`（无 Vue 组件）叠上字段组件后作为 `fields` 传给 `@tmagic/form`。Node 里从 `@tmagic/form/headless` 与 `@tmagic/editor/headless` 引入即可。若安装时也传了 `fields`，会与编辑器字段按 type 浅合并：调用方传入的 key 覆盖对应项，未传的 key（如 `nested` / `typeMatch`）保留。服务数据（数据源 / 代码块 / 节点树）未就绪时，只做基础形态校验，不做枚举或存在性失败。

| 字段 type | 期望值 |
| --- | --- |
| `key-value` / `style-setter` | 普通对象；`key-value` + `advanced` 且值为 `function` 时放行 |
| `cond-op-select` | 已知算子；能解析字段类型时按类型收窄 |
| `code-select-col` | `string`；有代码块 DSL 时须为已有 codeId |
| `page-fragment-select` / `ui-select` | `string \| number`；有节点树时须为已有页面片 / 组件 id |
| `data-source-input` | `string`；`${...}` 绑定须指向已有数据源/字段 |
| `data-source-method-select` | `[dsId, methodName]`，方法须在该数据源可选方法集中 |
| `data-source-field-select` | 数据源路径 `string[]`；有 `fieldConfig` 且非路径值时跳过 |
| `data-source-select` | `value: 'id'` 为已有 ds id；否则为含 `isBindDataSource` + `dataSourceId` 的对象 |
| `code-select` | `{ hookType: 'code', hookData }` 的浅层结构校验（`codeId` 存在性 / 数据源方法存在性由内部 `code-select-col`、`data-source-method-select` 单元格各自校验，只标红出错单元格） |
| `data-source-fields` / `data-source-mocks` / `data-source-methods` | 数组 + 浅层结构（`name`/`type`、`title`/`enable`/`data`、`content`/`params` 等） |
| `event-select` | 数组；兼容新旧格式的浅层结构校验（`name` / 联动组件 `method` 是否 ∈ 可选项由字段内 `eventNameConfig.rules`、`compActionConfig.rules` 单独校验，只标红对应 select） |
| `display-conds` | 数组 + `cond[].field`/`op` 浅层结构校验（`op` 是否为已知算子、字段路径是否存在由内部 `cond-op-select`、`field` 单元格各自校验，只标红出错单元格） |

> 容器类字段（`event-select` / `code-select` / `display-conds`）遵循同一约定：容器级 typeMatch 只做结构校验，「枚举 / 存在性」下沉到内部单元格各自的 typeMatch/rules，避免单个子项非法导致整块表单标红。

业务仍可用 `registerField(type, { typeMatch })` 覆盖上述任一 type 的类型校验；多次 `registerField` 按字段浅合并，不会丢掉已登记的 `nested` / `walk` / `effect`。

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

::: details 查看 FieldOptions 类型定义
<<< @/../packages/form/src/utils/registerField.ts#FieldOptions{ts}
:::

::: details 查看 FormInstallOptions 类型定义
<<< @/../packages/form/src/plugin.ts#FormInstallOptions{ts}
:::

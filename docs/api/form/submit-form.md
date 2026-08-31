# submitForm 函数

以命令式方式对一份「表单配置 + 表单值」执行一次校验并取回表单值，类似 `ElMessage` 的用法。

走**无渲染**实现：不创建任何 DOM 容器、不实例化任何组件，而是直接遍历 `config` 树收集带规则的字段，交给 [`async-validator`](https://github.com/yiminghe/async-validator)（`element-plus` 内部用的也是它）执行。因此它可以在 Node / CI 等没有 DOM 的环境中使用，也省去了挂载整棵表单的开销。校验通过则 `resolve` 表单值，失败则 `reject` 错误信息。纯 Node 请从 `@tmagic/form/headless` 引入，避免加载 Vue 组件和样式。

适用于一些没有合适的容器、但又需要复用 `MForm` 校验逻辑的场景，例如：

- 通过快捷菜单/命令面板触发一次性表单
- 在脚本/服务层完成一次表单值校验后再发请求
- 把 `config` 配置当作"可执行的校验规则"使用
- 在 Node 脚本 / CI 中批量校验组件配置

## 无渲染校验与自定义字段登记

无渲染实现按 `Container.vue` 及各容器组件的模板规则遍历配置树，产出的字段 `prop` 与规则与「挂载 `MForm` 后调用 `validate()`」等价。需要 UI 时传入 `dialog: true`，会把表单以弹层渲染出来供填写/确认。

字段只要带了 `rules`（会包 FormItem），就会校验自身，不必先登记为叶子。配置里有 `items` 会下钻子项。内部再渲染 `MContainer` 的复合字段需要 `registerField(type, { innerConfig })`，把内部会挂到父表单上的配置交出来。innerConfig 回调自身抛错时，会以 `FieldInnerConfigError`（`code: 'FIELD_INNER_CONFIG'`）reject。

innerConfig 回调在校验和表单值初始化两条链路上都会被调用（后者用于走到复合字段内部、找出需要执行 `effect` 的子字段），所以它应当只做配置派生、可重复调用、不要做重活。在表单值初始化链路上，回调抛错只会记录到 console 并跳过该子树，不会让表单渲染不出来。

自定义字段的渲染组件和无渲染校验都通过 `registerField` / `registerFields` 一次登记。`component` 会写入字段注册表（`getFormField`）；传入 `app` 时同时 `app.component('m-fields-*')`。容器组件用 `container`，对应 `m-form-*`。

字段对表单值的初始化写入统一登记为 `effect`，渲染与无渲染共用同一份登记表，执行点也只有一个：表单值初始化完成后（`MForm` 内部、`validateValues`、以及 tab / table 新增行时）各执行一次 `applyMountValueEffects`，字段组件自身不要在 `setup` 里改写 `model`。因此 effect 有两个约束：一是必须幂等，同一份值可能被执行多次（如 `initValues` 变化后重新初始化）；二是不看 `display`（`display: false` 或函数返回假的字段也会被规整，避免字段由隐藏转为显示时漏掉）。`type: 'hidden'` 不同：遍历在该节点停止、不往下分派，内部字段不会执行 effect。需要按路径跨层级写值时用上下文里的 `values`（本次处理的值根对象，`prop` 即以它为根），不要用 `mForm.values`——对比模式处理的是 `lastValues` 那一份，新增行处理的则是还没挂到表单上的一行值。单个 effect 抛错只会记录到 console，不影响其余字段与表单渲染。复合字段可以同时登记 `effect` 与 `innerConfig`：前者改本字段的值，后者只派生内部配置、不要在回调里改 `model`。

| 字段形态                                                              | 登记方式                                    |
| --------------------------------------------------------------------- | ------------------------------------------- |
| 自身带 `rules`，内部没有嵌套的父表单 FormItem                         | 无需登记，直接校验                          |
| 内部只渲染叶子 UI，或把子表单渲染在独立的 `MForm` / `MFormBox` 实例里 | `registerField('my-field')`（配置里有 `items` 但不属于父表单时，避免被当下钻） |
| 同时需要渲染组件                                                      | `registerField('my-field', { component })`   |
| 容器组件（`m-form-*`）                                                | `registerField('my-box', { container, walk })` |
| 叶子字段，但需要改写表单值（类似 `display` 的 `initValue`）           | `registerField('my-field', { effect })`      |
| 内部再渲染 `MContainer` / `MPanel` / `MGroupList`，向父表单注册字段    | `registerField('my-field', { innerConfig })`（需要改本字段的值时再加 `effect`） |
| 自定义 `typeMatch` 类型校验                                           | `registerField('my-field', { typeMatch })`   |

```ts
import { registerField, registerFields } from '@tmagic/form';
import MyColorPicker from './MyColorPicker.vue';

// 叶子字段：内部没有嵌套的表单项；带 component 时即可渲染
registerFields({ 'my-color-picker': { component: MyColorPicker } });
// 需要挂到当前 app 时传入第二个参数
registerFields({ 'my-color-picker': { component: MyColorPicker } }, app);

// 叶子字段，但需要改写表单值：写成 effect，不要在组件 setup 里改 model
registerField('my-status', {
  effect: ({ config, model }) => {
    if ((config as any).initValue && model) {
      model[(config as any).name] = (config as any).initValue;
    }
  },
});

// 复合字段：把组件内部渲染的 MContainer 配置交出来
registerField('my-composite', {
  innerConfig: ({ config, model, prop }) => ({
    // 对应组件内部 <MContainer :config="childConfig" :model="model[name]" :prop="prop">
    config: childConfig,
    model: model[config.name],
    prop,
  }),
});

// typeMatch：覆盖或扩展该 type 的类型匹配校验，可与 innerConfig / effect 同时登记
registerField('my-status', {
  typeMatch: (value, { message }) => (typeof value === 'string' ? undefined : message || '应为字符串'),
});
```

返回的 `config` 的 `name` 会被追加到返回的 `prop` 上。因此当内部配置复用了字段自身的 `name`（例如内部渲染 `<MGroupList :config="{ name, items }" :model="model" :prop="prop">`）时，要返回 `parentProp` 而非 `prop`，否则 `name` 会被拼两次：

```ts
registerField('my-list', {
  innerConfig: ({ config, parentProp }) => ({
    config: { type: 'group-list', name: config.name, items: innerItems },
    prop: parentProp,
  }),
});
```

编辑器侧四个复合字段（`code-select` / `display-conds` / `event-select` / `style-setter`）的登记可参考 `packages/editor/src/fields/headless-validation.ts`：innerConfig 与组件共用同一份配置工厂（`packages/editor/src/fields/configs/`），避免两条链路各写一份而逐渐跑偏。

`type: 'component'` 会把 `config.component` 当任意 Vue 组件渲染。无渲染校验把它视为叶子，**不会**遍历内部结构。因此该组件不得再向父表单注册 FormItem；需要嵌套表单项时，应对该具体组件 `registerField(type, { innerConfig })`。

### 重复登记与撤销

同一个 type 多次登记按字段浅合并，后一次只覆盖自己传入的 key：

```ts
registerField('my-composite', { innerConfig });
registerField('my-composite', { component: MyComposite }); // innerConfig 仍在
```

登记分「内置」与「业务」两层。`app.use(MagicForm)` / `registerBuiltInFields` 写内置层，`registerField` / `registerFields` 写业务层；读取时业务层优先，`unregisterField` / `clearFields` 只清业务层，内置字段不受影响（单测里 `clearFields` 之后仍能校验 `text`、`tab` 等内置 type）。

因为是合并语义，把一个已登记 `innerConfig` 的 type 改成普通叶子，不能靠再传一次空对象，要先撤销：

```ts
registerField('my-composite', {}); // ✗ 合并后 innerConfig 还在，仍会下钻
unregisterField('my-composite'); // ✓ 先清掉业务层登记
registerField('my-composite', { component: MyComposite });
```

一次登记里同时传多个形态时的优先级：`walk` > `innerConfig` > `effect`（叶子），命中低优先级的那份会被忽略并在控制台给出告警。

## 签名

```ts
function submitForm(options: SubmitFormOptions): Promise<any>;
```

## 参数

`options` 与 `MForm` 组件的 props 基本对齐，额外提供了 `native`、`returnChangeRecords`、`dialog`、`signal` 等参数。`appContext` 仅 `dialog: true` 时生效。

| 名称                   | 类型                                                    | 默认值     | 说明                                                                                                  |
| ---------------------- | ------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `config`               | `FormConfig`                                            | —          | 必填，表单配置                                                                                        |
| `initValues`           | `Record<string, any>`                                   | `{}`       | 表单初始值                                                                                            |
| `lastValues`           | `Record<string, any>`                                   | `{}`       | 需对比的值（开启对比模式时传入）                                                                      |
| `isCompare`            | `boolean`                                               | `false`    | 是否开启对比模式                                                                                      |
| `parentValues`         | `Record<string, any>`                                   | `{}`       | 父级 values，透传给字段的回调                                                                         |
| `labelWidth`           | `string`                                                | `'200px'`  | label 宽度                                                                                            |
| `disabled`             | `boolean`                                               | `false`    | 是否禁用                                                                                              |
| `height`               | `string`                                                | `'auto'`   | 表单高度                                                                                              |
| `stepActive`           | `string \| number`                                      | `1`        | 步骤表单当前激活步骤                                                                                  |
| `size`                 | `'small' \| 'default' \| 'large'`                       | —          | 组件尺寸                                                                                              |
| `inline`               | `boolean`                                               | `false`    | 是否行内表单                                                                                          |
| `labelPosition`        | `string`                                                | `'right'`  | label 对齐方式                                                                                        |
| `keyProp`              | `string`                                                | `'__key'`  | 配置项的唯一 key                                                                                      |
| `popperClass`          | `string`                                                | —          | 弹层 className                                                                                        |
| `preventSubmitDefault` | `boolean`                                               | —          | 是否阻止表单原生 submit                                                                               |
| `useFieldTextInError`  | `boolean`                                               | `true`     | 校验失败时错误提示前缀是否使用字段的 `text` 文案；`false` 时直接使用字段 `name`                        |
| `extendState`          | `(state: FormState) => Record<string, any> \| Promise<Record<string, any>>` | — | 扩展 `formState`                                                              |
| `native`               | `boolean`                                               | `false`    | 透传给 `Form.submitForm`。`true` 时返回内部响应式 `values`，否则返回 `cloneDeep(toRaw(values))`        |
| `returnChangeRecords`  | `boolean`                                               | `false`    | `true` 时 resolve 结果为 `{ values, changeRecords }`，携带表单变更记录；否则仅 resolve `values`        |
| `appContext`           | `AppContext \| null`                                    | `null`     | 父级 Vue 应用上下文。仅 `dialog: true` 时生效，用于继承全局组件、指令、provide 等，常通过 `app._context` 或 `getCurrentInstance()?.appContext` 获取 |
| `dialog`               | `boolean`                                               | `false`    | `true` 时把表单以弹层形式渲染出来，点击「确定」才提交，「取消」则以 reject 中断；校验失败会保留弹层并展示错误，便于修正后重试。等待人工操作，可用 `signal` 中断 |
| `title`                | `string`                                                | `'submitForm'` / `'validateForm'` | 弹层标题，仅 `dialog: true` 时生效 |
| `signal`               | `AbortSignal`                                           | —          | 外部中断信号。abort 时立即以 `signal.reason` reject，并卸载 `dialog` 模式下已挂载的临时表单实例           |

## 返回值

- `校验通过` — `Promise<any>` resolve 当前表单值（`native` 决定是否克隆）；当 `returnChangeRecords` 为 `true` 时，resolve `{ values, changeRecords }`
- `校验失败` — `Promise<any>` reject 一个 `Error`，`message` 中包含逐条字段错误信息（格式 `${text} -> ${message}`，多条用 `<br>` 分隔）

`dialog: true` 时无论成功或失败，函数都会在最后自动 `unmount` 内部 app 并移除挂载用的 DOM 容器，无需调用方手动清理。

::: tip 关于 changeRecords
`changeRecords` 记录的是表单挂载后发生的字段变更（由各字段的 `change` 事件累积而来）。无渲染校验没有用户交互，因此固定返回空数组；只有 `dialog: true` 时才可能有内容（`MForm` 内部的 `submitForm` 在校验通过后会清空变更记录，因此本函数会在调用前先做快照）。
:::

## 基础用法

```ts
import { submitForm } from '@tmagic/form';

try {
  const values = await submitForm({
    config: [
      {
        type: 'text',
        name: 'username',
        text: '用户名',
        rules: [
          { required: true, message: '请输入用户名' },
          { typeMatch: true, message: '用户名类型不合法' },
        ],
      },
    ],
    initValues: { username: '' },
  });
  console.log('提交成功', values);
} catch (e) {
  console.error('校验失败', e);
}
```

## 同时获取变更记录（changeRecords）

设置 `returnChangeRecords: true` 后，resolve 的结果会从单纯的 `values` 变为 `{ values, changeRecords }`：

```ts
import { submitForm } from '@tmagic/form';

const { values, changeRecords } = await submitForm({
  config: [{ type: 'text', name: 'username', text: '用户名' }],
  initValues: { username: 'foo' },
  returnChangeRecords: true,
});

console.log(values); // { username: 'foo' }
console.log(changeRecords); // ChangeRecord[]
```

## 弹层模式（`dialog: true`）下继承父级应用上下文

默认路径不挂载组件，不需要 `appContext`。只有 `dialog: true` 会渲染弹层，此时 `MForm` 要用到 `@tmagic/design` 的组件（背后可能是 `element-plus` 或 `tdesign`），需要把宿主应用的上下文带过去：

```vue
<script setup lang="ts">
import { getCurrentInstance } from 'vue';

import { submitForm } from '@tmagic/form';

const { appContext } = getCurrentInstance()!;

const onClick = async () => {
  const values = await submitForm({
    config: [{ type: 'text', name: 'text', text: '文本' }],
    initValues: { text: 'hello' },
    dialog: true,
    title: '编辑配置',
    appContext,
  });
  console.log(values);
};
</script>
```

也可以在初始化 app 时把上下文缓存下来，再在任意位置复用：

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import MagicForm, { type SubmitFormOptions, submitForm as rawSubmitForm } from '@tmagic/form';

import App from './App.vue';

const app = createApp(App);
app.use(ElementPlus);
app.use(MagicForm);
app.mount('#app');

export const submitForm = (options: Omit<SubmitFormOptions, 'appContext'>) =>
  rawSubmitForm({ ...options, appContext: app._context });
```

## 处理校验错误

校验失败时 reject 的 `Error.message` 已经把出错字段拼好，可以直接展示到用户：

```ts
import { tMagicMessage } from '@tmagic/design';

try {
  const values = await submitForm({ config, initValues });
  await save(values);
} catch (e: any) {
  tMagicMessage.error({
    dangerouslyUseHTMLString: true,
    message: e.message,
  });
}
```

## validateForm 函数

`validateForm` 与 `submitForm` 共用同一套无渲染校验实现，区别在于它是**静默**的：校验失败不抛异常、不返回表单值，而是以返回值形式给出错误文案。适合「只想探测这份配置是否合法」的场景，例如源码编辑器保存后校验、批量校验组件配置。

```ts
function validateForm(options: ValidateFormOptions): Promise<string>;
```

`options` 取 `SubmitFormOptions` 中与校验相关的子集（`config`、`initValues`、`parentValues`、`labelWidth`、`keyProp`、`useFieldTextInError`、`extendState`、`typeMatchValid`、`appContext`、`dialog`、`title`、`signal`）。

```ts
import { validateForm } from '@tmagic/form';

const error = await validateForm({
  config: [{ type: 'text', name: 'username', text: '用户名', rules: [{ required: true, message: '请输入用户名' }] }],
  initValues: { username: '' },
});

if (error) {
  // '用户名 -> 请输入用户名'
}
```

校验通过返回空字符串 `''`，否则返回以 `<br>` 拼接的错误文案。无法完成校验时才会 reject（例如 innerConfig 回调失败抛出 `FieldInnerConfigError`）。

## 运行环境

无渲染实现不接触 `document` / `window`，因此在任何 JS 运行时中都可用：

| 环境                                       | 是否可用 | 说明                                                                                  |
| ------------------------------------------ | -------- | ------------------------------------------------------------------------------------- |
| 浏览器 / Electron 渲染进程 / 浏览器扩展    | ✅       | 直接可用                                                                              |
| Vitest / Jest + `happy-dom` / `jsdom`      | ✅       | 项目自身的单测就跑在这种环境下                                                        |
| 纯 Node.js / Bun / Deno（无 DOM polyfill） | ✅       | 从 `@tmagic/form/headless` 引入，不要用 `@tmagic/form` 主入口 |

```ts
// scripts/check-form.ts —— 纯 Node 环境，无需任何 DOM polyfill
import { builtInFields, registerBuiltInFields, registerFields, validateForm } from '@tmagic/form/headless';
import { editorFields } from '@tmagic/editor/headless';

// `builtInFields` 只是数据；未 `app.use(MagicForm)` 时要自己登记
registerBuiltInFields(builtInFields);
registerFields(editorFields);

const error = await validateForm({
  config: [{ type: 'text', name: 'username', text: '用户名', rules: [{ required: true }] }],
  initValues: { username: '' },
});

if (error) {
  console.error(error);
  process.exit(1);
}
```

::: warning 注意
`dialog: true` 依赖 DOM 与已安装的 UI 库（`element-plus` / `tdesign`），在纯 Node 环境中不可用。
:::

::: warning ESM 与 CJS 不要混用
`@tmagic/form/headless` 的 ESM 产物与 `@tmagic/form` 共用同一批模块文件，字段注册表是同一份，两个入口可以混着 `import`。

CJS 产物是两个各自独立的 bundle，注册表不共享。所以同一进程里不要同时 `require('@tmagic/form')` 和 `require('@tmagic/form/headless')`——在一边 `registerField` 另一边读不到，校验会因为「没登记过这个 type」而静默放过。`@tmagic/editor` 与 `@tmagic/design` 的 headless 子路径同理。
:::

## 类型定义

::: details 查看 `SubmitFormOptions` 类型定义
<<< @/../packages/form/src/submitForm.ts#SubmitFormOptions{ts}
:::

::: details 查看 `SubmitFormResult` 类型定义
<<< @/../packages/form/src/submitForm.ts#SubmitFormResult{ts}
:::

# submitForm 函数

以命令式方式调用 `MForm` 组件完成一次表单校验/提交，类似 `ElMessage` 的用法。

调用时函数内部会临时挂载一个不可见的 `MForm` 实例，把入参作为 props 透传给它，等待初始化完成后调用其 `submitForm` 方法。校验通过则 `resolve` 表单值，校验失败则 `reject` 错误信息，最后自动卸载实例并清理 DOM。

适用于一些没有合适的容器、但又需要复用 `MForm` 校验逻辑的场景，例如：

- 通过快捷菜单/命令面板触发一次性表单
- 在脚本/服务层完成一次表单值校验后再发请求
- 把 `config` 配置当作"可执行的校验规则"使用

## 签名

```ts
function submitForm(options: SubmitFormOptions): Promise<any>;
```

## 参数

`options` 与 `MForm` 组件的 props 基本对齐，额外提供了 `native`、`returnChangeRecords`、`appContext`、`timeout` 等参数。

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
| `extendState`          | `(state: FormState) => Record<string, any> \| Promise<Record<string, any>>` | — | 扩展 `formState`                                                              |
| `native`               | `boolean`                                               | `false`    | 透传给 `Form.submitForm`。`true` 时返回内部响应式 `values`，否则返回 `cloneDeep(toRaw(values))`        |
| `returnChangeRecords`  | `boolean`                                               | `false`    | `true` 时 resolve 结果为 `{ values, changeRecords }`，携带表单变更记录；否则仅 resolve `values`        |
| `appContext`           | `AppContext \| null`                                    | `null`     | 父级 Vue 应用上下文。需要继承全局组件、指令、provide 等时传入，常通过 `app._context` 或 `getCurrentInstance()?.appContext` 获取 |
| `timeout`              | `number`                                                | `10000`    | 等待表单初始化的最长时间（毫秒）。超时将以错误 reject。设为 `<= 0` 时关闭超时兜底                       |

## 返回值

- `校验通过` — `Promise<any>` resolve 当前表单值（`native` 决定是否克隆）；当 `returnChangeRecords` 为 `true` 时，resolve `{ values, changeRecords }`
- `校验失败` — `Promise<any>` reject 一个 `Error`，`message` 中包含逐条字段错误信息（格式 `${text} -> ${message}`，多条用 `<br>` 分隔）
- `初始化超时` — `Promise<any>` reject `Error('submitForm timeout after ${timeout}ms: form is not initialized.')`

无论成功或失败，函数都会在最后自动 `unmount` 内部 app 并移除挂载用的 DOM 容器，无需调用方手动清理。

::: tip 关于 changeRecords
`changeRecords` 记录的是表单挂载后发生的字段变更（由各字段的 `change` 事件累积而来）。在 `submitForm` 这种命令式、无用户交互的场景下，通常为空数组；只有在 `extendState` 或字段联动等逻辑中触发了变更时才会有内容。`MForm` 内部的 `submitForm` 在校验通过后会清空变更记录，因此本函数会在调用前先对其做快照再返回。
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
        rules: [{ required: true, message: '请输入用户名' }],
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

## 在组件中继承父级应用上下文

`MForm` 内部使用 `@tmagic/design` 的组件（背后可能是 `element-plus` 或 `tdesign`），需要宿主应用先完成相应的 `app.use(...)` 安装。在 `submitForm` 这种脱离常规组件树的命令式调用中，可通过 `appContext` 把父级应用上下文带过去：

```vue
<script setup lang="ts">
import { getCurrentInstance } from 'vue';

import { submitForm } from '@tmagic/form';

const { appContext } = getCurrentInstance()!;

const onClick = async () => {
  const values = await submitForm({
    config: [{ type: 'text', name: 'text', text: '文本' }],
    initValues: { text: 'hello' },
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

## 运行环境

`submitForm` 内部依赖 `document` / `window` 来挂载临时 Vue 实例，因此**只能在浏览器或具备 DOM 环境的运行时中使用**。

| 环境                                            | 是否可用 | 说明                                                                              |
| ----------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| 浏览器 / Electron 渲染进程 / 浏览器扩展         | ✅       | 直接可用                                                                          |
| Vitest / Jest + `happy-dom` / `jsdom`           | ✅       | 项目自身的单测就跑在这种环境下                                                    |
| 纯 Node.js / Bun / Deno（无 DOM polyfill）      | ❌       | 模块顶层就会读 `document`，会抛 `document is not defined`                         |
| Node.js + 手动注入 `happy-dom` / `jsdom`        | ⚠️       | 可用，需要在 import `@tmagic/form` **之前**完成全局变量注入；校验行为不一定与浏览器完全一致 |

### 在 Node.js 中使用（需要先准备 DOM）

下面是一个在 Node 脚本里调用 `submitForm` 的完整例子，使用 [`happy-dom`](https://github.com/capricorn86/happy-dom) 作为 DOM polyfill：

```ts
// scripts/check-form.ts
import { Window } from 'happy-dom';

const window = new Window();
Object.assign(globalThis, {
  window,
  document: window.document,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
});

// 注意：DOM polyfill 必须先注入到 globalThis，再用动态 import
// 加载业务模块，否则 @tmagic/design 等模块顶层执行时就会读 document
const { createApp } = await import('vue');
const ElementPlus = (await import('element-plus')).default;
const MagicForm = (await import('@tmagic/form')).default;
const { submitForm } = await import('@tmagic/form');

const parentApp = createApp({ render: () => null });
parentApp.use(ElementPlus);
parentApp.use(MagicForm);

const values = await submitForm({
  config: [{ type: 'text', name: 'username', text: '用户名' }],
  initValues: { username: 'foo' },
  appContext: parentApp._context,
});

console.log(values);
```

::: warning 注意
- DOM polyfill 必须在 **import 业务模块之前** 注入到 `globalThis`，否则模块顶层执行时仍会失败
- 在 `happy-dom` / `jsdom` 中，`element-plus` 的部分 `validate()` 行为不一定能 1:1 复现真实浏览器（例如某些场景下必填规则可能不触发），建议关键校验使用自定义 `validator` 函数确保稳定
- 如果只是想在 Node 端做一次纯校验，更稳妥的做法是直接复用 [`async-validator`](https://github.com/yiminghe/async-validator)（element-plus 内部用的就是它），绕开整个 Vue 渲染层
:::

## 类型定义

::: details 查看 `SubmitFormOptions` 类型定义
<<< @/../packages/form/src/submitForm.ts#SubmitFormOptions{ts}
:::

::: details 查看 `SubmitFormResult` 类型定义
<<< @/../packages/form/src/submitForm.ts#SubmitFormResult{ts}
:::

# DSL SDK（`@tmagic/editor/sdk`）

不依赖 DOM / Vue 界面 / 画布的 DSL 操作 SDK，只负责对 DSL 做增删改查、历史撤销重做、依赖收集与合法性校验，可以直接在 Node 中运行（比如给 AI agent 调用的命令行工具使用）。

浏览器端的 `editorService`、`historyService` 等单例就是用同一个工厂创建的默认实例，因此 `import { editorService } from '@tmagic/editor'` 的用法不受影响。

```ts
import { createDslSdk } from '@tmagic/editor/sdk';
```

## 快速开始

```ts
import { createDslSdk } from '@tmagic/editor/sdk';

const sdk = createDslSdk({
  // 初始 DSL，会被深拷贝，不会修改传入的对象
  dsl: { type: 'app', id: 'app_1', items: [{ type: 'page', id: 'page_1', name: 'index', items: [] }] },
  // 此前通过 sdk.serializeHistory() 导出的历史快照（可选）
  // history,
  // 组件列表：用来判断新增的组件类型是否合法
  componentGroupList: [{ title: '基础', items: [{ text: '文本', type: 'text' }] }],
  // 组件属性表单配置，key 是组件 type，值是该组件的表单配置（FormConfig，即表单项数组）：用来校验属性是否合法
  propsConfigs: {
    text: [{ type: 'text', name: 'text', text: '文本', rules: [{ required: true, message: '文本不能为空' }] }],
  },
  // 组件被添加时的初始值，与 propsConfigs 的 key 一一对应
  propsValues: { text: { text: '文本' } },
});

await sdk.ready; // 登记表（含异步的属性配置）全部就绪

// 没有选中节点时，默认添加到第一个页面；id 由 SDK 生成，后续操作使用返回值里的 id
const node = await sdk.editor.add({ type: 'text', text: 'hello' });
await sdk.editor.update({ id: node.id, text: 'world' });
await sdk.editor.undo();

// 属性不合法时（strict 模式）会抛出 DslValidationError，且不会修改 DSL
await sdk.editor.update({ id: node.id, text: '' }).catch((e) => console.log(e.errors)); // [{ ..., message: '文本 -> 文本不能为空' }]

const newDsl = sdk.getDsl(); // 深拷贝，已包含依赖收集结果
const newHistory = sdk.serializeHistory(); // 可 JSON.stringify，下次作为 history 传回
```

::: tip
`propsConfigs` 的格式与 [Editor 的 propsConfigs](./props.md#propsconfigs) 相同。实际项目中通常直接使用 runtime 构建出来的 `magicPresetConfigs` / `magicPresetValues`（参考[快速开始](../../guide/index.md#propsconfigs-propsvalues)），在 Node 中加载构建产物后传入即可。
:::

## 无状态使用

每次调用传入「DSL + 历史快照」，操作完成后导出新的「DSL + 历史快照」：

```ts
const sdk = createDslSdk({ dsl: readJson('dsl.json'), history: readJson('history.json') });
await sdk.editor.update({ id: 'button_1', text: 'new' });
writeJson('dsl.json', sdk.getDsl());
writeJson('history.json', sdk.serializeHistory());
```

::: tip
- `serializeHistory()` 导出的快照可以直接 `JSON.stringify`；浏览器端 `historyService.serialize()` 默认保留 `Map`，适合写入 IndexedDB。
- Node 下默认的 `parseDSL` 只解析 JSON，不会执行代码；如果历史里包含函数 / 正则，请自行传入 `parseDSL`。
:::

## createDslSdk(options)

每次调用返回一组相互连线、互相独立的 service，多个实例互不影响。

### options

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `dsl` | 初始 DSL | - |
| `history` | 历史快照 | - |
| `validateMode` | 校验模式，见[校验](#校验) | `'strict'` |
| `autoWiring` | 是否自动绑定依赖收集连线 | `true` |
| `reactivity` | 响应式实现：`reactive` / `shallowReactive` / `toRaw` / `nextTick`，默认使用 Vue 的实现，可覆盖 | Vue |
| `storage` | 存储适配器（`localStorage` 天然满足），用于复制粘贴、代码块草稿 | 内存实现 `MemoryStorage` |
| `parseDSL` | 把序列化字符串还原成值 | 只解析 JSON |
| `historyPersistence` | 历史持久化适配器 `{ get, set }`（浏览器端对应 IndexedDB），不提供时 `saveToIndexedDB` / `restoreFromIndexedDB` 会 reject | - |
| `collectWorker` | 依赖收集 worker 适配器，不提供则在主线程收集 | - |
| `copyText` / `notify` | 复制到剪贴板、提示信息，不提供则不做任何事 | - |
| `componentGroupList` / `propsConfigs` / `propsValues` / `eventMethodList` / `datasourceList` / `datasourceConfigs` / `datasourceValues` / `datasourceEventMethodList` / `disabledCodeBlock` / `disabledDataSource` / `disabledPageFragment` / `disabledMultiSelect` / `alwaysMultiSelect` / `canDropIn` | 登记表，与 [Editor props](./props.md) 同名项一一对应 | - |

### 返回值

| 属性 | 说明 |
| --- | --- |
| `editor` / `history` / `props` / `dataSource` / `codeBlock` / `dep` / `storage` / `events` / `componentList` | 各 service 实例，方法与浏览器端同名 service 一致 |
| `validate` | 校验器，见[校验](#校验) |
| `ctx` | service 之间共享的上下文 |
| `ready` | 登记表全部就绪后 resolve |
| `getDsl()` | 导出当前 DSL（深拷贝） |
| `setDsl(dsl)` | 整体替换 DSL，会写入历史记录，返回的 Promise 在自动选中节点完成后 resolve |
| `serializeHistory()` | 导出可 JSON 序列化的历史快照 |
| `bindWiring()` | 绑定依赖收集连线（`autoWiring: false` 时手动调用），返回解绑函数。绑定时如果 DSL 已经设置，会立即补做一次依赖收集 |
| `destroy()` | 销毁 |

## 校验

`validateMode` 决定修改 DSL 时如何处理不合法的内容：

- `strict`：修改前校验，不通过抛出 `DslValidationError`（`errors` 里是全部问题），**DSL 不会被修改**，适合给 agent 调用，agent 可以根据 `errors` 修正后重试。Node 下默认。
- `record`：不抛错，把校验结果写进 `editor.state.invalidNodeIds`。
- `off`：不做额外校验。浏览器端默认实例使用这个模式（属性面板自己负责校验）。

可以通过 `sdk.ctx.validateMode = 'off'` 在运行时切换。

校验内容：

| 类别 | 内容 |
| --- | --- |
| 结构（`kind: 'structure'`） | 组件类型是否在组件列表中（`page` / `page-fragment` / `container` 内置合法，组件列表为空时不校验）、父节点是否是容器、`canDropIn`、是否禁用页面片、id 是否重复、不允许修改节点类型、数据源类型是否可用 |
| 属性（`kind: 'props'`） | 用 `@tmagic/form/headless` 的 `validateForm` 校验节点 / 数据源的属性表单配置，包含 `typeMatch` |

```ts
import { DslValidationError } from '@tmagic/editor/sdk';

try {
  await sdk.editor.add({ type: 'unknown' });
} catch (e) {
  if (e instanceof DslValidationError) {
    console.log(e.errors); // [{ target, id, path, kind, message, suggestion }]
  }
}

// 主动校验
await sdk.validate.node('text_1');
await sdk.validate.dataSource('ds_1');
await sdk.validate.dsl();
```

::: warning
- 数据源的 `add` / `update` 是同步方法，只做同步的结构校验（数据源类型是否可用）；属性校验请用 `sdk.validate.dataSource(id)`。
- SDK 内只注册了 `@tmagic/form/headless` 的内置字段，编辑器自定义字段（`data-source-select`、`code-select` 等）的 `typeMatch` 依赖编辑器的单例 service，不在 SDK 校验范围内；需要时可在浏览器环境下通过 `@tmagic/editor/headless` 的 `editorFields` 注册。
:::

## 依赖收集

`autoWiring` 为 `true` 时，节点、数据源、代码块发生变化会同步收集依赖，并把结果写回 DSL 的 `dataSourceDeps` / `dataSourceCondDeps` / `dataSourceMethodDeps`，所以操作返回时导出的 DSL 依赖信息已经是最新的。

不需要依赖收集（只做 DSL 增删改）时可以传 `autoWiring: false`，之后需要时再调用 `sdk.bindWiring()`；注意关闭期间不会同步数据源 / 代码块与依赖目标，也不会自动选中页面。

## 插件

所有 service 都支持 `usePlugin`，与浏览器端一致：

```ts
sdk.editor.usePlugin({
  beforeAdd(addNode, parent) {
    return [addNode, parent];
  },
});
```

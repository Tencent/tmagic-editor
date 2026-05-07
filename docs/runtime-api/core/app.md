# App

`App` 是 `@tmagic/core` 的核心类，继承自 `EventEmitter`，用于管理整个应用的状态和配置。

## 构造函数

```typescript
new App(options: AppOptionsConfig)
```

### AppOptionsConfig

| 参数 | 类型 | 说明 |
|------|------|------|
| `ua` | `string` | User Agent 字符串 |
| `env` | `Env` | 环境信息实例 |
| `config` | `MApp` | DSL 配置 |
| `platform` | `'editor' \| 'mobile' \| 'tv' \| 'pc'` | 平台类型 |
| `jsEngine` | `JsEngine` | JS 引擎类型 |
| `designWidth` | `number` | 设计稿宽度 |
| `curPage` | `Id` | 当前页面 ID |
| `useMock` | `boolean` | 是否使用 Mock 数据 |
| `disabledFlexible` | `boolean` | 是否禁用 flexible |
| `pageFragmentContainerType` | `string \| string[]` | 页面片段容器类型 |
| `iteratorContainerType` | `string \| string[]` | 迭代器容器类型 |
| `transformStyle` | `(style: Record<string, any>) => Record<string, any>` | 样式转换函数 |
| `request` | `RequestFunction` | 请求函数 |
| `dataSourceManagerInitialData` | `DataSourceManagerData` | 数据源管理器初始数据 |
| `nodeStoreInitialData` | `() => any` | 节点存储初始数据工厂函数 |
| `errorHandler` | `ErrorHandler` | 错误处理器 |
| `beforeEventHandler` | `BeforeEventHandler` | 事件处理前钩子 |
| `afterEventHandler` | `AfterEventHandler` | 事件处理后钩子 |

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `env` | `Env` | 环境信息实例 |
| `dsl` | `MApp \| undefined` | DSL 配置 |
| `codeDsl` | `CodeBlockDSL \| undefined` | 代码块配置 |
| `dataSourceManager` | `DataSourceManager \| undefined` | 数据源管理器 |
| `page` | `Page \| undefined` | 当前页面 |
| `pageFragments` | `Map<Id, Page>` | 页面片段集合 |
| `platform` | `string` | 平台类型 |
| `jsEngine` | `JsEngine` | JS 引擎类型 |
| `components` | `Map<string, any>` | 已注册的组件 |
| `eventHelper` | `EventHelper \| undefined` | 事件助手实例（仅当 `platform !== 'editor'` 时创建） |
| `useMock` | `boolean` | 是否使用 Mock 数据，默认 `false` |
| `request` | `RequestFunction \| undefined` | 请求函数 |
| `transformStyle` | `(style: Record<string, any>) => Record<string, any>` | 样式转换函数 |
| `pageFragmentContainerType` | `Set<string>` | 页面片段容器类型集合，默认包含 `page-fragment-container` |
| `iteratorContainerType` | `Set<string>` | 迭代器容器类型集合，默认包含 `iterator-container` |
| `errorHandler` | `ErrorHandler \| undefined` | 错误处理器 |
| `nodeStoreInitialData` | `(() => any) \| undefined` | 节点存储初始数据工厂函数 |

## 静态属性

### nodeClassMap

- **类型：** `Map<string, typeof Node>`

- **详情：**

  自定义节点类型的映射表，由 `App.registerNode` 写入；`Page` 在初始化节点时会按 `config.type` 从此 Map 中查找对应的节点类，未命中则回退到默认 `Node`。

## 静态方法

### registerNode

- **参数：**
  - `{string} type` 节点类型
  - `{typeof Node} NodeClass` 节点类

- **返回：**
  - `{void}`

- **详情：**

  注册自定义节点类型，用于扩展节点功能。内部会将 `NodeClass` 写入 `App.nodeClassMap`。

- **示例：**

```typescript
import App from '@tmagic/core';

class CustomNode extends Node {
  // 自定义实现
}

App.registerNode('custom', CustomNode);
```

## 实例方法

### setEnv

- **参数：**
  - `{string | Env} ua` User Agent 字符串或 `Env` 实例（可选）

- **返回：**
  - `{void}`

- **详情：**

  设置环境信息。当传入字符串（或不传）时，会基于 UA 创建一个新的 `Env` 实例并赋值给 `env` 属性；当传入 `Env` 实例时，直接将其设置为当前 `env`。

- **示例：**

```typescript
import App, { Env } from '@tmagic/core';

const app = new App({});
app.setEnv(navigator.userAgent);

// 也可以直接传入已创建的 Env 实例
app.setEnv(new Env(navigator.userAgent));
```

### setDesignWidth

- **参数：**
  - `{number} width` 设计稿宽度

- **返回：**
  - `{void}`

- **详情：**

  设置设计稿宽度，用于响应式布局计算。

- **示例：**

```typescript
app.setDesignWidth(375);
```

### setConfig

- **参数：**
  - `{MApp} config` DSL 配置
  - `{Id} curPage` 当前页面 ID（可选）
  - `{DataSourceManagerData} initialData` 初始数据（可选）

- **返回：**
  - `void`

- **详情：**

  设置 DSL 配置，会初始化数据源管理器和当前页面。

- **示例：**

```typescript
app.setConfig({
  id: 'app_1',
  type: 'app',
  items: [
    {
      id: 'page_1',
      type: 'page',
      items: []
    }
  ]
});
```

### setPage

- **参数：**
  - `{Id} id` 页面 ID

- **返回：**
  - `{void}`

- **详情：**

  切换当前页面。

- **示例：**

```typescript
app.setPage('page_2');
```

### deletePage

- **返回：**
  - `{void}`

- **详情：**

  删除当前页面。

### getPage

- **参数：**
  - `{Id} id` 页面 ID（可选）

- **返回：**
  - `{Page | undefined}`

- **详情：**

  获取页面：不传 `id` 时返回当前 `this.page`；传入 `id` 时，仅当其与当前 `this.page.data.id` 一致时返回该页面，否则返回 `undefined`。该方法不会按 DSL 遍历所有页面查找。

- **示例：**

```typescript
const page = app.getPage('page_1');
```

### getNode

- **参数：**
  - `{Id} id` 节点 ID
  - `{GetNodeOptions} options` 获取选项（可选）

- **返回：**
  - `{Node | undefined}`

- **详情：**

  获取指定 ID 的节点。

- **GetNodeOptions：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `iteratorContainerId` | `Id[]` | 迭代器容器 ID 数组 |
| `iteratorIndex` | `number[]` | 迭代器索引数组 |
| `pageFragmentContainerId` | `Id` | 页面片段容器 ID |
| `strict` | `boolean` | 是否严格模式 |

- **示例：**

```typescript
const node = app.getNode('button_1');
```

### registerComponent

- **参数：**
  - `{string} type` 组件类型
  - `{any} Component` 组件

- **返回：**
  - `{void}`

- **详情：**

  注册组件。

- **示例：**

```typescript
app.registerComponent('my-button', MyButton);
```

### unregisterComponent

- **参数：**
  - `{string} type` 组件类型

- **返回：**
  - `{void}`

- **详情：**

  取消注册组件。

### resolveComponent

- **参数：**
  - `{string} type` 组件类型

- **返回：**
  - `{any}`

- **详情：**

  解析组件，返回已注册的组件。

### emit

- **参数：**
  - `{string | symbol} name` 事件名
  - `{...any[]} args` 事件参数；约定第一个参数为触发事件的 `Node` 实例

- **返回：**
  - `{boolean}`

- **详情：**

  重写自 `EventEmitter.emit`。当第一个参数是 `Node` 实例，并且该节点的 `eventKeys` 中存在 `${name}_${node.data.id}` 时，会将事件经由 `EventHelper` 用对应的 `Symbol` 转发（即触发联动事件配置）；否则按 `EventEmitter` 默认逻辑触发。

### runCode

- **参数：**
  - `{Id} codeId` 代码块 ID
  - `{object} params` 参数
  - `{any[]} args` 额外参数
  - `{FlowState} flowState` 流程状态（可选）
  - `{Node} node` 节点（可选）

- **返回：**
  - `{Promise<void>}` 该方法不会显式返回代码块的返回值。如需获取代码块结果，需在代码块内自行通过 `params`/`flowState` 等回写。

- **详情：**

  执行代码块。当 `codeId` 为空、`codeDsl` 为空，或代码块的 `content` 不是函数时直接返回；否则 `await` 执行代码块函数。如果执行过程中抛出异常，存在 `errorHandler` 时会交由其处理，否则继续抛出。

- **示例：**

```typescript
await app.runCode('code_1', { key: 'value' });
```

### runDataSourceMethod

- **参数：**
  - `{Id} dsId` 数据源 ID
  - `{string} methodName` 方法名
  - `{object} params` 参数
  - `{any[]} args` 额外参数
  - `{FlowState} flowState` 流程状态（可选）
  - `{Node} node` 节点（可选）

- **返回：**
  - `{Promise<any | undefined>}` 取决于数据源方法的返回值。当 `dsId`、`methodName` 缺失，或数据源不存在、未匹配到方法时，返回 `undefined`。

- **详情：**

  执行数据源方法。如果执行过程中抛出异常，存在 `errorHandler` 时会交由其处理，否则继续抛出。

- **示例：**

```typescript
const result = await app.runDataSourceMethod('ds_1', 'fetchData', { id: 123 });
```

### destroy

- **返回：**
  - `{void}`

- **详情：**

  销毁应用实例，清理所有资源。

- **示例：**

```typescript
app.destroy();
```

## 事件

`App` 继承自 `EventEmitter`，会通过 `super.emit` 触发以下事件：

| 事件名 | 触发时机 | 回调参数 |
|--------|----------|----------|
| `dsl-change` | 调用 `setConfig` 时触发 | `({ dsl: MApp, curPage: Id })` |
| `page-change` | 调用 `setPage` 切换页面时触发；切换到不存在的页面时也会触发，此时回调无参数。**注意**：当 `pageConfig === this.page.data`（重复 setPage 到当前页）时会直接 `return`，**不**触发该事件 | `(page?: Page)` |

### 监听示例

```typescript
app.on('dsl-change', ({ dsl, curPage }) => {
  console.log('DSL 已更新', dsl, curPage);
});

app.on('page-change', (page) => {
  console.log('当前页面切换为', page?.data?.id);
});
```

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
| `dsl` | `MApp` | DSL 配置 |
| `codeDsl` | `CodeBlockDSL` | 代码块配置 |
| `dataSourceManager` | `DataSourceManager \| undefined` | 数据源管理器 |
| `page` | `Page \| undefined` | 当前页面 |
| `pageFragments` | `Map<Id, Page>` | 页面片段集合 |
| `platform` | `string` | 平台类型 |
| `jsEngine` | `JsEngine` | JS 引擎类型 |
| `components` | `Map<string, any>` | 已注册的组件 |
| `eventHelper` | `EventHelper` | 事件助手实例 |

## 静态方法

### registerNode

- **参数：**
  - `{string} type` 节点类型
  - `{typeof Node} NodeClass` 节点类

- **返回：**
  - `{void}`

- **详情：**

  注册自定义节点类型，用于扩展节点功能。

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
  - `{string} ua` User Agent 字符串

- **返回：**
  - `{void}`

- **详情：**

  设置环境信息，会根据 UA 字符串更新 `env` 属性。

- **示例：**

```typescript
import App from '@tmagic/core';

const app = new App({});
app.setEnv(navigator.userAgent);
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

  获取指定 ID 的页面，不传 ID 则返回当前页面。

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

### runCode

- **参数：**
  - `{Id} codeId` 代码块 ID
  - `{object} params` 参数
  - `{any[]} args` 额外参数
  - `{FlowState} flowState` 流程状态（可选）
  - `{Node} node` 节点（可选）

- **返回：**
  - `{any}`

- **详情：**

  执行代码块。

- **示例：**

```typescript
const result = await app.runCode('code_1', { key: 'value' });
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
  - `{any}`

- **详情：**

  执行数据源方法。

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

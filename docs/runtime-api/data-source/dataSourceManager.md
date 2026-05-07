# DataSourceManager

`DataSourceManager` 是 `@tmagic/data-source` 的核心类，用于管理所有数据源的生命周期、数据编译和事件分发。

## 构造函数

```typescript
new DataSourceManager(options: DataSourceManagerOptions)
```

### DataSourceManagerOptions

| 参数 | 类型 | 说明 |
|------|------|------|
| `app` | `TMagicApp` | 应用实例 |
| `initialData` | `DataSourceManagerData` | 初始数据（可选，用于 SSR） |
| `useMock` | `boolean` | 是否使用 Mock 数据（可选） |

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `app` | `TMagicApp` | 应用实例 |
| `dataSourceMap` | `Map<string, DataSource>` | 数据源映射表 |
| `data` | `DataSourceManagerData` | 所有数据源的数据 |
| `initialData` | `DataSourceManagerData` | 初始化数据 |
| `useMock` | `boolean` | 是否使用 Mock 数据 |

## 静态方法

### register

- **参数：**
  - `{string} type` 数据源类型
  - `{typeof DataSource} dataSourceClass` 数据源类

- **返回：**
  - `{void}`

- **详情：**

  注册自定义数据源类型。

- **示例：**

```typescript
import { DataSourceManager } from '@tmagic/data-source';

class CustomDataSource extends DataSource {
  // 自定义实现
}

DataSourceManager.register('custom', CustomDataSource);
```

### getDataSourceClass

- **参数：**
  - `{string} type` 数据源类型

- **返回：**
  - `{typeof DataSource | undefined}`

- **详情：**

  获取已注册的数据源类。

### clearDataSourceClass

- **返回：**
  - `{void}`

- **详情：**

  清除所有已注册的数据源类（保留 `base` 和 `http`）。

### registerObservedData

- **参数：**
  - `{ObservedDataClass} observedDataClass` 观察者数据类

- **返回：**
  - `{void}`

- **详情：**

  注册自定义的观察者数据类。

## 实例方法

### init

- **参数：**
  - `{DataSource} ds` 单个数据源实例（必填）

- **返回：**
  - `{Promise<void>}`

- **详情：**

  初始化单个数据源。会按 `methods` 中 `timing === 'beforeInit'` 的方法依次执行，再调用 `ds.init()`，最后执行 `timing === 'afterInit'` 的方法。当 `ds.isInit` 为 `true`，或当前 `app.jsEngine` 命中 `ds.schema.disabledInitInJsEngine` 时直接跳过。

- **示例：**

```typescript
const ds = dataSourceManager.get('ds_1');
if (ds) {
  await dataSourceManager.init(ds);
}
```

### get

- **参数：**
  - `{string} id` 数据源 ID

- **返回：**
  - `{DataSource | undefined}`

- **详情：**

  获取指定 ID 的数据源实例。

- **示例：**

```typescript
const ds = dataSourceManager.get('ds_1');
```

### addDataSource

- **参数：**
  - `{DataSourceSchema} config` 数据源配置（可选）

- **返回：**
  - `{DataSource | undefined}`

- **详情：**

  添加新的数据源。当对应类型尚未注册（即 `dataSourceClassMap` 中无该类型）时，会将配置缓存到 `waitInitSchemaList`，并返回 `undefined`，待 `register` 时再补建实例。

- **示例：**

```typescript
const ds = dataSourceManager.addDataSource({
  id: 'new_ds',
  type: 'base',
  fields: []
});
```

### removeDataSource

- **参数：**
  - `{string} id` 数据源 ID

- **返回：**
  - `{void}`

- **详情：**

  移除指定的数据源。

### setData

- **参数：**
  - `{DataSource} ds` 数据源实例
  - `{ChangeEvent} changeEvent` 变化事件，形如 `{ updateData, path? }`

- **返回：**
  - `{void}`

- **详情：**

  将 `ds.data` 同步到 `this.data[ds.id]`，并以 `(ds.id, changeEvent)` 触发 `change` 事件。

### updateSchema

- **参数：**
  - `{DataSourceSchema[]} schemas` 数据源配置数组

- **返回：**
  - `{void}`

- **详情：**

  同步更新数据源 DSL 配置：先按 `id` 移除已有数据源，再以 `cloneDeep` 重新 `addDataSource`，并对新建实例触发 `init`（异步执行，不会被该方法 `await`）。一般在编辑器中修改配置后调用。

### compiledNode

- **参数：**
  - `{MNode} node` 节点配置
  - `{string} sourceId` 数据源 ID（可选）
  - `{boolean} deep` 是否深度编译（可选）

- **返回：**
  - `{MNode}`

- **详情：**

  编译节点 DSL 中的数据源配置，将数据源引用替换为实际值。

- **示例：**

```typescript
const compiledNode = dataSourceManager.compiledNode({
  id: 'text_1',
  type: 'text',
  text: '${ds_1.username}'
});
// compiledNode.text 会被替换为实际的用户名
```

### compliedConds

- **参数：**
  - `{ { [NODE_CONDS_KEY]?: DisplayCond[]; [NODE_CONDS_RESULT_KEY]?: boolean; [NODE_DISABLE_DATA_SOURCE_KEY]?: boolean } } node` 带条件字段的结构（不要求是完整的 MNode）
  - `{DataSourceManagerData} data` 数据上下文（可选，默认使用 `this.data`）

- **返回：**
  - `{boolean}` 节点是否应该显示

- **详情：**

  编译显示条件，返回节点是否应该显示。

- **示例：**

```typescript
const shouldShow = dataSourceManager.compliedConds(node);
```

### compliedIteratorItemConds

- **参数：**
  - `{any} itemData` 迭代项数据
  - `{ { [NODE_CONDS_KEY]?: DisplayCond[] } } node` 带条件字段的结构
  - `{string[]} dataSourceField` 迭代数据在数据源中的字段路径，格式如 `['dsId', 'key1', 'key2']`（可选，默认 `[]`）

- **返回：**
  - `{boolean}`

- **详情：**

  编译迭代器项的显示条件。

### compliedIteratorItems

- **参数：**
  - `{any} itemData` 迭代项数据
  - `{MNode[]} nodes` 节点配置数组
  - `{string[]} dataSourceField` 迭代数据在数据源中的字段路径（可选，默认 `[]`）

- **返回：**
  - `{MNode[]}`

- **详情：**

  编译迭代器项的节点配置。

### isAllDataSourceRegistered

- **返回：**
  - `{boolean}`

- **详情：**

  判断 DSL 中声明的所有数据源是否都已注册并实例化（即 `dataSourceMap.size === dsl.dataSources.length`，或 DSL 未声明数据源）。

  ::: tip `registered-all` 触发时机
  `registered-all` 事件**仅**在 `addDataSource` 末尾、`isAllDataSourceRegistered()` 为真时触发。当 `dsl.dataSources` 为空数组时，构造函数不会进入任何一次 `addDataSource` 调用，因此**不会**触发该事件，但仍可能执行 `callDsInit()`。
  :::

### onDataChange

- **参数：**
  - `{string} id` 数据源 ID
  - `{string} path` 数据路径
  - `{(payload: any) => void} callback` 回调函数（具体入参取决于 `ObservedData` 实现，详见 [DataSource.onDataChange](./dataSource.md#ondatachange)）
  - `{ { immediate?: boolean } } options` 选项（可选）

- **返回：**
  - `{void}`

- **详情：**

  监听数据源数据变化。`options.immediate` 为 `true` 时，订阅后立即用当前值触发一次回调（具体语义取决于 `ObservedData` 的实现）。

- **示例：**

```typescript
dataSourceManager.onDataChange('ds_1', 'user.name', (newVal) => {
  console.log('用户名变更:', newVal);
});
```

### offDataChange

- **参数：**
  - `{string} id` 数据源 ID
  - `{string} path` 数据路径
  - `{(newVal: any) => void} callback` 回调函数

- **返回：**
  - `{void}`

- **详情：**

  取消监听数据源数据变化。

### destroy

- **返回：**
  - `{void}`

- **详情：**

  销毁数据源管理器，清理所有数据源。

## 事件

DataSourceManager 继承自 EventEmitter，支持以下事件：

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `change` | 单个数据源数据变化 | `(dsId: string, changeEvent: ChangeEvent)` |
| `init` | 所有数据源初始化完成；现代分支携带 `(data, errors)`，旧 Promise.all 分支为 `(this.data)` | `(data, errors?)` |
| `registered-all` | 所有数据源注册完成 | 无 |
| `update-data` | 由 `createDataSourceManager` 在数据变化后发出，用于通知节点重新渲染 | `(newNodes: MNode[], sourceId: string, changeEvent: ChangeEvent, pageId: Id)` |

### 事件监听示例

```typescript
dataSourceManager.on('change', (dsId, changeEvent) => {
  console.log(`数据源 ${dsId} 变更:`, changeEvent);
});

dataSourceManager.on('init', (data, errors) => {
  console.log('所有数据源初始化完成', data, errors);
});
```

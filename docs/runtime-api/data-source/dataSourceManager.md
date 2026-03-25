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
  - `{DataSourceSchema[]} ds` 数据源配置数组

- **返回：**
  - `{Promise<void>}`

- **详情：**

  初始化数据源，会创建所有配置的数据源实例并初始化。

- **示例：**

```typescript
await dataSourceManager.init([
  {
    id: 'ds_1',
    type: 'base',
    fields: [{ name: 'count', defaultValue: 0 }]
  },
  {
    id: 'http_1',
    type: 'http',
    options: { url: '/api/data' }
  }
]);
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
  - `{DataSourceSchema} config` 数据源配置

- **返回：**
  - `{DataSource}`

- **详情：**

  添加新的数据源。

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
  - `{DataSourceSchema} ds` 数据源配置
  - `{ChangeEvent} changeEvent` 变化事件（可选）

- **返回：**
  - `{void}`

- **详情：**

  设置数据源数据。

### updateSchema

- **参数：**
  - `{DataSourceSchema[]} schemas` 数据源配置数组

- **返回：**
  - `{Promise<void>}`

- **详情：**

  更新数据源 DSL 配置，会自动处理新增、更新和删除。

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
  - `{MNode} node` 节点配置
  - `{object} data` 数据上下文（可选）

- **返回：**
  - `{boolean}`

- **详情：**

  编译显示条件，返回节点是否应该显示。

- **示例：**

```typescript
const shouldShow = dataSourceManager.compliedConds(node);
```

### compliedIteratorItemConds

- **参数：**
  - `{object} itemData` 迭代项数据
  - `{MNode} node` 节点配置
  - `{string} field` 条件字段名

- **返回：**
  - `{boolean}`

- **详情：**

  编译迭代器项的显示条件。

### compliedIteratorItems

- **参数：**
  - `{object} itemData` 迭代项数据
  - `{MNode[]} nodes` 节点配置数组
  - `{string} field` 字段名

- **返回：**
  - `{MNode[]}`

- **详情：**

  编译迭代器项的节点配置。

### onDataChange

- **参数：**
  - `{string} id` 数据源 ID
  - `{string} path` 数据路径
  - `{Function} callback` 回调函数

- **返回：**
  - `{void}`

- **详情：**

  监听数据源数据变化。

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
  - `{Function} callback` 回调函数

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
| `change` | 数据源数据变化 | `(dsId, path, newVal)` |
| `init` | 所有数据源初始化完成 | 无 |
| `registered-all` | 所有数据源注册完成 | 无 |
| `update-data` | 更新节点数据 | `(node, sourceId)` |

### 事件监听示例

```typescript
dataSourceManager.on('change', (dsId, path, newVal) => {
  console.log(`数据源 ${dsId} 的 ${path} 变更为:`, newVal);
});

dataSourceManager.on('init', () => {
  console.log('所有数据源初始化完成');
});
```

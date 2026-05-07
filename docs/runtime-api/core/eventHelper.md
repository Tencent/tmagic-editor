# EventHelper

`EventHelper` 是 `@tmagic/core` 的事件助手类，继承自 `EventEmitter`，用于管理组件间的事件联动。

## 构造函数

```typescript
new EventHelper(options: EventHelperOptions)
```

### EventHelperOptions

| 参数 | 类型 | 说明 |
|------|------|------|
| `app` | `App` | 应用实例 |
| `beforeEventHandler` | `BeforeEventHandler` | 事件处理前钩子（可选），形如 `({ eventConfig, source, args }) => void` |
| `afterEventHandler` | `AfterEventHandler` | 事件处理后钩子（可选），形如 `({ eventConfig, source, args }) => void` |

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `app` | `App` | 应用实例 |
| `eventQueue` | `EventCache[]` | 暂存的待处理事件队列（参见 `getEventQueue`） |

## 实例方法

### initEvents

- **返回：**
  - `{void}`

- **详情：**

  初始化所有节点的事件。通常在页面加载时调用。

- **示例：**

```typescript
eventHelper.initEvents();
```

### bindNodeEvents

- **参数：**
  - `{Node} node` 节点实例

- **返回：**
  - `{void}`

- **详情：**

  为单个节点绑定事件处理。

- **示例：**

```typescript
eventHelper.bindNodeEvents(node);
```

### removeNodeEvents

- **返回：**
  - `{void}`

- **详情：**

  移除所有节点的事件绑定。

### bindDataSourceEvents

- **返回：**
  - `{void}`

- **详情：**

  绑定数据源事件，监听数据源变化并触发相应的组件更新。

### removeDataSourceEvents

- **参数：**
  - `{DataSource[]} dataSourceList` 数据源实例列表（必填）

- **返回：**
  - `{void}`

- **详情：**

  移除给定数据源的事件绑定。内部根据已注册的事件名前缀，调用 `dataSource.offDataChange` 或 `dataSource.off` 注销监听，并清空 `dataSourceEventList`。

### getEventQueue

- **返回：**
  - `{EventCache[]}` 事件缓存项数组，每项形如 `{ toId: Id, method: string, fromCpt: any, args: any[], handled?: boolean }`

- **详情：**

  获取当前事件队列。当目标节点尚未挂载时，联动事件会被缓存到此队列；目标节点 `mounted` 后，会消费匹配项并调用其 `instance` 上的对应方法。

### addEventToQueue

- **参数：**
  - `{EventCache} event` 事件缓存项，形如 `{ toId: Id, method: string, fromCpt: any, args: any[] }`

- **返回：**
  - `{void}`

- **详情：**

  将事件添加到队列中等待处理。

### destroy

- **返回：**
  - `{void}`

- **详情：**

  销毁事件助手，清理所有事件绑定。

## 支持的动作类型

EventHelper 支持以下动作类型（ActionType）：

| 类型 | 说明 |
|------|------|
| `ActionType.COMP` | 组件动作，调用目标组件的方法 |
| `ActionType.CODE` | 代码块执行 |
| `ActionType.DATA_SOURCE` | 数据源方法调用 |

### 事件配置示例

```typescript
const eventConfig = {
  name: 'click',
  actions: [
    {
      actionType: 'comp',
      to: 'button_2',
      method: 'show'
    },
    {
      actionType: 'code',
      codeId: 'code_1'
    },
    {
      actionType: 'dataSource',
      dataSourceId: 'ds_1',
      methodName: 'fetchData'
    }
  ]
};
```

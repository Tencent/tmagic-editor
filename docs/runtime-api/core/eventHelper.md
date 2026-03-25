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

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `app` | `App` | 应用实例 |

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
  - `{DataSourceSchema[]} dataSourceList` 数据源列表（可选）

- **返回：**
  - `{void}`

- **详情：**

  移除数据源事件绑定。

### getEventQueue

- **返回：**
  - `{EventConfig[]}`

- **详情：**

  获取当前事件队列。

### addEventToQueue

- **参数：**
  - `{EventConfig} event` 事件配置

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

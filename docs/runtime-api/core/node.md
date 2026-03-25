# Node

`Node` 是 `@tmagic/core` 的节点基类，继承自 `EventEmitter`，表示 DSL 中的一个节点。

## 构造函数

```typescript
new Node(options: NodeOptions)
```

### NodeOptions

| 参数 | 类型 | 说明 |
|------|------|------|
| `config` | `MNode` | 节点配置 |
| `parent` | `Node` | 父节点（可选） |
| `page` | `Page` | 所属页面 |
| `app` | `App` | 应用实例 |

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `data` | `MNode` | 节点配置数据 |
| `style` | `object` | 节点样式 |
| `events` | `EventConfig[]` | 事件配置 |
| `instance` | `any` | 组件实例 |
| `page` | `Page` | 所属页面 |
| `parent` | `Node \| undefined` | 父节点 |
| `app` | `App` | 应用实例 |
| `store` | `Store` | 节点存储 |
| `eventKeys` | `Map<string, symbol>` | 事件键映射 |

## 实例方法

### setData

- **参数：**
  - `{MNode} data` 节点数据

- **返回：**
  - `{void}`

- **详情：**

  设置节点数据，会更新 `data`、`style` 和 `events` 属性。

- **示例：**

```typescript
node.setData({
  id: 'button_1',
  type: 'button',
  style: { width: 100 },
  events: []
});
```

### addEventToQueue

- **参数：**
  - `{EventConfig} event` 事件配置

- **返回：**
  - `{void}`

- **详情：**

  将事件添加到事件队列，等待绑定到组件实例。

### setInstance

- **参数：**
  - `{any} instance` 组件实例

- **返回：**
  - `{void}`

- **详情：**

  设置组件实例，并绑定队列中的事件。

- **示例：**

```typescript
// 通常在组件挂载时调用
node.setInstance(componentInstance);
```

### runHookCode

- **参数：**
  - `{'created' | 'mounted'} hook` 钩子名称
  - `{object} params` 参数

- **返回：**
  - `{Promise<any>}`

- **详情：**

  执行节点的钩子代码。

- **示例：**

```typescript
await node.runHookCode('mounted', { data: someData });
```

### destroy

- **返回：**
  - `{void}`

- **详情：**

  销毁节点，清理事件监听和组件实例。

## 生命周期事件

Node 实例会触发以下生命周期事件：

| 事件名 | 说明 |
|--------|------|
| `created` | 组件创建完成时触发 |
| `mounted` | 组件挂载完成时触发 |
| `destroy` | 组件销毁时触发 |
| `update-data` | 数据更新时触发 |

### 监听示例

```typescript
node.on('mounted', () => {
  console.log('组件已挂载');
});

node.on('update-data', (newData) => {
  console.log('数据已更新', newData);
});
```

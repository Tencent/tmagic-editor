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
| `page` | `Page` | 所属页面（可选） |
| `app` | `App` | 应用实例 |

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `data` | `MNode` | 节点配置数据 |
| `style` | `object` | 节点样式 |
| `events` | `EventConfig[]` | 事件配置 |
| `instance` | `any` | 组件实例 |
| `page` | `Page \| undefined` | 所属页面 |
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
  - `{EventCache} event` 待处理事件项；类型为 `{ method: string, fromCpt: any, args: any[] }`

- **返回：**
  - `{void}`

- **详情：**

  将事件添加到节点内部的事件队列，等待组件实例 `mounted` 后再依次调用对应的方法（`instance[event.method](event.fromCpt, ...event.args)`）。

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

### registerMethod

::: warning @deprecated
该方法已废弃，请使用 `setInstance` 替代。
:::

- **参数：**
  - `{Methods} methods` 方法集合，形如 `{ [name: string]: (...args: any[]) => any }`

- **返回：**
  - `{void}`

- **详情：**

  将给定方法挂载到 `instance` 上。如果当前 `instance` 不存在，会先创建一个空对象再合并方法。

### runHookCode

- **参数：**
  - `{string} hook` 钩子名称（如 `'created'`、`'mounted'`、`'destroy'` 等，由节点 schema 决定）
  - `{object} params` 参数（可选）

- **返回：**
  - `{Promise<void>}`

- **详情：**

  执行节点的钩子代码。内部会根据节点 schema 中 `hook` 字段的实际形态进行处理：

  - 兼容旧格式：当 `data[hook]` 直接是函数时，作为函数调用；
  - 新格式：当 `data[hook]` 是 `{ hookType, hookData[] }` 且 `hookType === HookType.CODE` 时，按顺序遍历 `hookData`，根据 `codeType` 调用 `app.runCode` 或 `app.runDataSourceMethod`。

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

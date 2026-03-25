# IteratorContainer

`IteratorContainer` 是 `@tmagic/core` 的迭代容器类，继承自 `Node`，用于循环渲染的容器组件。

## 构造函数

```typescript
new IteratorContainer(options: NodeOptions)
```

参数与 [Node](./node.md) 构造函数相同。

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `nodes` | `Map<Id, Node>[]` | 每个迭代项的节点映射数组 |

继承自 Node 的属性请参见 [Node 属性](./node.md#属性)。

## 实例方法

### setData

- **参数：**
  - `{MNode} data` 节点数据

- **返回：**
  - `{void}`

- **详情：**

  设置数据，会重置所有迭代项的节点。

- **示例：**

```typescript
iteratorContainer.setData({
  id: 'iterator_1',
  type: 'iterator-container',
  iteratorData: [{ name: 'item1' }, { name: 'item2' }],
  items: [/* 子节点配置 */]
});
```

### resetNodes

- **返回：**
  - `{void}`

- **详情：**

  重置所有迭代项的节点，会清空并重新初始化。

### initNode

- **参数：**
  - `{MNode} config` 节点配置
  - `{Node} parent` 父节点
  - `{Map<Id, Node>} map` 节点映射表

- **返回：**
  - `{Node}`

- **详情：**

  在指定的节点映射表中初始化节点。

### setNodes

- **参数：**
  - `{Map<Id, Node>} nodes` 节点映射表
  - `{number} index` 迭代索引

- **返回：**
  - `{void}`

- **详情：**

  设置指定索引的节点映射表。

- **示例：**

```typescript
iteratorContainer.setNodes(nodesMap, 0);
```

### getNode

- **参数：**
  - `{Id} id` 节点 ID
  - `{number} index` 迭代索引（可选，默认为 0）

- **返回：**
  - `{Node | undefined}`

- **详情：**

  获取指定迭代索引中的节点。

- **示例：**

```typescript
// 获取第一个迭代项中的节点
const node = iteratorContainer.getNode('button_1', 0);

// 获取第二个迭代项中的节点
const node2 = iteratorContainer.getNode('button_1', 1);
```

### destroy

- **返回：**
  - `{void}`

- **详情：**

  销毁迭代容器及其所有迭代项的节点。

## 使用场景

IteratorContainer 常用于列表渲染场景，例如：

```typescript
// DSL 配置示例
const iteratorConfig = {
  id: 'iterator_1',
  type: 'iterator-container',
  iteratorData: [
    { id: 1, title: '项目1' },
    { id: 2, title: '项目2' },
    { id: 3, title: '项目3' }
  ],
  items: [
    {
      id: 'text_tpl',
      type: 'text',
      text: '${item.title}'
    }
  ]
};
```

# Page

`Page` 是 `@tmagic/core` 的页面类，继承自 `Node`，用于管理页面及其子节点。

## 构造函数

```typescript
new Page(options: PageOptions)
```

### PageOptions

继承自 NodeOptions，参见 [Node](./node.md) 构造函数。

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `nodes` | `Map<Id, Node>` | 页面内所有节点的映射表 |

继承自 Node 的属性请参见 [Node 属性](./node.md#属性)。

## 实例方法

### initNode

- **参数：**
  - `{MNode} config` 节点配置
  - `{Node} parent` 父节点（可选）

- **返回：**
  - `{Node}`

- **详情：**

  初始化节点，根据配置创建节点实例并添加到页面。会递归初始化子节点。

- **示例：**

```typescript
const node = page.initNode({
  id: 'button_1',
  type: 'button',
  style: { width: 100 }
});
```

### getNode

- **参数：**
  - `{Id} id` 节点 ID
  - `{GetNodeOptions} options` 获取选项（可选）

- **返回：**
  - `{Node | undefined}`

- **详情：**

  获取页面中指定 ID 的节点。支持从迭代器容器和页面片段中获取节点。

- **GetNodeOptions：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `iteratorContainerId` | `Id[]` | 迭代器容器 ID 数组 |
| `iteratorIndex` | `number[]` | 迭代器索引数组 |
| `pageFragmentContainerId` | `Id` | 页面片段容器 ID |
| `strict` | `boolean` | 是否严格模式 |

- **示例：**

```typescript
const node = page.getNode('button_1');

// 从迭代器中获取
const iteratorNode = page.getNode('item_1', {
  iteratorContainerId: ['iterator_1'],
  iteratorIndex: [0]
});
```

### setNode

- **参数：**
  - `{Id} id` 节点 ID
  - `{Node} node` 节点实例

- **返回：**
  - `{void}`

- **详情：**

  设置页面中的节点。

### deleteNode

- **参数：**
  - `{Id} id` 节点 ID

- **返回：**
  - `{void}`

- **详情：**

  删除页面中指定 ID 的节点。

- **示例：**

```typescript
page.deleteNode('button_1');
```

### destroy

- **返回：**
  - `{void}`

- **详情：**

  销毁页面及其所有子节点。

- **示例：**

```typescript
page.destroy();
```

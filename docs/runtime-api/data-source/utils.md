# 工具函数

`@tmagic/data-source` 导出的工具函数。

## createDataSourceManager

- **参数：**
  - `{TMagicApp} app` 应用实例
  - `{boolean} useMock` 是否使用 Mock 数据（可选）
  - `{DataSourceManagerData} initialData` 初始数据（可选）

- **返回：**
  - `{DataSourceManager}` 数据源管理器实例

- **详情：**

  创建数据源管理器的工厂函数，会自动设置数据变化监听。

- **示例：**

```typescript
import { createDataSourceManager } from '@tmagic/data-source';

const dsManager = createDataSourceManager(app, false, initialData);
```

## compiledCondition

- **参数：**
  - `{CondItem} cond` 条件项
  - `{object} data` 数据上下文

- **返回：**
  - `{boolean}` 条件是否满足

- **详情：**

  编译单个显示条件。

- **示例：**

```typescript
import { compiledCondition } from '@tmagic/data-source';

const result = compiledCondition(
  { field: 'user.age', op: '>', value: 18 },
  { user: { age: 20 } }
);
console.log(result); // true
```

## compliedConditions

- **参数：**
  - `{MNode} node` 节点配置
  - `{object} data` 数据上下文（可选）

- **返回：**
  - `{boolean}` 节点是否应该显示

- **详情：**

  编译条件组，支持 AND/OR 逻辑。

## compiledNodeField

- **参数：**
  - `{any} value` 字段值
  - `{object} data` 数据上下文

- **返回：**
  - `{any}` 编译后的值

- **详情：**

  编译节点字段中的数据源配置。

- **示例：**

```typescript
import { compiledNodeField } from '@tmagic/data-source';

const compiled = compiledNodeField(
  { isBindDataSource: true, dataSourceId: 'ds_1', template: '${name}' },
  { ds_1: { name: 'test' } }
);
```

## compliedDataSourceField

- **参数：**
  - `{any} value` 字段值
  - `{object} data` 数据上下文

- **返回：**
  - `{any}` 编译后的值

- **详情：**

  编译数据源字段选择器的值。

## template

- **参数：**
  - `{string} value` 模板字符串
  - `{object} data` 数据上下文

- **返回：**
  - `{string}` 替换后的字符串

- **详情：**

  模板字符串替换，支持 `${id.field}` 格式。

- **示例：**

```typescript
import { template } from '@tmagic/data-source';

const result = template(
  '用户名：${ds_1.user.name}，年龄：${ds_1.user.age}',
  { ds_1: { user: { name: '张三', age: 20 } } }
);
console.log(result); // '用户名：张三，年龄：20'
```

## createIteratorContentData

- **参数：**
  - `{object} itemData` 迭代项数据
  - `{string} dsId` 数据源 ID
  - `{DataSchema[]} fields` 字段配置
  - `{object} dsData` 数据源数据

- **返回：**
  - `{object}` 迭代器数据上下文

- **详情：**

  创建迭代器的数据上下文。

## compliedIteratorItem

- **参数：**
  - `{object} options` 编译选项

- **返回：**
  - `{MNode}` 编译后的节点

- **详情：**

  编译迭代器项。

## updateNode

- **参数：**
  - `{MNode} node` 节点配置
  - `{MApp} dsl` DSL 配置

- **返回：**
  - `{MApp}` 更新后的 DSL

- **详情：**

  更新 DSL 中的指定节点。

- **示例：**

```typescript
import { updateNode } from '@tmagic/data-source';

const newDsl = updateNode(
  { id: 'button_1', type: 'button', text: '新文本' },
  dsl
);
```

## registerDataSourceOnDemand

- **参数：**
  - `{MApp} dsl` DSL 配置
  - `{Record<string, () => Promise<any>>} modules` 数据源模块映射

- **返回：**
  - `{Promise<void>}`

- **详情：**

  按需加载数据源模块。根据 DSL 中使用的数据源类型动态加载对应模块。

- **示例：**

```typescript
import { registerDataSourceOnDemand } from '@tmagic/data-source';

await registerDataSourceOnDemand(dsl, {
  custom: () => import('./CustomDataSource'),
  socket: () => import('./SocketDataSource')
});
```

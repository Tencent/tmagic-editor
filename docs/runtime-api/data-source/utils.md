# 工具函数

`@tmagic/data-source` 导出的工具函数。

## createDataSourceManager

- **参数：**
  - `{TMagicApp} app` 应用实例
  - `{boolean} useMock` 是否使用 Mock 数据（可选）
  - `{DataSourceManagerData} initialData` 初始数据（可选）

- **返回：**
  - `{DataSourceManager | undefined}` 数据源管理器实例；当 `app.dsl?.dataSources` 缺省时返回 `undefined`

- **详情：**

  创建数据源管理器的工厂函数，会自动设置数据变化监听并在 `change` 事件中向 `update-data` 转发受影响的节点。

- **示例：**

```typescript
import { createDataSourceManager } from '@tmagic/data-source';

const dsManager = createDataSourceManager(app, false, initialData);
```

## compiledCondition

- **参数：**
  - `{DisplayCondItem[]} conds` 条件项数组（同一组条件 AND 关系）
  - `{DataSourceManagerData} data` 数据上下文

- **返回：**
  - `{boolean}` 条件是否满足

- **详情：**

  编译一组显示条件，按 AND 语义返回是否全部满足。

- **示例：**

```typescript
import { compiledCondition } from '@tmagic/data-source';

const result = compiledCondition(
  [{ field: ['ds_1', 'user', 'age'], op: '>', value: 18 }],
  { ds_1: { user: { age: 20 } } }
);
console.log(result); // true
```

## compliedConditions

- **参数：**
  - `{ { [NODE_CONDS_KEY]?: DisplayCond[] } } node` 带条件字段的结构
  - `{DataSourceManagerData} data` 数据上下文

- **返回：**
  - `{boolean}` 节点是否应该显示

- **详情：**

  编译条件组（OR 语义：只要其中一组 `cond` 全部满足即返回 `true`）。

## compiledNodeField

- **参数：**
  - `{any} value` 字段值
  - `{DataSourceManagerData} data` 数据上下文

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
  - `{DataSourceManagerData} data` 数据上下文

- **返回：**
  - `{any}` 编译后的值

- **详情：**

  编译数据源字段选择器的值。

## template

- **参数：**
  - `{string} value` 模板字符串
  - `{DataSourceManagerData} data` 数据上下文

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
  - `{any} itemData` 迭代项数据
  - `{string} dsId` 数据源 ID
  - `{string[]} fields` 字段路径，如 `['a', 'b', 'c']`
  - `{DataSourceManagerData} dsData` 数据源数据（可选，默认 `{}`）

- **返回：**
  - `{DataSourceManagerData}` 迭代器数据上下文

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
  - `{Record<string, () => Promise<any>>} dataSourceModules` 数据源模块映射

- **返回：**
  - `{Promise<Record<string, any>>}` 按需加载到的数据源模块表（key 为数据源 `type`，value 为模块的 `default` 导出）

- **详情：**

  按需加载数据源模块。根据 DSL 中实际依赖到的数据源类型动态加载对应模块，并以模块表形式返回。

- **示例：**

```typescript
import { registerDataSourceOnDemand } from '@tmagic/data-source';

const moduleMap = await registerDataSourceOnDemand(dsl, {
  custom: () => import('./CustomDataSource'),
  socket: () => import('./SocketDataSource')
});
```

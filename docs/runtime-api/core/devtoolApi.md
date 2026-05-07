# DevtoolApi

`DevtoolApi` 是 `@tmagic/core` 提供给开发工具使用的 API 接口类。

## 构造函数

```typescript
new DevtoolApi(options: DevtoolApiOptions)
```

### DevtoolApiOptions

| 参数 | 类型 | 说明 |
|------|------|------|
| `app` | `App` | 应用实例 |

## 实例方法

### openPop

- **参数：**
  - `{Id} popId` 弹窗组件 ID

- **返回：**
  - `{void}`

- **详情：**

  打开指定的弹窗组件。

- **示例：**

```typescript
devtoolApi.openPop('dialog_1');
```

### setDataSourceData

- **参数：**
  - `{Id} dsId` 数据源 ID
  - `{any} data` 数据
  - `{string} path` 数据路径（可选）

- **返回：**
  - `{void}`

- **详情：**

  设置数据源的数据。

- **示例：**

```typescript
// 设置整个数据源数据
devtoolApi.setDataSourceData('ds_1', { name: 'test' });

// 设置数据源的某个字段
devtoolApi.setDataSourceData('ds_1', 'newValue', 'user.name');
```

### delDataSourceData

- **返回：**
  - `{void}`

- **详情：**

  当前为空实现（预留接口），由具体的开发工具/平台覆盖以实现"删除数据源数据"的能力。

### requestDataSource

- **参数：**
  - `{Id} dsId` 数据源 ID

- **返回：**
  - `{Promise<void> | void}`

- **详情：**

  触发 HTTP 数据源的请求。优先调用 `dataSource.refresh`，否则调用 `dataSource.request`，再否则将 `isInit` 置为 `false` 并通过 `dataSourceManager.init(ds)` 重新初始化。

- **示例：**

```typescript
await devtoolApi.requestDataSource('http_ds_1');
```

### getDisplayCondRealValue

- **参数：**
  - `{Id} nodeId` 节点 ID
  - `{DisplayCondItem} condItem` 单个条件项

- **返回：**
  - `{any}`

- **详情：**

  获取显示条件的实际计算值。内部会以 `{ [NODE_CONDS_KEY]: [{ cond: [condItem] }] }` 的形式调用 `dataSourceManager.compliedConds`。

### callHook

- **参数：**
  - `{Id} nodeId` 节点 ID
  - `{string} hookName` 钩子名称
  - `{ { params: Record<string, any> }[] } hookData` 钩子数据列表，依次传给 `node.runHookCode`

- **返回：**
  - `{Promise<void>}`

- **详情：**

  调用节点的钩子函数。会按 `hookData` 顺序执行，每项以 `item.params` 作为 `runHookCode` 的入参。

- **示例：**

```typescript
await devtoolApi.callHook('button_1', 'mounted', [
  { params: { data: 'test' } },
]);
```

### trigger

- **参数：**
  - `{Id} nodeId` 节点 ID
  - `{EventConfig} eventConfig` 事件配置（单个，非数组）

- **返回：**
  - `{void}`

- **详情：**

  按节点触发事件。内部通过 `app.emit(eventConfig.name, node)` 触发对应事件。

- **示例：**

```typescript
devtoolApi.trigger('button_1', {
  name: 'click',
  actions: [{ actionType: 'code', codeId: 'code_1' }]
});
```

### updateDsl

- **参数：**
  - `{Id} nodeId` 节点 ID
  - `{any} data` 数据
  - `{string} path` 路径

- **返回：**
  - `{void}`

- **详情：**

  当前为空实现（预留接口），由具体的开发工具/平台覆盖以实现"按节点更新 DSL"的能力。

### isValueIncludeDataSource

- **参数：**
  - `{any} value` 要检查的值

- **返回：**
  - `{boolean}`

- **详情：**

  检查值是否包含数据源引用。

- **示例：**

```typescript
const hasDs = devtoolApi.isValueIncludeDataSource('${ds_1.field}');
console.log(hasDs); // true
```

### compileDataSourceValue

- **参数：**
  - `{any} value` 包含数据源引用的值

- **返回：**
  - `{any}`

- **详情：**

  编译数据源值，将数据源引用替换为实际值。

- **示例：**

```typescript
const compiled = devtoolApi.compileDataSourceValue('用户名：${ds_1.user.name}');
```

### updateCode

- **参数：**
  - `{Id} codeId` 代码块 ID
  - `{any} value` 新值
  - `{string} path` 路径（必填）

- **返回：**
  - `{void}`

- **详情：**

  按 `path` 更新指定代码块的内容。当 `path === 'content'` 且 `value` 为字符串时，**当前实现**会通过 `eval` 拼接执行后将函数写回。

  ::: warning 已知限制
  当前 `eval` 模板存在多余的右括号（详见 `packages/core/src/DevtoolApi.ts` 中 `updateCode`），**对大部分常规函数字面量会因语法错误抛出**。直接传入纯函数体或可被裸赋值的合法表达式时也需自行验证；如需稳定使用建议在调用方先编译为函数再写回 `app.codeDsl[codeId].content`，或等待该实现修复。
  :::

- **示例：**

```typescript
devtoolApi.updateCode('code_1', 'return data.value * 2;', 'content');
```

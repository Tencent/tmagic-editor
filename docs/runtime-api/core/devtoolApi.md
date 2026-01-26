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

### requestDataSource

- **参数：**
  - `{Id} dsId` 数据源 ID

- **返回：**
  - `{Promise<void>}`

- **详情：**

  触发 HTTP 数据源的请求。

- **示例：**

```typescript
await devtoolApi.requestDataSource('http_ds_1');
```

### getDisplayCondRealValue

- **参数：**
  - `{Id} nodeId` 节点 ID
  - `{CondItem} condItem` 条件项

- **返回：**
  - `{any}`

- **详情：**

  获取显示条件的实际计算值。

### callHook

- **参数：**
  - `{Id} nodeId` 节点 ID
  - `{string} hookName` 钩子名称
  - `{any} hookData` 钩子数据

- **返回：**
  - `{Promise<any>}`

- **详情：**

  调用节点的钩子函数。

- **示例：**

```typescript
await devtoolApi.callHook('button_1', 'mounted', { data: 'test' });
```

### trigger

- **参数：**
  - `{Id} nodeId` 节点 ID
  - `{EventConfig[]} events` 事件配置数组

- **返回：**
  - `{Promise<void>}`

- **详情：**

  触发节点的事件。

- **示例：**

```typescript
await devtoolApi.trigger('button_1', [
  {
    name: 'click',
    actions: [{ actionType: 'code', codeId: 'code_1' }]
  }
]);
```

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
  - `{string} path` 路径（可选）

- **返回：**
  - `{void}`

- **详情：**

  更新代码块的内容。

- **示例：**

```typescript
devtoolApi.updateCode('code_1', 'return data.value * 2;', 'content');
```

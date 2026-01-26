# DataSource（基础数据源）

`DataSource` 是 `@tmagic/data-source` 的基础数据源类，用于静态数据管理。

## 构造函数

```typescript
new DataSource(options: DataSourceOptions)
```

### DataSourceOptions

| 参数 | 类型 | 说明 |
|------|------|------|
| `schema` | `DataSourceSchema` | 数据源配置 |
| `app` | `TMagicApp` | 应用实例 |
| `initialData` | `Record<string, any>` | 初始数据（可选） |
| `useMock` | `boolean` | 使用 Mock 数据（可选） |
| `request` | `RequestFunction` | 请求函数（可选） |
| `ObservedDataClass` | `ObservedDataClass` | 观察者数据类（可选） |

### DataSourceSchema

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 数据源 ID |
| `type` | `'base'` | 数据源类型 |
| `title` | `string` | 数据源标题（可选） |
| `description` | `string` | 数据源描述（可选） |
| `fields` | `DataSchema[]` | 字段配置 |
| `methods` | `CodeBlockContent[]` | 自定义方法配置（可选） |
| `mocks` | `MockSchema` | Mock 数据配置（可选） |
| `events` | `EventConfig[]` | 事件配置（可选） |

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 数据源 ID（只读） |
| `type` | `string` | 数据源类型，值为 `'base'` |
| `schema` | `DataSourceSchema` | 配置 schema |
| `fields` | `DataSchema[]` | 字段配置 |
| `methods` | `CodeBlockContent[]` | 自定义方法配置 |
| `data` | `any` | 当前数据 |
| `isInit` | `boolean` | 是否已初始化 |

## 实例方法

### setData

- **参数：**
  - `{any} data` 数据
  - `{string} path` 数据路径（可选）

- **返回：**
  - `{void}`

- **详情：**

  设置数据源数据。如果指定路径，则只更新该路径的数据。

- **示例：**

```typescript
// 设置整个数据
ds.setData({ name: 'test', count: 10 });

// 设置特定路径的数据
ds.setData('newValue', 'user.name');
```

### setValue

- **参数：**
  - `{string} path` 数据路径
  - `{any} data` 数据

- **返回：**
  - `{void}`

- **详情：**

  按路径设置数据，等同于 `setData(data, path)`。

- **示例：**

```typescript
ds.setValue('user.age', 25);
```

### onDataChange

- **参数：**
  - `{string} path` 数据路径
  - `{Function} callback` 回调函数

- **返回：**
  - `{void}`

- **详情：**

  监听指定路径的数据变化。

- **示例：**

```typescript
ds.onDataChange('user.name', (newVal) => {
  console.log('用户名变更:', newVal);
});
```

### offDataChange

- **参数：**
  - `{string} path` 数据路径
  - `{Function} callback` 回调函数

- **返回：**
  - `{void}`

- **详情：**

  取消监听数据变化。

### getDefaultData

- **返回：**
  - `{any}` 默认数据

- **详情：**

  根据字段配置获取默认数据。

### init

- **返回：**
  - `{Promise<void>}`

- **详情：**

  初始化数据源。

### destroy

- **返回：**
  - `{void}`

- **详情：**

  销毁数据源，清理资源。

## 事件

DataSource 继承自 EventEmitter，支持以下事件：

| 事件名 | 说明 |
|--------|------|
| `change` | 数据变化时触发 |

### 示例

```typescript
ds.on('change', () => {
  console.log('数据已变化', ds.data);
});
```

## 字段配置 (DataSchema)

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 字段名 |
| `type` | `string` | 字段类型 |
| `title` | `string` | 字段标题（可选） |
| `description` | `string` | 字段描述（可选） |
| `defaultValue` | `any` | 默认值（可选） |
| `fields` | `DataSchema[]` | 子字段（对象类型时）（可选） |

### 字段配置示例

```typescript
const schema = {
  id: 'user_ds',
  type: 'base',
  fields: [
    { name: 'id', type: 'number', defaultValue: 0 },
    { name: 'name', type: 'string', defaultValue: '' },
    {
      name: 'profile',
      type: 'object',
      fields: [
        { name: 'avatar', type: 'string' },
        { name: 'bio', type: 'string' }
      ]
    }
  ]
};
```

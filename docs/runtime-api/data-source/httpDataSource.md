# HttpDataSource（HTTP 数据源）

`HttpDataSource` 是 `@tmagic/data-source` 的 HTTP 数据源类，继承自 `DataSource`，用于通过 HTTP 请求获取数据。

## 构造函数

```typescript
new HttpDataSource(options: DataSourceOptions<HttpDataSourceSchema>)
```

参数参见 [DataSource](./dataSource.md) 构造函数。

### HttpDataSourceSchema

继承自 DataSourceSchema，额外包含：

| 参数 | 类型 | 说明 |
|------|------|------|
| `type` | `'http'` | 数据源类型 |
| `options` | `HttpOptionsSchema` | HTTP 请求配置 |
| `responseOptions` | `{ dataPath?: string }` | 响应数据配置（可选） |
| `autoFetch` | `boolean` | 是否自动请求（可选） |
| `beforeRequest` | `Function \| string` | 请求前钩子（可选） |
| `afterResponse` | `Function \| string` | 响应后钩子（可选） |

### HttpOptionsSchema

| 参数 | 类型 | 说明 |
|------|------|------|
| `url` | `string \| Function` | 请求链接 |
| `method` | `'GET' \| 'POST'` | 请求方法（可选，默认 GET） |
| `params` | `object \| Function` | Query 参数（可选） |
| `data` | `object \| Function` | Body 数据（可选） |
| `headers` | `object \| Function` | 请求头（可选） |

## 属性

继承自 DataSource 的属性，额外包含：

| 属性 | 类型 | 说明 |
|------|------|------|
| `isLoading` | `boolean` | 是否正在请求 |
| `error` | `{ msg?: string, code?: string }` | 错误信息 |
| `httpOptions` | `HttpOptionsSchema` | 请求配置 |

## 实例方法

### request

- **参数：**
  - `{HttpOptionsSchema} options` 请求选项（可选）

- **返回：**
  - `{Promise<any>}` 响应数据

- **详情：**

  发起 HTTP 请求。可以传入选项覆盖默认配置。

- **示例：**

```typescript
// 使用默认配置请求
const data = await httpDs.request();

// 覆盖部分配置
const data = await httpDs.request({
  params: { page: 1, size: 10 }
});
```

### get

- **参数：**
  - `{HttpOptionsSchema} options` 请求选项

- **返回：**
  - `{Promise<any>}` 响应数据

- **详情：**

  发起 GET 请求。

- **示例：**

```typescript
const data = await httpDs.get({
  url: '/api/users',
  params: { id: 1 }
});
```

### post

- **参数：**
  - `{HttpOptionsSchema} options` 请求选项

- **返回：**
  - `{Promise<any>}` 响应数据

- **详情：**

  发起 POST 请求。

- **示例：**

```typescript
const data = await httpDs.post({
  url: '/api/users',
  data: { name: 'test' }
});
```

## 配置示例

### 基础配置

```typescript
const httpDsSchema = {
  id: 'user_api',
  type: 'http',
  title: '用户接口',
  options: {
    url: '/api/user',
    method: 'GET',
    params: { id: 1 }
  },
  autoFetch: true,
  fields: [
    { name: 'id', type: 'number' },
    { name: 'name', type: 'string' }
  ]
};
```

### 动态参数配置

```typescript
const httpDsSchema = {
  id: 'dynamic_api',
  type: 'http',
  options: {
    url: (app) => `/api/users/${app.page.data.userId}`,
    params: (app) => ({ token: app.getToken() })
  }
};
```

### 请求钩子配置

```typescript
const httpDsSchema = {
  id: 'hooked_api',
  type: 'http',
  options: {
    url: '/api/data',
    method: 'POST'
  },
  // 请求前处理
  beforeRequest: (options, app) => {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${app.token}`
    };
    return options;
  },
  // 响应后处理
  afterResponse: (response, app) => {
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    return response.data;
  },
  // 响应数据路径
  responseOptions: {
    dataPath: 'data.list'
  }
};
```

### 使用代码块作为钩子

```typescript
const httpDsSchema = {
  id: 'code_hook_api',
  type: 'http',
  options: {
    url: '/api/data'
  },
  // 引用代码块 ID
  beforeRequest: 'code_before_request',
  afterResponse: 'code_after_response'
};
```

## 自动请求

当 `autoFetch` 设置为 `true` 时，数据源在初始化时会自动发起请求：

```typescript
const httpDsSchema = {
  id: 'auto_api',
  type: 'http',
  options: {
    url: '/api/init-data'
  },
  autoFetch: true  // 初始化时自动请求
};
```

## 错误处理

```typescript
httpDs.on('change', () => {
  if (httpDs.error) {
    console.error('请求失败:', httpDs.error.msg);
  } else {
    console.log('数据:', httpDs.data);
  }
});
```

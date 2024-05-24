# 数据源

## 使用数据源

### 添加数据源

在编辑器左侧边栏中选中数据源，在数据源面板右上角添加中选择对应的数据源类型（默认提供了两种基础的数据源）

[![alt 数据源列表](/data-source.png "数据源列表")](/data-source.png){target="_blank"}

### 配置属性字段

[![alt 新增数据源](/create-data-source.png "新增数据源")](/create-data-source.png){target="_blank"}

#### 基础数据源

静态数据，不会自动更新，可以通过配置方法，在方法中更新数据源

```js
({ dataSource, app }) => {
  dataSource.setData({
    // 数据
  });
}
```

然后再组件的事件联动中关联此方法，来触发数据源更新

#### HTTP数据源

通过配置HTTP相关参数(url, query, body, header等)通过网络api获取数据，该数据源拥有request方法，可通过此方法来刷新数据源

```js
({ dataSource, app }) => {
  dataSource.request();
}
```


### 在组件中使用


#### 数据源模板输入框（data-source-input）

formConfig.js
```js
[
  {
    type: 'data-source-input'
  }
]
```

[![alt 数据源模版](/data-source-input.png "数据源模版")](/data-source-input.png){target="_blank"}

#### 数据源字段选择器输入框（data-source-field-select)

formConfig.js
```js
[
  {
    type: 'data-source-filed-select'
  }
]
```

#### 数据源选择器（data-source-select)


formConfig.js
```js
[
  {
    type: 'data-source-select'
  }
]
```
#### 数据源方法选择器（data-source-method-select)

formConfig.js
```js
[
  {
    type: 'data-source-method-select'
  }
]
```

#### 显示条件

当配置的条件成立时显示，反之隐藏

[![alt 显示条件](/display-cond.png "显示条件")](/display-cond.png){target="_blank"}

## 数据源开发

### 数据源规范

数据源的基础形式，需要有四个文件
- index 入口文件，引入下面几个文件
- formConfig 表单配置描述
- initValue 表单初始值
- event 定义联动事件，具体可以参考[组件联动](./coupling.html#组件联动)
- dataSource 数据源逻辑代码


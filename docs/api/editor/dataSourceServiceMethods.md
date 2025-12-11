# dataSourceService方法

## get

- **参数：**

  - `{StateKey}` name 状态键名

- **返回：**

  - `{any}` 对应的状态值

- **详情：**

  获取数据源服务的内部状态

  可用的状态键：
  - `datasourceTypeList`: 数据源类型列表
  - `dataSources`: 当前数据源列表
  - `editable`: 是否可编辑
  - `configs`: 数据源表单配置
  - `values`: 数据源默认值
  - `events`: 数据源事件列表
  - `methods`: 数据源方法列表

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

const dataSources = dataSourceService.get('dataSources');
console.log(dataSources);
```

## set

- **参数：**

  - `{StateKey}` name 状态键名
  - `{any}` value 状态值

- **返回：**

  - `{void}`

- **详情：**

  设置数据源服务的内部状态

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

dataSourceService.set('editable', false);
```

## getFormConfig

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` type 数据源类型，默认为 'base'

- **返回：**

  - {[FormConfig](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/form/src/schema.ts#L706)} 表单配置

- **详情：**

  获取指定类型数据源的表单配置

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

const config = dataSourceService.getFormConfig('http');
console.log(config);
```

## setFormConfig

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` type 数据源类型
  - {[FormConfig](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/form/src/schema.ts#L706)} config 表单配置

- **返回：**

  - `{void}`

- **详情：**

  设置指定类型数据源的表单配置

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

dataSourceService.setFormConfig('http', [
  {
    name: 'url',
    text: '请求地址',
    type: 'text',
  },
  {
    name: 'method',
    text: '请求方法',
    type: 'select',
    options: [
      { text: 'GET', value: 'GET' },
      { text: 'POST', value: 'POST' },
    ],
  },
]);
```

## getFormValue

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` type 数据源类型，默认为 'base'

- **返回：**

  - {Partial<[DataSourceSchema](https://github.com/Tencent/tmagic-editor/blob/5880dfbe15fcead63e9dc7c91900f8c4e7a574d8/packages/schema/src/index.ts#L221)>} 数据源默认值

- **详情：**

  获取指定类型数据源的默认值

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

const defaultValue = dataSourceService.getFormValue('http');
console.log(defaultValue);
```

## setFormValue

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` type 数据源类型
  - {Partial<[DataSourceSchema](https://github.com/Tencent/tmagic-editor/blob/5880dfbe15fcead63e9dc7c91900f8c4e7a574d8/packages/schema/src/index.ts#L221)>} value 数据源默认值

- **返回：**

  - `{void}`

- **详情：**

  设置指定类型数据源的默认值

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

dataSourceService.setFormValue('http', {
  type: 'http',
  method: 'GET',
  url: '',
});
```

## getFormEvent

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` type 数据源类型，默认为 'base'

- **返回：**

  - {[EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[]} 事件列表

- **详情：**

  获取指定类型数据源的事件列表

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

const events = dataSourceService.getFormEvent('http');
console.log(events);
```

## setFormEvent

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` type 数据源类型
  - {[EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[]} value 事件列表

- **返回：**

  - `{void}`

- **详情：**

  设置指定类型数据源的事件列表

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

dataSourceService.setFormEvent('http', [
  { label: '请求成功', value: 'success' },
  { label: '请求失败', value: 'error' },
]);
```

## getFormMethod

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` type 数据源类型，默认为 'base'

- **返回：**

  - {[EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[]} 方法列表

- **详情：**

  获取指定类型数据源的方法列表

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

const methods = dataSourceService.getFormMethod('http');
console.log(methods);
```

## setFormMethod

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` type 数据源类型
  - {[EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[]} value 方法列表

- **返回：**

  - `{void}`

- **详情：**

  设置指定类型数据源的方法列表

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

dataSourceService.setFormMethod('http', [
  { label: '发起请求', value: 'request' },
  { label: '重试', value: 'retry' },
]);
```

## add

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - {[DataSourceSchema](https://github.com/Tencent/tmagic-editor/blob/5880dfbe15fcead63e9dc7c91900f8c4e7a574d8/packages/schema/src/index.ts#L221)} config 数据源配置

- **返回：**

  - {[DataSourceSchema](https://github.com/Tencent/tmagic-editor/blob/5880dfbe15fcead63e9dc7c91900f8c4e7a574d8/packages/schema/src/index.ts#L221)} 添加后的数据源配置

- **详情：**

  添加一个数据源，如果配置中没有id或id已存在，会自动生成新的id

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

const newDs = dataSourceService.add({
  type: 'http',
  title: '用户信息',
  url: '/api/user',
  method: 'GET',
});

console.log(newDs.id); // 自动生成的id
```

## update

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - {[DataSourceSchema](https://github.com/Tencent/tmagic-editor/blob/5880dfbe15fcead63e9dc7c91900f8c4e7a574d8/packages/schema/src/index.ts#L221)} config 数据源配置
  - `{Object}` options 可选配置
    - {[ChangeRecord](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/form/src/schema.ts#L27-L39)[]} changeRecords 变更记录

- **返回：**

  - {[DataSourceSchema](https://github.com/Tencent/tmagic-editor/blob/5880dfbe15fcead63e9dc7c91900f8c4e7a574d8/packages/schema/src/index.ts#L221)} 更新后的数据源配置

- **详情：**

  更新数据源

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

const updatedDs = dataSourceService.update({
  id: 'ds_123',
  type: 'http',
  title: '用户详情',
  url: '/api/user/detail',
});

console.log(updatedDs);
```

## remove

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` id 数据源id

- **返回：**

  - `{void}`

- **详情：**

  删除指定id的数据源

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

dataSourceService.remove('ds_123');
```

## createId

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：** 无

- **返回：**

  - `{string}` 生成的唯一id

- **详情：**

  生成一个唯一的数据源id，格式为 `ds_` + guid

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

const id = dataSourceService.createId();
console.log(id); // 'ds_xxx-xxx-xxx'
```

## getDataSourceById

- **参数：**

  - `{string}` id 数据源id

- **返回：**

  - {[DataSourceSchema](https://github.com/Tencent/tmagic-editor/blob/5880dfbe15fcead63e9dc7c91900f8c4e7a574d8/packages/schema/src/index.ts#L221) | undefined} 数据源配置

- **详情：**

  根据id获取数据源配置

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

const ds = dataSourceService.getDataSourceById('ds_123');
console.log(ds);
```

## copyWithRelated

- **参数：**

  - {[MNode](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L99) | [MNode](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L99)[]} config 组件节点配置
  - `{TargetOptions}` collectorOptions 可选的收集器配置

- **返回：**

  - `{void}`

- **详情：**

  复制组件时会带上组件关联的数据源，将关联的数据源存储到 localStorage

- **示例：**

```js
import { dataSourceService, editorService } from '@tmagic/editor';

const node = editorService.get('node');
dataSourceService.copyWithRelated(node);
```

## paste

- **参数：** 无

- **返回：**

  - `{void}`

- **详情：**

  粘贴数据源，从 localStorage 中读取复制的数据源并添加到当前页面
  
  如果数据源id已存在，则不会覆盖

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

dataSourceService.paste();
```

## resetState

- **参数：** 无

- **返回：**

  - `{void}`

- **详情：**

  重置数据源服务状态，清空所有数据源

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

dataSourceService.resetState();
```

## destroy

- **参数：** 无

- **返回：**

  - `{void}`

- **详情：**

  销毁 dataSourceService，移除所有事件监听并重置状态

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

dataSourceService.destroy();
```

## usePlugin

- **详情：**

相对于[use](#use), usePlugin支持更加灵活更加细致的扩展， 上述方法中标记有`扩展支持： 是`的方法都支持使用usePlugin扩展

每个支持扩展的方法都支持定制before、after两个hook来干预原有方法的行为，before可以用于修改传入参数，after可以用于修改返回的值

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

dataSourceService.usePlugin({
  beforeAdd(config) {
    console.log('添加前:', config);
    return [config];
  },
  
  afterAdd(result, config) {
    console.log('添加后:', result);
    return result;
  },
});
```

## removeAllPlugins

- **详情：**

删掉当前设置的所有扩展

- **示例：**

```js
import { dataSourceService } from '@tmagic/editor';

dataSourceService.removeAllPlugins();
```
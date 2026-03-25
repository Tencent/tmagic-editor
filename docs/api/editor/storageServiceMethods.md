# storageService方法

## getStorage

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：** 无

- **返回：**

  - `{Storage}` Storage 对象

- **详情：**

  获取数据存储对象，默认返回 localStorage
  
  可以通过插件机制替换为其他存储对象（如 sessionStorage）

- **示例：**

```js
import { storageService } from '@tmagic/editor';

const storage = storageService.getStorage();
console.log(storage); // localStorage

// 通过插件替换为 sessionStorage
storageService.usePlugin({
  afterGetStorage() {
    return window.sessionStorage;
  },
});
```

## getNamespace

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：** 无

- **返回：**

  - `{string}` 命名空间字符串

- **详情：**

  获取存储项的命名空间，默认为 'tmagic'
  
  命名空间用于区分不同应用的存储数据

- **示例：**

```js
import { storageService } from '@tmagic/editor';

const namespace = storageService.getNamespace();
console.log(namespace); // 'tmagic'
```

## clear

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：** 无

- **返回：**

  - `{void}`

- **详情：**

  清空当前存储对象中的所有数据

- **示例：**

```js
import { storageService } from '@tmagic/editor';

storageService.clear();
```

## getItem

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` key 存储项的键名
  - `{Options}` options 可选配置
    - `namespace?: string` 自定义命名空间
    - `protocol?: Protocol` 数据协议类型

- **返回：**

  - `{any}` 存储的值，如果不存在返回 null

- **详情：**

  获取存储项，支持多种数据类型的自动解析
  
  支持的协议类型：
  - `Protocol.OBJECT`: JavaScript 对象
  - `Protocol.JSON`: JSON 格式
  - `Protocol.NUMBER`: 数字类型
  - `Protocol.BOOLEAN`: 布尔类型
  - `Protocol.STRING`: 字符串类型

- **示例：**

```js
import { storageService } from '@tmagic/editor';

// 获取字符串
const str = storageService.getItem('myKey');

// 使用自定义命名空间
const value = storageService.getItem('key', { namespace: 'custom' });

// 指定协议类型
const num = storageService.getItem('count', { protocol: Protocol.NUMBER });
```

## key

- **参数：**

  - `{number}` index 索引位置

- **返回：**

  - `{string | null}` 指定位置的键名，不存在返回 null

- **详情：**

  获取存储对象中指定索引位置的键名

- **示例：**

```js
import { storageService } from '@tmagic/editor';

const firstKey = storageService.key(0);
console.log(firstKey);
```

## removeItem

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` key 存储项的键名
  - `{Options}` options 可选配置
    - `namespace?: string` 自定义命名空间

- **返回：**

  - `{void}`

- **详情：**

  移除指定的存储项

- **示例：**

```js
import { storageService } from '@tmagic/editor';

// 移除默认命名空间下的存储项
storageService.removeItem('myKey');

// 移除自定义命名空间下的存储项
storageService.removeItem('key', { namespace: 'custom' });
```

## setItem

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` key 存储项的键名
  - `{any}` value 要存储的值
  - `{Options}` options 可选配置
    - `namespace?: string` 自定义命名空间
    - `protocol?: Protocol` 数据协议类型

- **返回：**

  - `{void}`

- **详情：**

  设置存储项，自动序列化复杂数据类型

- **示例：**

```js
import { storageService, Protocol } from '@tmagic/editor';

// 存储字符串
storageService.setItem('name', 'tmagic');

// 存储对象
storageService.setItem('config', { a: 1, b: 2 }, { protocol: Protocol.OBJECT });

// 存储数字
storageService.setItem('count', 100, { protocol: Protocol.NUMBER });

// 使用自定义命名空间
storageService.setItem('key', 'value', { namespace: 'custom' });
```

## destroy

- **参数：** 无

- **返回：**

  - `{void}`

- **详情：**

  销毁 storageService，移除所有事件监听和插件

- **示例：**

```js
import { storageService } from '@tmagic/editor';

storageService.destroy();
```

## use

使用中间件的方式扩展方法，上述方法中标记有`扩展支持： 是`的方法都支持使用use扩展

- **示例：**

```js
import { storageService } from '@tmagic/editor';

storageService.use({
  getItem(key, options, next) {
    console.log('获取存储项:', key);
    return next();
  },
});
```

## usePlugin

- **详情：**

相对于[use](#use), usePlugin支持更加灵活更加细致的扩展， 上述方法中标记有`扩展支持： 是`的方法都支持使用usePlugin扩展

每个支持扩展的方法都支持定制before、after两个hook来干预原有方法的行为，before可以用于修改传入参数，after可以用于修改返回的值

- **示例：**

```js
import { storageService } from '@tmagic/editor';

storageService.usePlugin({
  beforeSetItem(key, value, options) {
    console.log('设置前:', key, value);
    return [key, value, options];
  },
  
  afterGetItem(result, key, options) {
    console.log('获取后:', result);
    return result;
  },
});
```

## removeAllPlugins

- **详情：**

删掉当前设置的所有扩展

- **示例：**

```js
import { storageService } from '@tmagic/editor';

storageService.removeAllPlugins();
```


# eventsService方法

## setEvents

- **参数：**

  - {Record<string, `EventOption`[]>} events 事件配置对象

  ::: details 查看 EventOption 类型定义
  <<< @/../packages/core/src/utils.ts#EventOption{ts}
  :::

- **返回：**

  - `{void}`

- **详情：**

  批量设置多个组件类型的事件列表

- **示例：**

```js
import { eventsService } from '@tmagic/editor';

eventsService.setEvents({
  page: [
    { label: '页面加载', value: 'load' },
    { label: '页面显示', value: 'show' },
  ],
  text: [
    { label: '点击', value: 'click' },
  ],
});
```

## setEvent

- **参数：**

  - `{string}` type 组件类型
  - {`EventOption`[]} events 事件列表

- **返回：**

  - `{void}`

- **详情：**

  设置指定组件类型的事件列表

- **示例：**

```js
import { eventsService } from '@tmagic/editor';

eventsService.setEvent('button', [
  { label: '点击', value: 'click' },
  { label: '长按', value: 'longpress' },
]);
```

## getEvent

- **参数：**

  - `{string}` type 组件类型

- **返回：**

  - {`EventOption`[]} 事件列表

- **详情：**

  获取指定组件类型的事件列表

- **示例：**

```js
import { eventsService } from '@tmagic/editor';

const events = eventsService.getEvent('button');
console.log(events); // [{ label: '点击', value: 'click' }, ...]
```

## setMethods

- **参数：**

  - {Record<string, `EventOption`[]>} methods 方法配置对象

- **返回：**

  - `{void}`

- **详情：**

  批量设置多个组件类型的方法列表

- **示例：**

```js
import { eventsService } from '@tmagic/editor';

eventsService.setMethods({
  page: [
    { label: '刷新', value: 'refresh' },
    { label: '滚动到顶部', value: 'scrollToTop' },
  ],
  video: [
    { label: '播放', value: 'play' },
    { label: '暂停', value: 'pause' },
  ],
});
```

## setMethod

- **参数：**

  - `{string}` type 组件类型
  - {`EventOption`[]} methods 方法列表

- **返回：**

  - `{void}`

- **详情：**

  设置指定组件类型的方法列表

- **示例：**

```js
import { eventsService } from '@tmagic/editor';

eventsService.setMethod('video', [
  { label: '播放', value: 'play' },
  { label: '暂停', value: 'pause' },
  { label: '停止', value: 'stop' },
]);
```

## getMethod

- **参数：**

  - `{string}` type 组件类型
  - `{string | number}` _targetId 目标节点id（保留参数，便于扩展时按节点定制）

- **返回：**

  - {`EventOption`[]} 方法列表

- **详情：**

  获取指定组件类型的方法列表

- **示例：**

```js
import { eventsService } from '@tmagic/editor';

const methods = eventsService.getMethod('video', 'video_123');
console.log(methods); // [{ label: '播放', value: 'play' }, ...]
```

## resetState

- **参数：** 无

- **返回：**

  - `{void}`

- **详情：**

  重置事件服务状态，清空所有事件和方法配置

- **示例：**

```js
import { eventsService } from '@tmagic/editor';

eventsService.resetState();
```

## destroy

- **参数：** 无

- **返回：**

  - `{void}`

- **详情：**

  销毁 eventsService，重置状态并移除所有事件监听和插件

- **示例：**

```js
import { eventsService } from '@tmagic/editor';

eventsService.destroy();
```


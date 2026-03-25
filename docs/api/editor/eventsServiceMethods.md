# eventsService方法

## init

- **参数：**

  - {Record<string, { events: [EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[]; methods: [EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[] }>} eventMethodList 事件方法列表配置

- **返回：**

  - `{void}`

- **详情：**

  初始化事件服务，设置所有组件的事件和方法列表

  :::tip
  该方法通常由编辑器内部调用，开发者可以通过 [m-editor 的 eventMethodList prop](./props.md#eventmethodlist) 来配置
  :::

- **示例：**

```js
import { eventsService } from '@tmagic/editor';

eventsService.init({
  page: {
    events: [
      { label: '页面加载', value: 'load' },
      { label: '页面卸载', value: 'unload' },
    ],
    methods: [
      { label: '刷新', value: 'refresh' },
      { label: '返回', value: 'back' },
    ],
  },
  button: {
    events: [
      { label: '点击', value: 'click' },
    ],
    methods: [],
  },
});
```

## setEvents

- **参数：**

  - {Record<string, [EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[]>} events 事件配置对象

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
  - {[EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[]} events 事件列表

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

  - {[EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[]} 事件列表

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

  - {Record<string, [EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[]>} methods 方法配置对象

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
  - {[EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[]} methods 方法列表

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

- **返回：**

  - {[EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[]} 方法列表

- **详情：**

  获取指定组件类型的方法列表

- **示例：**

```js
import { eventsService } from '@tmagic/editor';

const methods = eventsService.getMethod('video');
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

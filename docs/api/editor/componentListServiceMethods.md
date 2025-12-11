# componentListService方法

## setList

- **参数：**

  - {[ComponentGroup](https://github.com/Tencent/tmagic-editor/blob/5880dfbe15fcead63e9dc7c91900f8c4e7a574d8/packages/editor/src/type.ts#L355)[]} componentGroupList 组件列表配置

- **返回：**

  - `{void}`

- **详情：**

  设置左侧面板的组件列表配置

  :::tip
  该方法通常由编辑器内部调用，开发者可以通过 [m-editor 的 componentGroupList prop](./props.md#componentgrouplist) 来配置组件列表
  :::

- **示例：**

```js
import { componentListService } from '@tmagic/editor';

componentListService.setList([
  {
    title: '基础组件',
    items: [
      {
        icon: 'text-icon',
        text: '文本',
        type: 'text',
      },
      {
        icon: 'button-icon',
        text: '按钮',
        type: 'button',
      },
    ],
  },
]);
```

## getList

- **参数：** 无

- **返回：**

  - {[ComponentGroup](https://github.com/Tencent/tmagic-editor/blob/5880dfbe15fcead63e9dc7c91900f8c4e7a574d8/packages/editor/src/type.ts#L355)[]} 组件列表配置

- **详情：**

  获取当前的组件列表配置

- **示例：**

```js
import { componentListService } from '@tmagic/editor';

const list = componentListService.getList();
console.log(list);
```

## resetState

- **参数：** 无

- **返回：**

  - `{void}`

- **详情：**

  重置组件列表状态，清空所有配置

- **示例：**

```js
import { componentListService } from '@tmagic/editor';

componentListService.resetState();
```

## destroy

- **参数：** 无

- **返回：**

  - `{void}`

- **详情：**

  销毁 componentListService，清空状态并移除所有事件监听和插件

- **示例：**

```js
import { componentListService } from '@tmagic/editor';

componentListService.destroy();
```

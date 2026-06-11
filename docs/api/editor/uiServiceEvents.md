# uiService事件

## state-change

- **详情：** UI 状态发生变化时触发，[uiService.set()](./uiServiceMethods.md#set) 在写入的新值与旧值不同时触发

- **事件回调函数：** `(name: keyof UiState, value: UiState[typeof name], preValue: UiState[typeof name]) => void`

  ::: details 查看 UiState 类型定义
  <<< @/../packages/editor/src/type.ts#UiState{ts}
  :::

- **示例：**

```js
import { uiService } from '@tmagic/editor';

uiService.on('state-change', (name, value, preValue) => {
  console.log(`${name} 从`, preValue, '变为', value);
});

uiService.set('zoom', 1.5);
```

:::tip
- 新值与旧值相同时不会触发该事件
- 通过 `set('stageRect', value)` 修改画布尺寸时，内部会走 `setStageRect` 逻辑并可能联动更新 `zoom`，但不会触发 `state-change` 事件
:::

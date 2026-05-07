# historyService事件

## page-change

- **详情：** 页面切换

- **事件回调函数：** (undoRedo: [UndoRedo](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/utils/undo-redo.ts)) => void

## change

- **详情：** 历史记录发生变化

- **事件回调函数：** (state: [StepValue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L400-L404) | null) => void

  :::tip
  当游标处于历史栈边界（已经无法继续撤销或重做）时，`UndoRedo.undo()` / `redo()` 返回 `null`，对应 `change` 回调收到的 `state` 为 `null`
  :::

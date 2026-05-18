# historyService事件

## page-change

- **详情：** 页面切换

- **事件回调函数：** `(undoRedo: UndoRedo) => void`

  ::: details 查看 UndoRedo 类定义
  <<< @/../packages/editor/src/utils/undo-redo.ts#UndoRedo{ts}
  :::

## change

- **详情：** 历史记录发生变化

- **事件回调函数：** `(state: StepValue | null) => void`

  ::: details 查看 StepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#StepValue{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpType{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}

  <<< @/../packages/schema/src/index.ts#MNode{ts}
  :::

  :::tip
  当游标处于历史栈边界（已经无法继续撤销或重做）时，`UndoRedo.undo()` / `redo()` 返回 `null`，对应 `change` 回调收到的 `state` 为 `null`
  :::

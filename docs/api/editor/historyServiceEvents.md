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

  <<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}

  <<< @/../packages/schema/src/index.ts#MNode{ts}
  :::

  :::tip
  当游标处于历史栈边界（已经无法继续撤销或重做）时，`UndoRedo.undo()` / `redo()` 返回 `null`，对应 `change` 回调收到的 `state` 为 `null`
  :::

## code-block-history-change

- **详情：** 代码块历史记录发生变化（`pushCodeBlock` / `undoCodeBlock` / `redoCodeBlock` 成功时触发）

- **事件回调函数：** `(codeBlockId: Id, step: CodeBlockStepValue) => void`

  ::: details 查看 CodeBlockStepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#CodeBlockStepValue{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}

  <<< @/../packages/schema/src/index.ts#CodeBlockContent{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}
  :::

  :::tip
  - 新增触发的 step 中 `oldContent` 为 `null`
  - 删除触发的 step 中 `newContent` 为 `null`
  - `undo` / `redo` 返回 `null`（边界状态）时不会触发该事件
  :::

## data-source-history-change

- **详情：** 数据源历史记录发生变化（`pushDataSource` / `undoDataSource` / `redoDataSource` 成功时触发）

- **事件回调函数：** `(dataSourceId: Id, step: DataSourceStepValue) => void`

  ::: details 查看 DataSourceStepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#DataSourceStepValue{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}
  :::

  :::tip
  - 新增触发的 step 中 `oldSchema` 为 `null`
  - 删除触发的 step 中 `newSchema` 为 `null`
  - `undo` / `redo` 返回 `null`（边界状态）时不会触发该事件
  :::

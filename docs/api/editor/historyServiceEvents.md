# historyService事件

## change

- **详情：** 页面历史记录发生变化（`page` 类型 `push` / `undo` / `redo` 成功时触发；与 `code-block-history-change` / `data-source-history-change` 同构）

- **事件回调函数：** `(pageId: Id, step: StepValue) => void`

  ::: details 查看 StepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#StepValue{ts}

  <<< @/../packages/editor/src/type.ts#BaseStepValue{ts}

  <<< @/../packages/editor/src/type.ts#StepExtra{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpType{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}

  <<< @/../packages/schema/src/index.ts#MNode{ts}
  :::

  :::tip
  回调签名已与其它历史类型统一为 `(id, step)`。当游标处于历史栈边界（已无法继续撤销 / 重做）时 `undo` / `redo` 返回 `null`，此时不会触发该事件。
  :::

## marker-change

- **详情：** 通过 [`setMarker`](./historyServiceMethods.md#setmarker) 为某个历史栈种入 `initial` 基线时触发（适用于所有类型）

- **事件回调函数：** `(id: Id, marker: StepValue, stepType: HistoryStepType) => void`

## clear

- **详情：** 调用 [`clear`](./historyServiceMethods.md#clear) 清空历史栈时触发（适用于所有类型）

- **事件回调函数：** `(id: Id | undefined, stepType: HistoryStepType) => void`

  :::tip
  `id` 缺省（清空 `stepType` 下全部栈）时回调的 `id` 为 `undefined`。
  :::

## code-block-history-change

- **详情：** 代码块历史记录发生变化（`push('codeBlock', step, codeBlockId)` / `undo('codeBlock', id)` / `redo('codeBlock', id)` 成功时触发）

- **事件回调函数：** `(codeBlockId: Id, step: CodeBlockStepValue) => void`

  ::: details 查看 CodeBlockStepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#CodeBlockStepValue{ts}

  <<< @/../packages/editor/src/type.ts#BaseStepValue{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}

  <<< @/../packages/schema/src/index.ts#CodeBlockContent{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}
  :::

  :::tip
  - 新增触发的 step 其 diff 项 `oldSchema` 为 `null`
  - 删除触发的 step 其 diff 项 `newSchema` 为 `null`
  - `undo` / `redo` 返回 `null`（边界状态）时不会触发该事件
  :::

## data-source-history-change

- **详情：** 数据源历史记录发生变化（`push('dataSource', step, dataSourceId)` / `undo('dataSource', id)` / `redo('dataSource', id)` 成功时触发）

- **事件回调函数：** `(dataSourceId: Id, step: DataSourceStepValue) => void`

  ::: details 查看 DataSourceStepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#DataSourceStepValue{ts}

  <<< @/../packages/editor/src/type.ts#BaseStepValue{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}
  :::

  :::tip
  - 新增触发的 step 其 diff 项 `oldSchema` 为 `null`
  - 删除触发的 step 其 diff 项 `newSchema` 为 `null`
  - `undo` / `redo` 返回 `null`（边界状态）时不会触发该事件
  :::

## mark-saved

- **详情：** 调用 [`markSaved`](./historyServiceMethods.md#marksaved) 标记「已保存」记录时触发

- **事件回调函数：** `(payload: { kind: 'all' | HistoryStepType; id?: Id }) => void`

  ::: tip
  - `markSaved(stepType)`（缺省 id）触发时 `kind` 为 `all`，无 `id`（此时 `stepType` 不生效）
  - `markSaved(stepType, id)` 触发时 `kind` 为对应的 `stepType`（`page` / `codeBlock` / `dataSource` / 扩展），`id` 为目标栈 id
  :::

## save-to-indexed-db

- **详情：** `saveToIndexedDB` 把历史记录写入本地 IndexedDB 成功时触发

- **事件回调函数：** `(snapshot: PersistedHistoryState) => void`

  ::: details 查看 PersistedHistoryState 类型定义
  <<< @/../packages/editor/src/type.ts#PersistedHistoryState{ts}

  <<< @/../packages/editor/src/utils/undo-redo.ts#SerializedUndoRedo{ts}
  :::

## restore-from-indexed-db

- **详情：** `restoreFromIndexedDB` 从本地 IndexedDB 读取并重建历史记录成功时触发（找不到记录时不触发）

- **事件回调函数：** `(snapshot: PersistedHistoryState) => void`

  ::: details 查看 PersistedHistoryState 类型定义
  <<< @/../packages/editor/src/type.ts#PersistedHistoryState{ts}
  :::

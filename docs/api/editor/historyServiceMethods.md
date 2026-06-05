# historyService方法

## reset

- **详情：**

  重置全部历史记录（包括页面节点栈、代码块栈、数据源栈），并重置当前页面 id / canRedo / canUndo

## resetPage

- **详情：**

  重置当前页面的历史记录状态（清空当前页面id，重置 canRedo/canUndo）

## resetState

- **详情：**

  重置历史记录全部内部状态（清空 pageId、pageSteps、canRedo、canUndo、codeBlockState、dataSourceState）

## changePage

- **参数：**
  - `{MPage | MPageFragment} page`

  ::: details 查看 MPage / MPageFragment 类型定义
  <<< @/../packages/schema/src/index.ts#MPage{ts}

  <<< @/../packages/schema/src/index.ts#MPageFragment{ts}
  :::

- **详情：**

  按页面切换历史堆栈

## push

- **参数：**
  - `{StepValue} state`

  ::: details 查看 StepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#StepValue{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpType{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}

  <<< @/../packages/schema/src/index.ts#MNode{ts}

  <<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}
  :::

- **返回：**
  - `{StepValue | null}`

- **详情：**

  添加一条历史记录

  ::: tip
  `opType: 'update'` 的每个 `updatedItems[i]` 上可携带 `changeRecords`，用于撤销 / 重做时仅按
  `propPath` 局部更新对应字段，避免整节点替换冲掉同节点上的其它无关变更；不带
  `changeRecords` 时退化为整节点替换（如 `sort` / `moveLayer` / 拖动等纯快照场景）。

  `StepValue` 上的 `historyDescription` / `source` 仅用于历史面板展示与埋点，不影响 undo/redo 行为。

  入栈时会为每条记录自动生成唯一标识 `uuid`（调用方未指定时），可用于精确引用 / 定位某一条历史记录。
  若需要在执行 DSL 操作后拿到本次写入记录的 `uuid`，可使用 editorService / dataSourceService /
  codeBlockService 提供的 `*AndGetHistoryId` 方法，参见
  [editorService 历史记录 uuid 与 \*AndGetHistoryId](./editorServiceMethods.md#历史记录-uuid-与-andgethistoryid)。
  `pushCodeBlock` / `pushDataSource` 同样会自动写入 `uuid`。
  :::

## undo

- **返回：**
  - `{StepValue | null}`

- **详情：**

  撤销当前操作。`opType: 'update'` 时，若 `updatedItems[i].changeRecords` 存在，会按
  `propPath` 从 `oldNode` 取值做局部回滚；否则用 `oldNode` 整节点替换。

## redo

- **返回：**
  - `{StepValue | null}`

- **详情：**

  恢复到下一步。`opType: 'update'` 时，若 `updatedItems[i].changeRecords` 存在，会按
  `propPath` 从 `newNode` 取值做局部重做；否则用 `newNode` 整节点替换。

## pushCodeBlock

- **参数：**
  - `{Id} codeBlockId` 代码块 id
  - `{Object} payload`
    - `{CodeBlockContent | null} oldContent` 变更前的代码块内容；新增时为 `null`
    - `{CodeBlockContent | null} newContent` 变更后的代码块内容；删除时为 `null`
    - `{ChangeRecord[]} changeRecords` 可选；form 端 propPath/value 变更列表，撤销/重做时若有则按 propPath 局部更新；缺省（或空数组）才退化为整内容替换
    - `{string}` historyDescription 可选；人类可读描述，用于历史面板展示；不影响 undo/redo 行为
    - `{HistoryOpSource}` source 可选；操作途径，用于历史面板展示与埋点；不影响 undo/redo 行为

  ::: details 查看 CodeBlockStepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#CodeBlockStepValue{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}

  <<< @/../packages/schema/src/index.ts#CodeBlockContent{ts}

  <<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}
  :::

- **返回：**
  - `{CodeBlockStepValue | null}` 入栈失败（未传 id）时返回 `null`

- **详情：**

  推入一条代码块变更记录。与页面 / 节点完全无关，按 `codeBlockId` 维度独立一份 `UndoRedo` 栈，
  栈实例存放在 `historyService.state.codeBlockState[codeBlockId]`。

  入栈成功后会触发 `code-block-history-change` 事件。

  ::: tip
  `codeBlockService.setCodeDslByIdSync` 与 `codeBlockService.deleteCodeDslByIds` 内部已经
  自动调用本方法，业务代码通常无需手动调用。
  :::

## undoCodeBlock

- **参数：**
  - `{Id} codeBlockId`

- **返回：**
  - `{CodeBlockStepValue | null}` 栈不存在或已无可撤销记录时返回 `null`

- **详情：**

  撤销指定代码块的最近一次变更。成功时会触发 `code-block-history-change` 事件。
  拿到 step 后由调用方根据 `step.oldContent` 写回 `codeBlockService`（本方法不会自动回放）。

## redoCodeBlock

- **参数：**
  - `{Id} codeBlockId`

- **返回：**
  - `{CodeBlockStepValue | null}` 栈不存在或已无可重做记录时返回 `null`

- **详情：**

  重做指定代码块的下一次变更。成功时会触发 `code-block-history-change` 事件。

## canUndoCodeBlock

- **参数：**
  - `{Id} codeBlockId`

- **返回：**
  - `{boolean}`

- **详情：**

  指定代码块当前是否可撤销。栈不存在时返回 `false`。

## canRedoCodeBlock

- **参数：**
  - `{Id} codeBlockId`

- **返回：**
  - `{boolean}`

- **详情：**

  指定代码块当前是否可重做。栈不存在时返回 `false`。

## pushDataSource

- **参数：**
  - `{Id} dataSourceId` 数据源 id
  - `{Object} payload`
    - `{DataSourceSchema | null} oldSchema` 变更前的数据源 schema；新增时为 `null`
    - `{DataSourceSchema | null} newSchema` 变更后的数据源 schema；删除时为 `null`
    - `{ChangeRecord[]} changeRecords` 可选；form 端 propPath/value 变更列表，撤销/重做时若有则按 propPath 局部更新；缺省（或空数组）才退化为整 schema 替换
    - `{string}` historyDescription 可选；人类可读描述，用于历史面板展示；不影响 undo/redo 行为
    - `{HistoryOpSource}` source 可选；操作途径，用于历史面板展示与埋点；不影响 undo/redo 行为

  ::: details 查看 DataSourceStepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#DataSourceStepValue{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}

  <<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}
  :::

- **返回：**
  - `{DataSourceStepValue | null}` 入栈失败（未传 id）时返回 `null`

- **详情：**

  推入一条数据源变更记录。与页面 / 节点完全无关，按 `dataSourceId` 维度独立一份 `UndoRedo` 栈，
  栈实例存放在 `historyService.state.dataSourceState[dataSourceId]`。

  入栈成功后会触发 `data-source-history-change` 事件。

  ::: tip
  `dataSourceService.add` / `update` / `remove` 内部已经自动调用本方法，业务代码通常无需手动调用。
  :::

## undoDataSource

- **参数：**
  - `{Id} dataSourceId`

- **返回：**
  - `{DataSourceStepValue | null}`

- **详情：**

  撤销指定数据源的最近一次变更。成功时会触发 `data-source-history-change` 事件。
  拿到 step 后由调用方根据 `step.oldSchema` 写回 `dataSourceService`（本方法不会自动回放）。

## redoDataSource

- **参数：**
  - `{Id} dataSourceId`

- **返回：**
  - `{DataSourceStepValue | null}`

- **详情：**

  重做指定数据源的下一次变更。成功时会触发 `data-source-history-change` 事件。

## canUndoDataSource

- **参数：**
  - `{Id} dataSourceId`

- **返回：**
  - `{boolean}`

- **详情：**

  指定数据源当前是否可撤销。栈不存在时返回 `false`。

## canRedoDataSource

- **参数：**
  - `{Id} dataSourceId`

- **返回：**
  - `{boolean}`

- **详情：**

  指定数据源当前是否可重做。栈不存在时返回 `false`。

## destroy

- **详情：**

  销毁


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

  <<< @/../packages/schema/src/index.ts#Id{ts}

  <<< @/../packages/schema/src/index.ts#MNode{ts}
  :::

- **返回：**
  - `{StepValue | null}`

- **详情：**

  添加一条历史记录

## undo

- **返回：**
  - `{StepValue | null}`

- **详情：**

  撤销当前操作

## redo

- **返回：**
  - `{StepValue | null}`

- **详情：**

  恢复到下一步

## pushCodeBlock

- **参数：**
  - `{Id} codeBlockId` 代码块 id
  - `{Object} payload`
    - `{CodeBlockContent | null} oldContent` 变更前的代码块内容；新增时为 `null`
    - `{CodeBlockContent | null} newContent` 变更后的代码块内容；删除时为 `null`

  ::: details 查看 CodeBlockStepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#CodeBlockStepValue{ts}

  <<< @/../packages/schema/src/index.ts#CodeBlockContent{ts}
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

  ::: details 查看 DataSourceStepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#DataSourceStepValue{ts}
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


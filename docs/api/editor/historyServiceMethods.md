# historyService方法

## reset

- **详情：**

  重置记录

## resetPage

- **详情：**

  重置当前页面的历史记录状态（清空当前页面id，重置 canRedo/canUndo）

## resetState

- **详情：**

  重置历史记录全部内部状态（清空 pageId、pageSteps、canRedo、canUndo）

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

## destroy

- **详情：**

  销毁


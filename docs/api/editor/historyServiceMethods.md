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
  - {[MPage](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/schema/src/index.ts#L157) | [MPageFragment](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/schema/src/index.ts#L162)} page

- **详情：**

  按页面切换历史堆栈

## push

- **参数：**
  - {[StepValue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L400-L404)} state

- **返回：**
  - {[StepValue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L400-L404) | null}

- **详情：**

  添加一条历史记录

## undo

- **返回：**
  - {[StepValue](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/editor/src/type.ts#L554-L573) | null}

- **详情：**

  撤销当前操作

## redo

- **返回：**
  - {[StepValue](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/editor/src/type.ts#L554-L573) | null}

- **详情：**

  恢复到下一步

## destroy

- **详情：**

  销毁

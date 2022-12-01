# historyService方法

## reset

- **详情：**

  重置记录

## changePage

- **参数：**

  - {[MPage](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L61)} page

- **详情：**

  按页面切换历史堆栈

## empty

- **详情：**

  重置记录，同[reset](#reset)
## push

- **参数：**

  - {[StepValue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L400-L404)} state

- **返回：**

  - {[StepValue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L400-L404) | null}

- **详情：**

  添加一条历史记录

## undo

- **返回：**

  - {Promise<[StepValue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L400-L404) | null>}

- **详情：**

  撤销当前操作

## redo

- **返回：**

  - {Promise<[StepValue](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L400-L404) | null>}

- **详情：**

  恢复到下一步

## destroy

- **详情：**

  销毁

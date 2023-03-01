
# editorService事件

## root-change

- **详情：** dsl跟节点发生变化，[editorService.set('root', {})](./editorServiceMethods.md#set)后触发

- **回调函数：** (value: [MApp](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/schema/src/index.ts?plain=1#L66-L73), preValue: [MApp](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/schema/src/index.ts?plain=1#L66-L73)) => void

## select

- **详情：** 选中组件，[editorService.select()](./editorServiceMethods.md#select)后触发

- **回调函数：** (node: [MNode](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L99)) => void

## add

- **详情：** 选中组件，[editorService.add()](./editorServiceMethods.md#add)后触发

- **回调函数：** (node: [MNode](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L99)[]) => void


## remove

- **详情：** 选中组件，[editorService.remove()](./editorServiceMethods.md#remove)后触发

- **回调函数：** (node: [MNode](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L99)[]) => void


## update

- **详情：** 选中组件，[editorService.update()](./editorServiceMethods.md#update)后触发

- **回调函数：** (node: [MNode](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L99)[]) => void


## history-change
- **详情：** 历史记录改变，[editorService.redo()，editorService.undo()](./editorServiceMethods.html#undo)后触发

- **回调函数：** (node: [MNode](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L99)) => void
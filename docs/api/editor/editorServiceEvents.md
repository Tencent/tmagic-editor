# editorService事件

## root-change

- **详情：** dsl跟节点发生变化，[editorService.set('root', {})](./editorServiceMethods.md#set)后触发

- **事件回调函数：** (value: [MApp](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/schema/src/index.ts?plain=1#L66-L73), preValue?: [MApp](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/schema/src/index.ts?plain=1#L66-L73)) => void

## select

- **详情：** 选中组件，[editorService.select()](./editorServiceMethods.md#select)后触发

- **事件回调函数：** (node: [MNode](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/schema/src/index.ts#L210)) => void

## add

- **详情：** 添加节点后触发，[editorService.add()](./editorServiceMethods.md#add)后触发

- **事件回调函数：** (node: [MNode](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/schema/src/index.ts#L210)[]) => void

## remove

- **详情：** 删除节点后触发，[editorService.remove()](./editorServiceMethods.md#remove)后触发

- **事件回调函数：** (node: [MNode](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/schema/src/index.ts#L210)[]) => void

## update

- **详情：** 更新组件后触发，[editorService.update()](./editorServiceMethods.md#update)后触发

- **事件回调函数：** (data: Array<{ newNode: [MNode](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/schema/src/index.ts#L210); oldNode: [MNode](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/schema/src/index.ts#L210); changeRecords?: [ChangeRecord](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/form/src/schema.ts#L27-L39)[] }>) => void

## move-layer

- **详情：** 移动节点层级后触发，[editorService.moveLayer()](./editorServiceMethods.md#movelayer)后触发

- **事件回调函数：** (offset: number | [LayerOffset](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts)) => void

  其中 `LayerOffset` 枚举值为 `'top'` / `'bottom'`

## drag-to

- **详情：** 拖拽节点到指定容器后触发，[editorService.dragTo()](./editorServiceMethods.md#dragto)后触发

- **事件回调函数：** (data: { targetIndex: number; configs: [MNode](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/schema/src/index.ts#L210) | [MNode](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/schema/src/index.ts#L210)[]; targetParent: [MContainer](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L54-L59) }) => void

## history-change

- **详情：** 历史记录改变，[editorService.redo()，editorService.undo()](./editorServiceMethods.md#undo)后触发

- **事件回调函数：** (data: [MPage](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L61) | [MPageFragment](https://github.com/Tencent/tmagic-editor/blob/cce8b63fc3618b5b811aa33c703de21c22be8a6a/packages/schema/src/index.ts#L210)) => void

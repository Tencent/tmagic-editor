# editorService事件

## root-change

- **详情：** dsl跟节点发生变化，[editorService.set('root', {})](./editorServiceMethods.md#set)后触发

- **事件回调函数：** `(value: MApp, preValue?: MApp) => void`

  ::: details 查看 MApp 及关联类型定义
  <<< @/../packages/schema/src/index.ts#MApp{ts}

  <<< @/../packages/schema/src/index.ts#MComponent{ts}

  <<< @/../packages/schema/src/index.ts#NodeType{ts}

  <<< @/../packages/schema/src/index.ts#MPage{ts}

  <<< @/../packages/schema/src/index.ts#MPageFragment{ts}

  <<< @/../packages/schema/src/index.ts#CodeBlockDSL{ts}

  <<< @/../packages/schema/src/index.ts#DataSourceSchema{ts}

  <<< @/../packages/schema/src/index.ts#DataSourceDeps{ts}
  :::

## select

- **详情：** 选中组件，[editorService.select()](./editorServiceMethods.md#select)后触发

- **事件回调函数：** `(node: MNode) => void`

  ::: details 查看 MNode 及关联类型定义
  <<< @/../packages/schema/src/index.ts#MNode{ts}

  <<< @/../packages/schema/src/index.ts#MComponent{ts}

  <<< @/../packages/schema/src/index.ts#MContainer{ts}

  <<< @/../packages/schema/src/index.ts#MPage{ts}

  <<< @/../packages/schema/src/index.ts#MPageFragment{ts}
  :::

## add

- **详情：** 添加节点后触发，[editorService.add()](./editorServiceMethods.md#add)后触发

- **事件回调函数：** `(node: MNode[]) => void`

## remove

- **详情：** 删除节点后触发，[editorService.remove()](./editorServiceMethods.md#remove)后触发

- **事件回调函数：** `(node: MNode[]) => void`

## update

- **详情：** 更新组件后触发，[editorService.update()](./editorServiceMethods.md#update)后触发

- **事件回调函数：** `(data: Array<{ newNode: MNode; oldNode: MNode; changeRecords?: ChangeRecord[] }>) => void`

  ::: details 查看 ChangeRecord 类型定义
  <<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}
  :::

## move-layer

- **详情：** 移动节点层级后触发，[editorService.moveLayer()](./editorServiceMethods.md#movelayer)后触发

- **事件回调函数：** `(offset: number | LayerOffset) => void`

  其中 `LayerOffset` 枚举值为 `'top'` / `'bottom'`

## drag-to

- **详情：** 拖拽节点到指定容器后触发，[editorService.dragTo()](./editorServiceMethods.md#dragto)后触发

- **事件回调函数：** `(data: { targetIndex: number; configs: MNode | MNode[]; targetParent: MContainer }) => void`

  ::: details 查看 MContainer 类型定义
  <<< @/../packages/schema/src/index.ts#MContainer{ts}
  :::

## history-change

- **详情：** 历史记录改变，[editorService.redo()，editorService.undo()](./editorServiceMethods.md#undo)后触发

- **事件回调函数：** `(data: MPage | MPageFragment) => void`

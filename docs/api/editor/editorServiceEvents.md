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

## change

- **详情：** DSL 发生变更后统一触发，免去分别监听 `add` / `remove` / `update` / `move-layer` / `drag-to`。在 [editorService.add()](./editorServiceMethods.md#add)、[editorService.remove()](./editorServiceMethods.md#remove)、[editorService.update()](./editorServiceMethods.md#update)、[editorService.moveLayer()](./editorServiceMethods.md#movelayer)、[editorService.dragTo()](./editorServiceMethods.md#dragto) 后触发。

  回调参数 `event` 通过 `type` 区分操作类型，并携带本次变更的节点列表 `data`，每项包含变更的 `node` 及其所属的 `page`（可能为 `null`）。`move-layer` 额外携带层级偏移 `offset`，`drag-to` 额外携带目标位置 `targetIndex` / `targetParent`。

  ::: warning 注意
  撤销 / 重做（`undo` / `redo`）内部同样会经由 `add` / `remove` / `update` 触发本事件；如需区分「用户操作」与「撤销重做」，请配合 [history-change](#history-change) 事件判断。
  :::

- **事件回调函数：** `(event: EditorChangeEvent) => void`

  ::: details 查看 EditorChangeEvent 类型定义
  <<< @/../packages/editor/src/type.ts#EditorChangeEvent{ts}
  :::

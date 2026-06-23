# historyService方法

## reset

- **详情：**

  重置全部历史记录：清空 `state.steps` 下的页面 / 代码块 / 数据源 / 扩展类型全部栈（保留已注册的扩展类型键）。

## resetState

- **详情：**

  同 [`reset`](#reset)，清空 `state.steps` 下全部栈。

  ::: tip
  历史服务不再维护「当前活动页」状态（已移除 `state.pageId` / `state.canUndo` / `state.canRedo`）。
  活动页由 `editorService` 维护，撤销 / 重做 / 读取页面历史时请显式传入 pageId。
  是否可撤销 / 重做请改用 [`canUndo`](#canundo) / [`canRedo`](#canredo)。
  :::

## registerStepType

- **参数：**
  - `{string} stepType` 自定义历史类型标识（勿与内置 `page` / `codeBlock` / `dataSource` 重名）
  - `{Object} options` 可选
    - `{string} event` push / undo / redo 后派发的事件名；缺省为 `${stepType}-history-change`
    - `{string} name` 历史面板中的展示名称（tab / 分组标题等）；缺省回退到 stepType 本身

- **详情：**

  注册一个扩展历史类型，使其可与内置 `page` / `codeBlock` / `dataSource` 一样走统一的
  [`push`](#push) / [`undo`](#undo) / [`redo`](#redo)（按 id 分栈、独立 undo/redo）。
  注册后该类型的栈存放在 `historyService.state.steps[stepType]`，展示名称存放在 `historyService.state.stepNames[stepType]`。

## getStepName

- **参数：**
  - `{HistoryStepType} stepType` 历史类型

- **返回：**
  - `{string}` 该类型的展示名称（用于历史面板 tab / 分组标题等）；未登记时回退到 stepType 本身

- **详情：**

  读取指定历史类型的展示名称。内置 `page` / `codeBlock` / `dataSource` 默认分别为「页面 / 代码块 / 数据源」。

## setStepName

- **参数：**
  - `{HistoryStepType} stepType` 历史类型
  - `{string} name` 展示名称

- **详情：**

  设置指定历史类型的展示名称（写入 `historyService.state.stepNames`，历史面板会响应式刷新）。
  内置 `page` / `codeBlock` / `dataSource` 也可在此覆盖默认中文名。

## push

- **参数：**
  - `{HistoryStepType} stepType` 历史类型，内置 `'page'` / `'codeBlock'` / `'dataSource'`，并支持通过 [`registerStepType`](#registersteptype) 扩展
  - `{StepValue | BaseStepValue} step` 已构造好的历史记录（缺省自动补全 `uuid` / `timestamp`）
  - `{Id} id` 必填；目标栈 id（`page` 为 pageId，其余类型为对应资源 id）

  ::: details 查看 StepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#StepValue{ts}

  <<< @/../packages/editor/src/type.ts#BaseStepValue{ts}

  <<< @/../packages/editor/src/type.ts#StepExtra{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpType{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}

  <<< @/../packages/schema/src/index.ts#MNode{ts}

  <<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}
  :::

- **返回：**
  - `{StepValue | BaseStepValue | null}` 入栈失败（未传 / 无效 id）时返回 `null`

- **详情：**

  添加一条历史记录。统一入口，所有类型（`page` / `codeBlock` / `dataSource` / 扩展）行为完全一致：按 `stepType` 选择目标栈类型、按 `id`（必填）选择具体栈，按需建栈后入栈，并派发对应的历史变更事件（`page` 为 `change`，其余如 `code-block-history-change` / `data-source-history-change`），回调签名统一为 `(id, step)`。

  跨页 / 跨资源操作（如把节点搬到其它页）必须显式传入目标 id。`codeBlock` / `dataSource` 的 step 通常由 `createStackStep` 等工具按 `oldValue` / `newValue` 构造后传入。

  ::: tip
  `opType: 'update'` 的每个 diff 项上可携带 `changeRecords`，用于撤销 / 重做时仅按
  `propPath` 局部更新对应字段，避免整节点替换冲掉同节点上的其它无关变更；不带
  `changeRecords` 时退化为整节点替换（如 `sort` / `moveLayer` / 拖动等纯快照场景）。

  `step` 上的 `historyDescription` / `source` 仅用于历史面板展示与埋点，不影响 undo/redo 行为。

  入栈时会为每条记录自动生成唯一标识 `uuid`（调用方未指定时），可用于精确引用 / 定位某一条历史记录。
  若需要在执行 DSL 操作后拿到本次写入记录的 `uuid`，可使用 editorService / dataSourceService /
  codeBlockService 提供的 `*AndGetHistoryId` 方法，参见
  [editorService 历史记录 uuid 与 \*AndGetHistoryId](./editorServiceMethods.md#历史记录-uuid-与-andgethistoryid)。
  :::

## undo

- **参数：**
  - `{HistoryStepType} stepType` 历史类型
  - `{Id} id` 必填；目标栈 id（`page` 为 pageId，其余类型为对应资源 id）

- **返回：**
  - `{StepValue | BaseStepValue | null}`

- **详情：**

  撤销指定历史栈的最近一次变更。所有类型行为一致：按 `stepType` + `id` 定位栈，不会越过 index 0 的 initial 基线（所有类型同等适用，见 [`setMarker`](#setmarker)），仅在确有可撤销 step 时派发对应的历史变更事件（`page` 为 `change`，回调签名 `(id, step)`）。

  `page` 类型 `opType: 'update'` 时，若 diff 项的 `changeRecords` 存在，会按 `propPath` 从 `oldSchema` 取值做局部回滚；否则用 `oldSchema` 整节点替换。`codeBlock` / `dataSource` 拿到 step 后由调用方写回对应 service（本方法不会自动回放）。

## redo

- **参数：**
  - `{HistoryStepType} stepType` 历史类型
  - `{Id} id` 必填；目标栈 id（`page` 为 pageId，其余类型为对应资源 id）

- **返回：**
  - `{StepValue | BaseStepValue | null}`

- **详情：**

  恢复指定历史栈到下一步，语义与 [`undo`](#undo) 对称。`page` 类型 `opType: 'update'` 时，若 diff 项的 `changeRecords` 存在，会按 `propPath` 从 `newSchema` 取值做局部重做；否则用 `newSchema` 整节点替换。

## canUndo

- **参数：**
  - `{HistoryStepType} stepType` 历史类型
  - `{Id} id` 可选；目标栈 id；缺省 / 无效时返回 `false`

- **返回：**
  - `{boolean}`

- **详情：**

  指定历史栈当前是否可撤销（游标高于 index 0 的 initial 基线底线）。适用于所有类型（`page` / `codeBlock` / `dataSource` / 扩展）。

## canRedo

- **参数：**
  - `{HistoryStepType} stepType` 历史类型
  - `{Id} id` 可选；目标栈 id；缺省 / 无效时返回 `false`

- **返回：**
  - `{boolean}`

- **详情：**

  指定历史栈当前是否可重做。适用于所有类型（`page` / `codeBlock` / `dataSource` / 扩展）。

## setMarker

- **参数：**
  - `{HistoryStepType} stepType` 历史类型
  - `{Id} id` 目标栈 id（`page` 为 pageId，其余类型为对应资源 id）
  - `{Object} options` 可选：`name` / `description` / `source`，用于基线的展示信息

- **返回：**
  - `{StepValue | null}` 已存在基线时返回原基线；栈非空（无基线）或 id 无效时返回 `null`

- **详情：**

  为指定历史栈种入一条 `opType: 'initial'` 的「初始基线」记录，作为该栈 index 0 的固定底线：它是真实入栈并随栈持久化的 step，但被钉为撤销 / 回滚的下限，`undo` / `goto` / `revert` 都不会越过它。所有类型（含扩展类型）均可设置基线，仅当目标栈为空时种入。

## getMarker

- **参数：**
  - `{HistoryStepType} stepType` 历史类型
  - `{Id} id` 可选；目标栈 id；缺省 / 无效时返回 `undefined`

- **返回：**
  - `{StepValue | undefined}`

- **详情：**

  读取指定历史栈的初始基线 step（栈 index 0 且 `opType: 'initial'`），不存在时返回 `undefined`。

## markSaved

- **参数：**
  - `{HistoryStepType} stepType` 历史类型，内置另有 `'codeBlock'` / `'dataSource'`，并支持扩展（仅在传入 `id` 时生效）
  - `{Id} id` 可选；目标栈 id。缺省表示标记全部类型、全部栈

- **详情：**

  标记历史记录为「已保存」（把对应栈当前游标所在的记录标记为 `saved = true`）。统一入口：

  - **缺省 `id`**：标记「整份 DSL 已保存」——把所有类型、所有栈当前游标所在的记录都标记为已保存（此时 `stepType` 不生效），触发 `mark-saved` 事件且 `{ kind: 'all' }`。通常在 DSL 整体落库成功后调用。
  - **传入 `id`**：仅标记 `stepType` 下该 id 对应的栈，触发 `mark-saved` 事件且 `{ kind: stepType, id }`（如 `{ kind: 'page', id }` / `{ kind: 'codeBlock', id }` / `{ kind: 'dataSource', id }`）。

  同一栈内任意时刻最多保留一条已保存记录（标记前会清除该栈内全部旧标记）；某个栈处于「全部已撤销」（cursor 为 0）时不会留下已保存记录，从 IndexedDB 恢复时其游标会回到 0。配合 [`restoreFromIndexedDB`](#restorefromindexeddb) 把游标恢复到此处。

## clear

- **参数：**
  - `{HistoryStepType} stepType` 历史类型，内置另有 `'codeBlock'` / `'dataSource'`，并支持扩展
  - `{Id} id` 可选；目标栈 id。缺省表示清空 `stepType` 下的全部栈

- **详情：**

  清空历史记录栈。统一入口，所有类型（page / codeBlock / dataSource / 扩展）行为一致：

  - **传入 `id`**：仅清空 `stepType` 下该 id 对应的栈；
  - **缺省 `id`**：清空 `stepType` 下的全部栈。

  仅删除撤销/重做记录，不会改动 DSL / 代码块 / 数据源本身。清空时会**保留各栈原有的 initial 基线**（文案 / 来源，见 [`setMarker`](#setmarker)），无基线时清空成空栈。清空后触发 `clear` 事件（签名 `(id, stepType)`）。

## saveToIndexedDB

- **参数：**
  - `{HistoryPersistOptions} options` 可选

  ::: details 查看 HistoryPersistOptions / PersistedHistoryState 类型定义
  <<< @/../packages/editor/src/type.ts#HistoryPersistOptions{ts}

  <<< @/../packages/editor/src/type.ts#PersistedHistoryState{ts}

  <<< @/../packages/editor/src/utils/undo-redo.ts#SerializedUndoRedo{ts}
  :::

- **返回：**
  - `{Promise<PersistedHistoryState>}` 写入成功的快照对象

- **详情：**

  把当前内存中的全部历史栈（页面 / 代码块 / 数据源 / 扩展类型）连同各自游标、容量序列化后写入本地 IndexedDB。

  - 最终库名为 `${dbName}-${当前 DSL app id}`，按应用隔离；
  - `key` 用于在同一 store 下区分不同记录，缺省为 `default`；
  - 历史记录里可能包含函数（代码块内容 / 节点事件等），内部使用 `serialize-javascript` 序列化为字符串后写入，恢复时再用 `parseDSL` 还原，因此可安全持久化函数 / `Map` 等；
  - 不支持 IndexedDB 的环境（如 SSR）会 reject。

  写入成功后触发 `save-to-indexed-db` 事件。

  ::: warning
  `beforeunload` / `pagehide` 阶段浏览器不会等待异步 IndexedDB 事务提交，单纯依赖卸载时写入可能丢失最近一次编辑。建议在历史变更时（防抖）即调用本方法持久化，确保刷新后能完整恢复。
  :::

## restoreFromIndexedDB

- **参数：**
  - `{HistoryPersistOptions} options` 可选

- **返回：**
  - `{Promise<PersistedHistoryState | null>}` 找不到记录时返回 `null`

- **详情：**

  从本地 IndexedDB 读取此前保存的历史快照并重建全部撤销/重做栈。

  - 每个栈都会按 `listMaxSize` 裁剪并还原游标；
  - 若某个栈存在已保存记录（见 `markSaved`），其游标会被定位到「最近一条已保存记录」之后，使恢复后的状态与落库的 DSL 对齐；
  - 会整体覆盖当前内存中的历史状态（活动页由 `editorService` 维护，不在此恢复）；
  - 找不到对应记录时返回 `null` 且不改动当前状态；不支持 IndexedDB 的环境会 reject。

  成功后触发 `restore-from-indexed-db` 事件。

## findStepLocationByUuid

- **参数：**
  - `{HistoryStepType} stepType` 历史类型
  - `{string} uuid` 目标历史记录的 uuid
  - `{Id} id` 可选；目标栈 id

- **返回：**
  - `{ { id: Id; index: number } | null }` 找到时返回所属栈 id 与步骤索引；找不到时返回 `null`

- **详情：**

  按历史记录 uuid 在指定历史类型的栈中查找其所属 id 与索引，统一入口。

  - **传入 `id`**：仅在该 id 对应的单个栈中查找（如页面历史按活动页查看，传入 pageId）；
  - **缺省 `id`**：遍历该类型下全部栈查找（代码块 / 数据源等按全部资源分桶的场景）。

  供「按 uuid 回滚」等需要把 uuid 映射回 `(id, index)` 的场景使用，如 [editorService.revertPageStepById](./editorServiceMethods.md#revertpagestepbyid) / [codeBlockService.revertById](./codeBlockServiceMethods.md#revertbyid) / [dataSourceService.revertById](./dataSourceServiceMethods.md#revertbyid) 内部均通过本方法定位步骤。

## destroy

- **详情：**

  销毁

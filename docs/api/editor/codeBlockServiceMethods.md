# codeBlockService方法

## setCodeDsl

- **参数：**
  - {`CodeBlockDSL`} codeDsl 代码块DSL

  ::: details 查看 CodeBlockDSL 及关联类型定义
  <<< @/../packages/schema/src/index.ts#CodeBlockDSL{ts}

  <<< @/../packages/schema/src/index.ts#CodeBlockContent{ts}

  <<< @/../packages/schema/src/index.ts#CodeParam{ts}
  :::

- **返回：**
  - `{Promise<void>}`

- **详情：**

  设置活动的代码块dsl数据源，并触发 `code-dsl-change` 事件

## getCodeDsl

- **返回：**
  - {`CodeBlockDSL` | null}

- **详情：**

  获取活动的代码块dsl数据源（默认从dsl中的codeBlocks字段读取）

## getCodeContentById

- **参数：**
  - `{string | number}` id 代码块id

- **返回：**
  - {`CodeBlockContent` | null}

- **详情：**

  根据代码块id获取代码块内容

## setCodeDslById

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{string | number}` id 代码块id
  - {Partial<`CodeBlockContent`>} codeConfig 代码块内容配置信息

- **返回：**
  - `{Promise<void>}`

- **详情：**

  设置代码块ID和代码内容到源dsl，强制写入；底层调用 [setCodeDslByIdSync](#setcodedslbyidsync)

## setCodeDslByIdSync

- **参数：**
  - `{string | number}` id 代码块id
  - {Partial<`CodeBlockContent`>} codeConfig 代码块内容配置信息
  - `{boolean}` force 是否强制写入，默认 `true`；为 `false` 时若同 id 已存在则跳过

- **返回：**
  - `{void}`

- **详情：**

  同步版本的 [setCodeDslById](#setcodedslbyid)，并会触发 `addOrUpdate` 事件

  ::: tip
  写入成功时（`force=false` 且同 id 已存在的跳过场景除外）会自动调用 `historyService.pushCodeBlock`
  把本次变更入历史栈，参见 [historyService.pushCodeBlock](./historyServiceMethods.md#pushcodeblock)。
  :::

## getCodeDslByIds

- **参数：**
  - `{string[]}` ids 代码块id数组

- **返回：**
  - {`CodeBlockDSL`} 命中的代码块dsl

- **详情：**

  根据代码块id数组获取代码dsl

## getEditStatus

- **返回：**
  - `{boolean}` 是否可编辑

- **详情：**

  获取当前编辑状态

## setEditStatus

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{boolean}` status 是否可编辑

- **返回：**
  - `{Promise<void>}`

- **详情：**

  设置代码块编辑状态

## setCombineIds

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{string[]}` ids 代码块id数组

- **返回：**
  - `{Promise<void>}`

- **详情：**

  设置当前选中组件已关联绑定的代码块id数组

## getCombineIds

- **返回：**
  - `{string[]}` 代码块id数组

- **详情：**

  获取当前选中组件已关联绑定的代码块id数组

## getUndeletableList

- **返回：**
  - `{(string | number)[]}` 代码块id数组

- **详情：**

  获取不可删除列表

## setUndeleteableList

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{(string | number)[]}` codeIds 代码块id数组

- **返回：**
  - `{Promise<void>}`

- **详情：**

  设置不可删除列表：为业务逻辑预留的不可删除的代码块列表，由业务逻辑维护（如代码块上线后不可删除）

## setCodeDraft

- **参数：**
  - `{string | number}` codeId 代码块id
  - `{string}` content 代码草稿内容

- **返回：**
  - `{void}`

- **详情：**

  将代码草稿写入 localStorage

## getCodeDraft

- **参数：**
  - `{string | number}` codeId 代码块id

- **返回：**
  - `{string | null}` 代码草稿内容

- **详情：**

  从 localStorage 读取代码草稿

## removeCodeDraft

- **参数：**
  - `{string | number}` codeId 代码块id

- **返回：**
  - `{void}`

- **详情：**

  删除 localStorage 中的代码草稿

## deleteCodeDslByIds

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{(string | number)[]}` codeIds 需要删除的代码块id数组

- **返回：**
  - `{Promise<void>}`

- **详情：**

  在dsl数据源中删除指定id的代码块，每删除一个会触发一次 `remove` 事件

  ::: tip
  对每个实际存在并被删除的代码块，会自动调用 `historyService.pushCodeBlock` 入栈一条
  `newContent=null` 的删除记录；不存在的 id 不会入历史。
  :::

## setParamsColConfig

- **参数：**
  - `{TableColumnConfig}` config 参数列配置

- **返回：**
  - `{void}`

- **详情：**

  设置代码块入参表格列配置

## getParamsColConfig

- **返回：**
  - `{TableColumnConfig | undefined}` 参数列配置

- **详情：**

  获取代码块入参表格列配置

## getUniqueId

- **返回：**
  - `{Promise<string>}` 代码块唯一id

- **详情：**

  生成代码块唯一id（格式为 `code_xxxx`），与已有id冲突时会递归重试

## copyWithRelated

- **参数：**
  - {`MNode` | `MNode`[]} config 组件节点配置
  - `{TargetOptions}` collectorOptions 可选的依赖收集器配置

  ::: details 查看 MNode 及关联类型定义
  <<< @/../packages/schema/src/index.ts#MNode{ts}

  <<< @/../packages/schema/src/index.ts#MComponent{ts}

  <<< @/../packages/schema/src/index.ts#MContainer{ts}

  <<< @/../packages/schema/src/index.ts#MIteratorContainer{ts}

  <<< @/../packages/schema/src/index.ts#MPage{ts}

  <<< @/../packages/schema/src/index.ts#MApp{ts}

  <<< @/../packages/schema/src/index.ts#MPageFragment{ts}
  :::

- **返回：**
  - `{void}`

- **详情：**

  复制组件时会带上组件关联的代码块，将关联的代码块dsl存储到 localStorage

## paste

- **返回：**
  - `{void}`

- **详情：**

  粘贴代码块。从 localStorage 读取已复制的代码块dsl并写入当前dsl，已存在同id的代码块不会被覆盖

## resetState

- **返回：**
  - `{void}`

- **详情：**

  重置 codeBlockService 状态

## destroy

- **返回：**
  - `{void}`

- **详情：**

  销毁 codeBlockService，重置状态并移除所有事件监听和插件

## usePlugin

- **详情：**

  usePlugin支持灵活细致的扩展， 上述方法中标记有`扩展支持： 是`的方法都支持使用usePlugin扩展

每个支持扩展的方法都支持定制before、after两个hook来干预原有方法的行为，before可以用于修改传入参数，after可以用于修改返回的值

## removeAllPlugins

- **详情：**

删掉当前设置的所有扩展


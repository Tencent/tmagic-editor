# editorService方法

## 历史记录相关 options

下列 DSL 操作方法（[add](#add)、[remove](#remove)、[update](#update) 等）的 `options` / `data` 参数，以及
[codeBlockService](./codeBlockServiceMethods.md) / [dataSourceService](./dataSourceServiceMethods.md)
的 `options`，在 `doNotPushHistory` 之外还可传入：

- `{string}` **historyDescription**：入栈时附带的人类可读描述，用于历史面板展示；不影响 undo/redo 行为，缺省时面板会自动生成描述
- `{HistoryOpSource}` **historySource**：操作途径，用于历史面板展示与埋点；不影响 undo/redo 行为，缺省时面板视为「未知」

编辑器内置交互（画布、树面板、配置面板、右键菜单、快捷键等）会自动传入对应的 `historySource`；
业务侧程序化调用时建议显式传入（如 `api`），便于历史面板区分来源。

## 历史记录 uuid 与 \*AndGetHistoryId

每条历史记录入栈时都会自动生成一个唯一标识 `uuid`（见 [StepValue](#undo)），可用于精确引用 / 定位某一条历史记录（如埋点、回滚、跨端同步等）。

DSL 操作方法（`add` / `remove` / `update` 等）默认返回操作结果（节点 / 节点集合 / void），不会返回 `uuid`。若需要拿到本次写入历史记录的 `uuid`，可改用对应的 `*AndGetHistoryId` 方法：它们与原方法行为完全一致，仅把返回值换成本次写入历史记录的 `uuid`（`string`）。当本次操作未写入历史（`doNotPushHistory: true`、无实际变更或提前返回）时返回 `null`。

| 原方法 | 取 uuid 的方法 | 返回值 |
| --- | --- | --- |
| [add](#add) | [addAndGetHistoryId](#addandgethistoryid) | `Promise<string \| null>` |
| [remove](#remove) | [removeAndGetHistoryId](#removeandgethistoryid) | `Promise<string \| null>` |
| [update](#update) | [updateAndGetHistoryId](#updateandgethistoryid) | `Promise<string \| null>` |
| [moveLayer](#movelayer) | [moveLayerAndGetHistoryId](#movelayerandgethistoryid) | `Promise<string \| null>` |
| [moveToContainer](#movetocontainer) | [moveToContainerAndGetHistoryId](#movetocontainerandgethistoryid) | `Promise<string \| null>` |
| [dragTo](#dragto) | [dragToAndGetHistoryId](#dragtoandgethistoryid) | `Promise<string \| null>` |

[dataSourceService](./dataSourceServiceMethods.md) / [codeBlockService](./codeBlockServiceMethods.md) 也提供了同名约定的 `*AndGetHistoryId` 方法。

拿到 `uuid` 后，可在需要时按 uuid「回滚」对应的历史记录（类 git revert 语义，详见[历史记录面板](../../guide/advanced/history-list.md)）。相比按 index 回滚，uuid 不会随栈内步骤增删而变化，更适合业务侧持有引用后再回滚：

- 页面：[editorService.revertPageStepById(uuid)](#revertpagestepbyid)
- 数据源：[dataSourceService.revertById(uuid)](./dataSourceServiceMethods.md#revertbyid)
- 代码块：[codeBlockService.revertById(uuid)](./codeBlockServiceMethods.md#revertbyid)

::: details 查看 HistoryOpOptions / DslOpOptions / HistoryOpSource 类型定义
<<< @/../packages/editor/src/type.ts#HistoryOpOptions{ts}

<<< @/../packages/editor/src/type.ts#DslOpOptions{ts}

<<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}
:::

## get

- **参数：**
  - `{'root' | 'page' | 'parent' | 'node' | 'highlightNode' | 'nodes' | 'modifiedNodeIds' | 'pageLength' | 'pageFragmentLength' | 'stage' | 'stageLoading' | 'disabledMultiSelect' | 'alwaysMultiSelect'} name`

- **返回：**
  - `{any} value`

- **详情：**

  获取当前指指定name的值

  'root': 当前整个配置，也就是当前编辑器的值

  'page': 当前正在编辑的页面配置

  'parent': 当前选中的节点的父节点

  'node': 当前选中的第一个节点

  'highlightNode': 当前高亮的节点

  'nodes': 当前选中的所有节点

  'modifiedNodeIds': 当前页面所有改动过的节点id

  'pageLength': 所以页面个数

  'pageFragmentLength': 页面片个数

  'stage': [StageCore](../stage/coreMethods.md)实例

  'stageLoading': 画布是否加载中

  'disabledMultiSelect': 是否禁用多选

  'alwaysMultiSelect': 是否始终启用多选模式（无需按住 Ctrl/Meta）

- **示例：**

```js
import { editorService } from "@tmagic/editor";

const node = editorService.get("node");
```

## set

- `{'root' | 'page' | 'parent' | 'node' | 'highlightNode' | 'nodes' | 'modifiedNodeIds' | 'pageLength' | 'pageFragmentLength' | 'stage' | 'stageLoading' | 'disabledMultiSelect' | 'alwaysMultiSelect'} name`
- `{any} value`

- **详情：**
  参考[get](#get)方法

- **示例：**

```js
import { editorService } from "@tmagic/editor";

const node = editorService.get("node");

editorService.set("node", {
  ...node,
  name: "new name",
});
```

## getNodeInfo

- **参数：**
  - `{number | string}` id 组件id
  - `{boolean}` raw 是否使用toRaw，默认为true

:::tip
如果raw为false，对获取到的对象进行操作会触发vue响应式处理
:::

- **返回：**
  - {`EditorNodeInfo`}

  ::: details 查看 EditorNodeInfo 及关联类型定义
  <<< @/../packages/editor/src/type.ts#EditorNodeInfo{ts}

  <<< @/../packages/schema/src/index.ts#MNode{ts}

  <<< @/../packages/schema/src/index.ts#MContainer{ts}

  <<< @/../packages/schema/src/index.ts#MPage{ts}

  <<< @/../packages/schema/src/index.ts#MPageFragment{ts}
  :::

- **详情：**

  根据id获取组件、组件的父组件以及组件所属的页面节点

- **示例：**

```js
import { editorService } from "@tmagic/editor";

const info = editorService.getNodeInfo("text_123");

console.log(info.node);
console.log(info.parent);
console.log(info.page);
```

## getNodeById

- **参数：**
  - `{number | string}` id
  - `{boolean}` raw 是否使用toRaw，默认为true

- **返回：**
  - {`MNode`} 组件节点配置

  ::: details 查看 MNode 及关联类型定义
  <<< @/../packages/schema/src/index.ts#MNode{ts}

  <<< @/../packages/schema/src/index.ts#MComponent{ts}

  <<< @/../packages/schema/src/index.ts#MContainer{ts}

  <<< @/../packages/schema/src/index.ts#MIteratorContainer{ts}

  <<< @/../packages/schema/src/index.ts#MPage{ts}

  <<< @/../packages/schema/src/index.ts#MApp{ts}

  <<< @/../packages/schema/src/index.ts#MPageFragment{ts}
  :::

- **详情：**

  根据id获取组件的信息

- **示例：**

```js
import { editorService } from "@tmagic/editor";

const node = editorService.getNodeById("text_123");

console.log(node);
```

## getParentById

- **参数：**
  - `{number | string}` id
  - `{boolean}` raw 是否使用toRaw，默认为true

- **返回：**
  - {`MNode`} 指点组件的父节点配置

- **详情：**

  根据ID获取指点节点的父节点配置

- **示例：**

```js
import { editorService } from "@tmagic/editor";

const parent = editorService.getParentById("text_123");

console.log(parent);
```

## isOnDifferentPage

- **参数：**
  - {`MNode`} node 节点配置

- **返回：**
  - `{boolean}` true 表示该节点位于非当前页面（即选中该节点将会引起当前页面切换）

- **详情：**

  判断给定节点是否位于非当前页面，通常用于配合 `doNotSwitchPage` 选项判断 DSL 操作是否会引起页面切换

- **示例：**

```js
import { editorService } from "@tmagic/editor";

const otherPageNode = editorService.getNodeById("text_456");
if (editorService.isOnDifferentPage(otherPageNode)) {
  console.log("该节点在其它页面，操作会触发页面切换");
}
```

## getLayout

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode`} parent
  - {`MNode`} node 可选

- **返回：**
  - {Promise<`Layout`>} 当前布局模式

  ::: details 查看 Layout 类型定义
  <<< @/../packages/editor/src/type.ts#Layout{ts}
  :::

- **详情：**

  只有容器拥有布局，目前支持的布局有流式布局（relative），绝对定位布局（absolute），固定定位布局（fixed）

  :::tip
  固定定位布局需要从当前选中节点判断，固需要传递可选参数 node

  其他布局则是从父组件（容器）来判断
  :::

- **示例：**

```js
import { editorService } from "@tmagic/editor";

const parent = editorService.getParentById("text_123");
editorService.getLayout(parent).then((layout) => {
  console.log(parent);
});
```

## select

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {number | string | `MNode`} config 需要选中的节点或节点ID

- **返回：**
  - {Promise<`MNode`>} 当前选中的节点配置

- **详情：**

  选中指点节点（将指点节点设置成当前选中状态）

  :::tip
  editorService.select只是设置了编辑器的选中状态，并没有设置画布的选中状态，所以根据实际情况可以调用[stage.select](../stage/coreMethods.md#select)来设置画布的选中态
  :::

- **示例：**

```js
import { editorService } from "@tmagic/editor";

editorService.select("text_123");
editorService.get("stage")?.select("text_123");
```

## multiSelect

- **参数：**
  - {(number | string)[]} ids 需要选中的节点ID集合

- **返回：**
  - `{Promise<void>}`

- **详情：**

  选中多个节点

  :::tip
  editorService.multiSelect只是设置了编辑器的选中状态，并没有设置画布的选中状态，所以根据实际情况可以调用[stage.multiSelect](../stage/coreMethods.md#multiSelect)来设置画布的选中态
  :::

- **示例：**

```js
import { editorService } from "@tmagic/editor";

editorService.multiSelect(["text_123", "button_123"]);
editorService.get("stage")?.multiSelect(["text_123", "button_123"]);
```

## selectNextNode

- **返回：**
  - {Promise<`MNode` | null>} 选中后的节点配置

- **详情：**

  选中当前节点同层级（同一父节点）的下一个节点，已经是最后一个时回到第一个

## selectNextPage

- **返回：**
  - {Promise<`MNode`>} 选中后的页面配置

- **详情：**

  选中下一页，已经是最后一页时回到第一页

## selectRoot

- **返回：**
  - `{void}`

- **详情：**

  选中根节点（root），同时清空当前选中的页面、父节点、画布及高亮节点

## highlight

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {number | string | `MNode`} config 需要高亮的节点或节点ID

- **返回：**
  - `{Promise<void>}`

- **详情：**

  高亮指定节点

- **示例：**

```js
import { editorService } from "@tmagic/editor";

editorService.highlight("text_123");
```

## doAdd

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode`} node 新组件节点

  - {`MContainer`} parent 指定的容器节点

- **返回：**
  - {Promise<`MNode`>} 新增的组件

- **详情：**

  往指定的容器中添加组件

## add

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode` | `MNode`[]} node 新组件节点配置或多个节点集合

  - {`MContainer`} parent 指定的容器组件节点配置，如果不设置，默认为当前选中的组件的父节点

  - `{Object}` options 可选配置
    - `{boolean}` doNotSelect 添加后是否不更新当前选中节点（默认 false，添加后会选中新增的节点）
    - `{boolean}` doNotSwitchPage 添加后是否不切换当前页面（默认 false；新增页面 / 跨页新增时为 true 会跳过会引发页面切换的选中操作）
    - `{boolean}` doNotPushHistory 是否不写入历史记录（默认 false）
    - `{string}` historyDescription 见[历史记录相关 options](#历史记录相关-options)
    - `{HistoryOpSource}` historySource 见[历史记录相关 options](#历史记录相关-options)

- **返回：**
  - {Promise<`MNode` | `MNode`[]>} 新增的组件或组件集合

- **详情：**

  往指定的容器或当前容器中添加组件

  :::tip
  **与[doAdd](#doadd)的区别：**

  add可以支持一次添加多个组件，add是通过调用[doAdd](#doadd)来最终实现添加的。

  编辑器内部添加组件都是调用add来实现的，add除了添加操作外，还会记录历史堆栈，还会更新编辑中相关的状态，而[doAdd](#doadd)就仅仅是完成添加的行为
  :::

## doRemove

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是
- **参数：**
  - {`MNode`} node 要删除的节点
  - `{Object}` options 可选配置
    - `{boolean}` doNotSelect 删除后是否不更新当前选中节点（默认 false）
    - `{boolean}` doNotSwitchPage 删除后是否不切换当前页面（默认 false；删除页面 / 页面片段时为 true 会跳过自动切换到首个剩余页面）

- **返回：**
  - `{Promise<void>}`

- **详情：**

  删除指定的组件或者页面

  :::tip
  无论是否传入 `doNotSelect` / `doNotSwitchPage`，当被删除节点在当前选中列表中时，state 都会自动移除该节点的引用；当被删除的正好是当前页面时，state.page 也会同步清空，避免持有已删除节点
  :::

## remove

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode` | `MNode`[])} node 要删除的节点或节点集合
  - `{Object}` options 可选配置
    - `{boolean}` doNotSelect 删除后是否不更新当前选中节点（默认 false，删除后会选中父节点或首个页面）
    - `{boolean}` doNotSwitchPage 删除后是否不切换当前页面（默认 false；删除页面 / 页面片段时为 true 会跳过自动切换到首个剩余页面）
    - `{boolean}` doNotPushHistory 是否不写入历史记录（默认 false）
    - `{string}` historyDescription 见[历史记录相关 options](#历史记录相关-options)
    - `{HistoryOpSource}` historySource 见[历史记录相关 options](#历史记录相关-options)

- **返回：**
  - `{Promise<void>}`

- **详情：**

  删除指定的组件或者页面或组件集合

  :::tip
  **与[doRemove](#doRemove)的区别：**

  remove可以支持一次删除多个组件，remove是通过调用[doRemove](#doRemove)来最终实现删除的。

  编辑器内部删除组件都是调用remove来实现的，remove除了删除操作外，还会记录历史堆。
  :::

## doUpdate

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode`} config 新的节点
  - `{Object}` data 可选配置
    - {`ChangeRecord`[]} changeRecords 变更记录

- **返回：**
  - `{Promise<{ newNode: MNode; oldNode: MNode; changeRecords?: ChangeRecord[] }>}` 更新前后的节点信息

  ::: details 查看 ChangeRecord 类型定义
  <<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}
  :::

- **详情：**

  更新节点

  :::tip
  节点中应该要有id，不然不知道要更新哪个节点

  当被更新节点正好在当前选中列表中时，state 会自动同步到新的节点引用，无需调用方处理

  当被更新节点正好是当前页面时，state.page 也会同步到新的节点引用；更新非当前页面（不同 ID）时不会把编辑器切到该页
  :::

## update

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode` | `MNode`[]} config 新的节点或节点集合
  - `{Object}` data 可选配置
    - {`ChangeRecord`[]} changeRecords 单节点 form 端变更记录（多节点场景下被忽略，使用 `changeRecordList`）
    - {`ChangeRecord`[][]} changeRecordList 多节点 form 端变更记录列表，按 `config` 数组同序对应每个节点；优先级高于 `changeRecords`
    - `{boolean}` doNotPushHistory 是否不写入历史记录（默认 false）
    - `{string}` historyDescription 见[历史记录相关 options](#历史记录相关-options)
    - `{HistoryOpSource}` historySource 见[历史记录相关 options](#历史记录相关-options)

  ::: details 查看 ChangeRecord 类型定义
  <<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}
  :::

- **返回：**
  - {Promise<`MNode` | `MNode`[]>} 新的节点或节点集合

- **详情：**

  更新单个或多个节点

  :::tip
  **与[doUpdate](#doupdate)的区别：**

  update可以支持一次更新多个组件，update是通过调用[doUpdate](#doupdate)来最终实现更新的。

  编辑器内部更新组件都是调用update来实现的，update除了更新操作外，还会记录历史堆，还会更新[代码块](../../guide/advanced/code-block.md)关系链。
  :::

  :::tip
  **多节点场景必须使用 `changeRecordList`**：每个节点应保留自己独立的 records，不能把多个节点的
  records 合并到同一个 `changeRecords` 数组里，否则 `doUpdate` / 依赖收集 / 历史回放都会按错误的
  `propPath` 处理。

  写入历史时，每个节点的 records 会单独保存到 `updatedItems[i].changeRecords`；撤销/重做时若有
  records，则仅按 `propPath` 局部更新对应字段，避免整节点替换冲掉同节点上的其它无关变更；缺省
  才退化为整节点替换（如内部 `sort` / `moveLayer` / 拖动等纯快照场景）。
  :::

## sort

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{ string | number }` id1
  - `{ string | number }` id2
  - `{Object}` options 可选配置
    - `{boolean}` doNotSelect 排序后是否不更新当前选中节点（默认 false）
    - `{boolean}` doNotSwitchPage 排序后是否不切换当前页面（排序只发生在同一父节点内，方法内为空操作；保留以与其它 DSL 操作 API 一致）
    - `{boolean}` doNotPushHistory 是否不写入历史记录（默认 false）
    - `{HistoryOpSource}` historySource 见[历史记录相关 options](#历史记录相关-options)

- **返回：**
  - `{Promise<void>}`

- **详情：**

  将id为id1的组件移动到id为id2的组件位置上，例如：[1,2,3,4] -> sort(1,3) -> [2,1,3,4]

  用于流式布局下的组件拖动更新

## copy

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode` | `MNode`[]} config 需要复制的节点或节点集合

- **返回：**
  - `{void}`

- **详情：**

复制组件节点或节点集合

通过[storageService.setItem](./storageServiceMethods.md#setitem),将组件节点配置存储到localStorage中

## copyWithRelated

- **参数：**
  - {`MNode` | `MNode`[]} config 需要复制的节点或节点集合
  - `{TargetOptions}` collectorOptions 可选的依赖收集器配置

- **返回：**
  - `{void}`

- **详情：**

  复制节点时会同时收集组件关联的依赖（如 dataSource、codeBlock 等），并一起存储到 localStorage 中，便于粘贴时一起带入

## doPaste

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- ## **参数：**

- **返回：**
  - `{Promise<void>}`

- **详情：**

粘贴前置操作：返回分配了新id以及校准了坐标的配置

## paste

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`PastePosition`} position 粘贴的坐标

  ::: details 查看 PastePosition 类型定义
  <<< @/../packages/editor/src/type.ts#PastePosition{ts}
  :::

  - `{TargetOptions}` collectorOptions 可选的依赖收集器配置
  - `{Object}` options 可选配置
    - `{boolean}` doNotSelect 粘贴后是否不更新当前选中节点（默认 false）
    - `{boolean}` doNotSwitchPage 粘贴后是否不切换当前页面（默认 false；跨页粘贴时为 true 会跳过页面切换）
    - `{boolean}` doNotPushHistory 是否不写入历史记录（默认 false）
    - `{string}` historyDescription 见[历史记录相关 options](#历史记录相关-options)
    - `{HistoryOpSource}` historySource 见[历史记录相关 options](#历史记录相关-options)

- **返回：**
  - {Promise<`MNode` | `MNode`[]>} 添加后的组件节点配置

- **详情：**

粘贴组件节点或节点集合

通过[storageService.getItem](./storageServiceMethods.md#getItem),从localStorage中获取节点，然后添加到当前容器中

## doAlignCenter

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode`} config 需要居中的组件

- **返回：**
  - {Promise<`MNode`>}

- **详情：**

  水平居中组件节点，仅在[流式布局](../../guide/advanced/layout.md)下有效

  :::warning
  仅是计算出left，并未更新到编辑器中
  :::

## alignCenter

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode` | `MNode`[]} config 需要居中的组件或者组件集合
  - `{Object}` options 可选配置
    - `{boolean}` doNotSelect 居中后是否不更新当前选中节点（默认 false）
    - `{boolean}` doNotSwitchPage 居中后是否不切换当前页面（居中只更新节点 style，方法内为空操作；保留以与其它 DSL 操作 API 一致）
    - `{boolean}` doNotPushHistory 是否不写入历史记录（默认 false）
    - `{string}` historyDescription 见[历史记录相关 options](#历史记录相关-options)
    - `{HistoryOpSource}` historySource 见[历史记录相关 options](#历史记录相关-options)

- **返回：**
  - {Promise<`MNode` | `MNode`[]>}

- **详情：**

水平居中组件或者组件集合，仅在[流式布局](../../guide/advanced/layout.md)下有效

:::tip
**与[doAlignCenter](#doaligncentere)的区别：**

alignCenter可以支持一次水平居中多个组件，alignCenter是通过调用[doAlignCenter](#doaligncentere)来获取到已设置好水平居中的位置信息的节点，然后调用update更新。
:::

## moveLayer

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{number | 'top' | 'bottom'}` offset
  - `{Object}` options 可选配置
    - `{boolean}` doNotPushHistory 是否不写入历史记录（默认 false）
    - `{string}` historyDescription 见[历史记录相关 options](#历史记录相关-options)
    - `{HistoryOpSource}` historySource 见[历史记录相关 options](#历史记录相关-options)

- **返回：**
  - `{Promise<void>}`

- **详情：**

  移动当前选中节点位置

  用于实现上移一层、下移一层、置顶、置底

## moveToContainer

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode`} config 需要移动的节点
  - `{string | number}` targetId 容器ID
  - `{Object}` options 可选配置
    - `{boolean}` doNotSelect 移动后是否不更新当前选中节点（默认 false）
    - `{boolean}` doNotSwitchPage 移动后是否不切换当前页面（默认 false；目标容器位于其它页面时为 true 会跳过自动选中以避免页面切换）
    - `{boolean}` doNotPushHistory 是否不写入历史记录（默认 false）
    - `{string}` historyDescription 见[历史记录相关 options](#历史记录相关-options)
    - `{HistoryOpSource}` historySource 见[历史记录相关 options](#历史记录相关-options)

- **返回：**
  - Promise<`MNode` | undefined>

- **详情：**

  移动到指定容器中

## dragTo

- **参数：**
  - {`MNode` | `MNode`[]} config 需要拖拽的节点或节点集合
  - {`MContainer`} targetParent 目标父容器
  - `{number}` targetIndex 目标位置索引
  - `{Object}` options 可选配置
    - `{boolean}` doNotPushHistory 是否不写入历史记录（默认 false）
    - `{string}` historyDescription 见[历史记录相关 options](#历史记录相关-options)
    - `{HistoryOpSource}` historySource 见[历史记录相关 options](#历史记录相关-options)

- **返回：**
  - `{Promise<void>}`

- **详情：**

  将节点（支持多选）拖拽到目标容器的指定位置，会自动处理跨容器布局切换并记录历史

## addAndGetHistoryId

- **参数：** 同 [add](#add)

- **返回：**
  - {Promise<`string` | null>} 本次写入历史记录的 [uuid](#历史记录-uuid-与-andgethistoryid)；未写入历史时返回 `null`

- **详情：**

  与 [add](#add) 行为完全一致，仅把返回值换成本次写入历史记录的 `uuid`，见[历史记录 uuid 与 \*AndGetHistoryId](#历史记录-uuid-与-andgethistoryid)

- **示例：**

```js
import { editorService } from "@tmagic/editor";

const historyId = await editorService.addAndGetHistoryId(
  { type: "text", text: "hello" },
  parent,
  { historySource: "api" },
);
console.log(historyId); // 本次新增对应的历史记录 uuid，或 null
```

## removeAndGetHistoryId

- **参数：** 同 [remove](#remove)

- **返回：**
  - {Promise<`string` | null>} 本次写入历史记录的 [uuid](#历史记录-uuid-与-andgethistoryid)；未写入历史时返回 `null`

- **详情：**

  与 [remove](#remove) 行为完全一致，仅把返回值换成本次写入历史记录的 `uuid`

## updateAndGetHistoryId

- **参数：** 同 [update](#update)

- **返回：**
  - {Promise<`string` | null>} 本次写入历史记录的 [uuid](#历史记录-uuid-与-andgethistoryid)；未写入历史时返回 `null`

- **详情：**

  与 [update](#update) 行为完全一致，仅把返回值换成本次写入历史记录的 `uuid`

## moveLayerAndGetHistoryId

- **参数：** 同 [moveLayer](#movelayer)

- **返回：**
  - {Promise<`string` | null>} 本次写入历史记录的 [uuid](#历史记录-uuid-与-andgethistoryid)；未写入历史时返回 `null`

- **详情：**

  与 [moveLayer](#movelayer) 行为完全一致，仅把返回值换成本次写入历史记录的 `uuid`

## moveToContainerAndGetHistoryId

- **参数：** 同 [moveToContainer](#movetocontainer)

- **返回：**
  - {Promise<`string` | null>} 本次写入历史记录的 [uuid](#历史记录-uuid-与-andgethistoryid)；未写入历史时返回 `null`

- **详情：**

  与 [moveToContainer](#movetocontainer) 行为完全一致，仅把返回值换成本次写入历史记录的 `uuid`

## dragToAndGetHistoryId

- **参数：** 同 [dragTo](#dragto)

- **返回：**
  - {Promise<`string` | null>} 本次写入历史记录的 [uuid](#历史记录-uuid-与-andgethistoryid)；未写入历史时返回 `null`

- **详情：**

  与 [dragTo](#dragto) 行为完全一致，仅把返回值换成本次写入历史记录的 `uuid`

## revertPageStepById

- **参数：**
  - `{string}` uuid 目标历史记录的 [uuid](#历史记录-uuid-与-andgethistoryid)（通常由 `*AndGetHistoryId` 方法返回）

- **返回：**
  - {Promise<`StepValue` | null>} 反向应用后产生的新 step；找不到对应 uuid / 该步未应用 / 反向失败时返回 `null`

- **详情：**

  通过历史记录 uuid「回滚」当前页面的某条历史步骤（类 git revert 语义）：不移动游标、不丢弃任何步骤，而是把目标 step 的修改**反向应用为一条全新的步骤**压入栈顶。语义与按 index 回滚一致，仅入参从 index 改为 uuid，更适合业务侧持有引用后再回滚。

  ::: tip
  `opType: 'update'` 的步骤必须携带 `changeRecords` 才支持回滚（否则只能整节点替换，会冲掉后续无关变更）；未应用（已被撤销）的步骤无法回滚。
  :::

- **示例：**

```js
import { editorService } from "@tmagic/editor";

// 执行操作时拿到本次历史记录 uuid
const historyId = await editorService.addAndGetHistoryId({ type: "text", text: "hello" });

// 之后任意时机按 uuid 回滚该步骤
if (historyId) {
  await editorService.revertPageStepById(historyId);
}
```

## undo

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **返回：**
  - {Promise<`StepValue` | null>}

  ::: details 查看 StepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#StepValue{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpType{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}
  :::

- **详情：**

  撤销当前操作

## redo

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **返回：**
  - {Promise<`StepValue` | null>}

  ::: details 查看 StepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#StepValue{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpType{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpSource{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}
  :::

- **详情：**

  恢复到下一步

## move

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{number}` left
  - `{number}` top
  - `{Object}` options 可选配置
    - `{boolean}` doNotPushHistory 是否不写入历史记录（默认 false）
    - `{string}` historyDescription 见[历史记录相关 options](#历史记录相关-options)
    - `{HistoryOpSource}` historySource 见[历史记录相关 options](#历史记录相关-options)

- **返回：**
  - `{Promise<void>}`

- **详情：**

  更新当前选中组件位置，通常用于键盘上下左右快捷键操作

## resetModifiedNodeId

- **详情：**

重置当前记录的修改过的节点id记录，通常用于保存之后

## resetState

- **详情：**

清空state

## destroy

- **详情：**

  销毁editorService

  移除所有事件监听，清空state，移除所有插件

## usePlugin

- **详情：**

  usePlugin支持灵活细致的扩展， 上述方法中标记有`扩展支持： 是`的方法都支持使用usePlugin扩展

每个支持扩展的方法都支持定制before、after两个hook来干预原有方法的行为，before可以用于修改传入参数，after可以用于修改返回的值

- **示例：**

```js
import { editorService } from "@tmagic/editor";

editorService.usePlugin({
  // 添加组件的时候设置一个添加时间
  beforeDoAdd: (config, parent) => {
    config.addTime = new Date().getTime();

    return [config, parent];
  },
});
```

## removeAllPlugins

- **详情：**

删掉当前设置的所有扩展


# editorService方法

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

- **返回：**
  - `{Promise<void>}`

- **详情：**

  删除指定的组件或者页面

## remove

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode` | `MNode`[])} node 要删除的节点或节点集合
  - `{Object}` options 可选配置
    - `{boolean}` doNotSelect 删除后是否不更新当前选中节点（默认 false，删除后会选中父节点或首个页面）

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
  :::

## update

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode` | `MNode`[]} config 新的节点或节点集合
  - `{Object}` data 可选配置
    - {`ChangeRecord`[]} changeRecords 变更记录

- **返回：**
  - {Promise<`MNode` | `MNode`[]>} 新的节点或节点集合

- **详情：**

  更新单个或多个节点

  :::tip
  **与[doUpdate](#doupdate)的区别：**

  update可以支持一次更新多个组件，update是通过调用[doUpdate](#doupdate)来最终实现更新的。

  编辑器内部更新组件都是调用update来实现的，update除了更新操作外，还会记录历史堆，还会更新[代码块](../../guide/advanced/code-block.md)关系链。
  :::

## sort

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{ string | number }` id1
  - `{ string | number }` id2
  - `{Object}` options 可选配置
    - `{boolean}` doNotSelect 排序后是否不更新当前选中节点（默认 false）

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

- **返回：**
  - Promise<`MNode` | undefined>

- **详情：**

  移动到指定容器中

## dragTo

- **参数：**
  - {`MNode` | `MNode`[]} config 需要拖拽的节点或节点集合
  - {`MContainer`} targetParent 目标父容器
  - `{number}` targetIndex 目标位置索引

- **返回：**
  - `{Promise<void>}`

- **详情：**

  将节点（支持多选）拖拽到目标容器的指定位置，会自动处理跨容器布局切换并记录历史

## undo

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **返回：**
  - {Promise<`StepValue` | null>}

  ::: details 查看 StepValue 及关联类型定义
  <<< @/../packages/editor/src/type.ts#StepValue{ts}

  <<< @/../packages/editor/src/type.ts#HistoryOpType{ts}

  <<< @/../packages/schema/src/index.ts#Id{ts}
  :::

- **详情：**

  撤销当前操作

## redo

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **返回：**
  - {Promise<`StepValue` | null>}

- **详情：**

  恢复到下一步

## move

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{number}` left
  - `{number}` top

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

## use

使用中间件的方式扩展方法，上述方法中标记有`扩展支持： 是`的方法都支持使用use扩展

- **示例：**

```js
import { editorService, getAddParent } from "@tmagic/editor";
import { ElMessageBox } from "element-plus";

editorService.use({
  // 添加是否删除节点确认提示
  async remove(node, next) {
    await ElMessageBox.confirm("是否删除", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    next();
  },

  add(node, next) {
    // text组件只能添加到container中
    const parentNode = getAddParent(node);
    if (node.type === "text" && parentNode?.type !== "container") {
      return;
    }

    next();
  },
});
```

## usePlugin

- **详情：**

相对于[use](#use), usePlugin支持更加灵活更加细致的扩展， 上述方法中标记有`扩展支持： 是`的方法都支持使用usePlugin扩展

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


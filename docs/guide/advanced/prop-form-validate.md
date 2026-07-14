# 属性配置表单校验联动

编辑器在属性面板（属性表单 / 样式表单）中已支持 [表单校验](../../form-config/rules.md)。默认情况下，表单校验失败时本次改动会被丢弃，不会写入节点。

「属性配置表单校验联动」能力（`enablePropsFormValidate`）允许在**校验失败时仍按当前表单值更新节点**，并把错误信息集中记录到 `editorService`，从而实现：

- 组件树（图层）中对出错节点**标红并显示错误图标**，悬停可查看错误文案；
- 业务在**保存前拦截**存在校验错误的组件（见 [保存拦截](#保存拦截)）；
- 校验错误随 DSL 操作写入历史快照，**撤销 / 重做能正确还原**错误状态。

> 该能力默认关闭，需通过 `<m-editor :enable-props-form-validate="true">` 显式开启。

## 工作原理

### 错误来源维度

属性面板分「属性」与「样式」两个独立的 `FormPanel`，它们指向同一节点。为避免某个面板校验通过时误清另一个面板记录的错误，错误信息**以来源（`source`）为键分别保存**：

- `'props'`：属性表单校验错误
- `'style'`：样式表单校验错误

节点只要**任一来源存在非空错误文案**即视为出错。

内部类型定义见 `NodeInvalidInfo`：

```ts
interface NodeInvalidInfo {
  /** 属性表单校验错误文案（可能为包含 <br> 的 HTML） */
  props?: string;
  /** 样式表单校验错误文案（可能为包含 <br> 的 HTML） */
  style?: string;
}
```

### 数据流

1. 表单校验失败时（开启了 `enablePropsFormValidate`），`FormPanel` 仍以当前表单值提交，并把错误随提交事件一并抛出；
2. `PropsPanel` 在调用 `editorService.update()` 时，把 `invalidInfo: { id, source, error }` 一并传入；
3. `editorService` 在**写入历史记录之前**落库错误标记（`applyInvalidInfo`），使历史快照与本次变更对齐；
4. 错误被记录到 `invalidNodeIds` 状态，并触发 `invalid-node-change` 事件；
5. 组件树节点通过读取 `invalidNodeIds` 响应式地展示标红与错误图标。

校验成功时（或源码编辑器保存时）不携带 `invalidInfo`，保持已有错误状态不变（即不会清除错误）——只有对应来源的表单再次校验通过才会清除该来源的错误。

## 快速开始

```html
<template>
  <m-editor :enable-props-form-validate="true"></m-editor>
</template>
```

开启后无需其它配置，属性 / 样式表单校验失败即会自动记录错误并标红组件树节点。

## 读取与清除错误

业务侧可通过 `editorService` 读取或清除错误标记：

```js
import { editorService } from "@tmagic/editor";

// 读取全部错误节点（Map<Id, NodeInvalidInfo>）
const invalidNodeIds = editorService.getInvalidNodeIds();

// 读取单个节点的错误
const info = editorService.getInvalidNodeInfo("text_123");

// 手动记录 / 清除错误（一般无需手动调用，属性面板已自动维护）
editorService.setInvalidNode("text_123", "props", "标题不能为空");
editorService.deleteInvalidNode("text_123", "props"); // 仅清除属性表单错误
editorService.resetInvalidNodeId();                    // 清空全部错误
```

订阅错误状态变化（非响应式消费方，如自定义工具栏）：

```js
editorService.on("invalid-node-change", (invalidNodeIds) => {
  console.log("校验错误节点数:", invalidNodeIds.size);
});
```

> 响应式读取（如自定义组件树节点内容）请直接读取 `editorService.get('invalidNodeIds')`，其变化会触发 Vue 响应式更新。

## 保存拦截

开启校验联动后，业务可读取 `invalidNodeIds`，在存在校验错误时阻止保存并提示：

```js
import { editorService } from "@tmagic/editor";
import { tMagicMessage } from "@tmagic/design";

const checkInvalidNodes = (services) => {
  const invalidNodeIds = services?.editorService.getInvalidNodeIds?.();
  if (!invalidNodeIds || invalidNodeIds.size === 0) {
    return true;
  }

  const names = [...invalidNodeIds.keys()].map((id) => {
    const node = services?.editorService.getNodeById(id);
    return node?.name ? `${node.name}(${id})` : `${id}`;
  });

  tMagicMessage.error(`以下组件存在配置校验错误，请修复后再保存：${names.join("、")}`);
  return false;
};

// 在菜单保存按钮 / 预览保存的 handler 中：
if (!checkInvalidNodes(services)) return;
save();
```

playground 已内置该拦截逻辑，参见 `playground/src/pages/composables/use-editor-menu.ts`。

## 与历史记录的关系

错误标记会随 DSL 操作（`add` / `update` 等）一并写入历史快照。编辑器内部在「操作前」与「操作后」分别留存错误状态快照：

- **撤销（undo）**：还原到操作前的错误状态（撤销一个「校验失败」的改动后错误消失）；
- **重做（redo）**：还原到操作后的错误状态（重做后错误恢复）。

整体替换 `root`（如加载新 DSL）后会自动清理不存在于新 DSL 中的失效节点错误记录，避免残留误报；删除节点时也会同步清理其子树相关的错误记录。

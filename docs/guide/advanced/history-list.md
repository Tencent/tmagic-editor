# 历史记录面板

编辑器内置了一个可视化的「历史记录面板」，用于查看与回溯编辑过程中产生的所有操作。相比顶部菜单栏只能「撤销 / 重做」相邻一步，历史记录面板提供了对整条历史栈的全局视角：可以按页面、数据源、代码块分类浏览，点击任意一步直接跳转，查看每一步的前后差异，甚至像 `git revert` 一样单独回滚某一步而不破坏后续操作。

## 开启面板

历史记录面板以一个内置菜单项 `'history-list'` 的形式提供，将它加入 [`menu`](/api/editor/props.html#menu) 配置即可在顶部工具栏出现一个时钟图标，点击展开面板：

```html
<template>
  <m-editor :menu="menu"></m-editor>
</template>

<script setup>
import { ref } from 'vue';

const menu = ref({
  left: [],
  center: ['delete', 'undo', 'redo', '/', 'history-list'],
  right: [],
});
</script>
```

## 面板结构

面板分为三个 tab，分别对应三类可被历史记录追踪的对象，tab 标题后的数字为各自的分组数量：

| Tab | 内容 | 跳转 API |
| --- | --- | --- |
| 页面 | 当前活动页面的节点操作历史 | `editorService.gotoPageStep(cursor)` |
| 数据源 | 按 `dataSource.id` 分组的数据源变更历史 | `dataSourceService.goto(id, cursor)` |
| 代码块 | 按 `codeBlock.id` 分组的代码块变更历史 | `codeBlockService.goto(id, cursor)` |

### 相邻同目标自动合并

为了避免「连续微调同一个节点 / 数据源 / 代码块」时产生大量碎片化记录，面板会把**相邻的、针对同一目标的连续 `update`** 自动合并成一个分组：

- 页面 tab：连续修改同一节点（按节点 id 判定）的多步合并为一组，点击组头部可展开查看每一子步；
- 数据源 / 代码块 tab：相邻的连续 `update` 按目标 id 合并；`add` / `remove` 始终独立成组（语义上是一次性事件）。

> 合并仅作用于展示与交互，不改变底层 undo/redo 栈的真实结构。

## 交互能力

每个分组 / 步骤支持以下操作：

### 1. 点击跳转

点击任意一条记录，编辑器会跳转到「应用至该步完成」的状态。其本质是把对应栈的游标（cursor）移动到 `step.index + 1`，由 service 层的 undo/redo 链路完成中间步骤的批量正向 / 反向应用。

### 2. 回到初始状态

每个 tab 列表底部提供「回到初始状态」入口，等价于把对应栈游标移到 `0`（所有真实步骤全部撤销）。

### 3. 单步回滚（类 git revert）

对于历史中间的某一步，可以单独「回滚」它，而保留它之后的所有操作。该行为不会倒带游标，而是把目标步骤的修改**反向应用为一次全新的操作**并压入栈顶，因此不会破坏既有历史结构：

- 页面：`editorService.revertPageStep(index)`
- 数据源：`dataSourceService.revert(id, index)`
- 代码块：`codeBlockService.revert(id, index)`

### 4. 差异对比

在前后值都存在的 `update` 步骤上提供「查看差异」入口，点击后弹出差异对话框。对话框支持两个维度的切换：

- **对比对象**
  - `与修改前对比`：该步骤修改前 vs 修改后（默认，体现这一步带来的变化）；
  - `与当前对比`：该步骤修改后 vs 编辑器中的最新值（用于确认「这一步之后是否又被改动过」，当前值缺失时禁用）。
- **展示形态**
  - `表单对比`：以属性表单形式逐字段对比，可读性更好（基于 [表单对比](/form-config/compare.md) 能力）；
  - `源码对比`：以 JSON 源码做整体 diff（基于 monaco diff 编辑器），可以看到表单未覆盖到的字段。

::: tip
表单对比依赖 `@tmagic/form` 的对比模式（`isCompare` / `lastValues`）。对于 `event-select`、`code-select`、`code-select-col` 等由列表或嵌套子表单组成的复合字段，表单会逐项展示新增 / 删除 / 修改的高亮差异，并在对比模式下隐藏「添加 / 删除 / 编辑」等写操作按钮，仅保留只读展示。
:::

## 扩展自定义 tab

内置的三个 tab 之外，业务方可以通过 Editor 的 [`historyListExtraTabs`](/api/editor/props.html#historylistextratabs) 在面板中追加自定义的历史 tab，追加在「页面 / 数据源 / 代码块」之后。适用于某个自定义模块维护自己的操作历史，需要在历史记录面板中独立展示与回滚的场景。

```html
<template>
  <m-editor :menu="menu" :history-list-extra-tabs="historyListExtraTabs"></m-editor>
</template>

<script setup>
import { markRaw } from 'vue';

import MyModuleHistoryTab from './MyModuleHistoryTab.vue';

const historyListExtraTabs = [
  {
    name: 'my-module',
    // label 支持字符串或函数，函数形式便于展示动态数量
    label: () => `我的模块 (${getMyModuleHistory().length})`,
    component: markRaw(MyModuleHistoryTab),
    props: { foo: 'bar' },
    listeners: {
      goto: (cursor) => console.log(cursor),
    },
  },
];
</script>
```

每个扩展 tab 的字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | tab 唯一标识，作为内部 `TMagicTabs` 的 `name` |
| `label` | 是 | tab 显示文案，支持字符串或返回字符串的函数（便于展示动态数量） |
| `component` | 是 | tab 内容区渲染的组件 |
| `props` | 否 | 传入内容组件的 props |
| `listeners` | 否 | 内容组件的事件监听 |

> 内容组件内部可自行通过 `useServices()` 拿到 `historyService` 等服务，读取并回滚自定义模块自己维护的历史。

## 自定义对比判断

差异对话框中的「表单对比」最终透传到 `MForm`，你可以通过 Editor 顶层注入的 `extendFormState` 让对比表单拿到完整业务上下文，从而让依赖上下文的 `display` / `disabled` 等 `filterFunction` 正常工作。

若某些字段语义上相等但结构不同（例如 `code-select` 字段中 `''` 与 `{ hookType: 'code', hookData: [] }` 应视为相等），可借助 `@tmagic/form` 的 [`showDiff`](/api/form/form-props.html#showdiff) 自定义判断函数避免被误判为差异。

## 相关 API

历史面板的数据均来自 `historyService` 暴露的聚合方法，详见 [historyService 方法](/api/editor/historyServiceMethods.md)。

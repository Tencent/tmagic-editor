# Editor组件 props

## modelValue/v-model

- **详情：**
  
  页面初始值

- **默认值：** `{}`
  

- **类型：** `MApp[]`

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

- **示例：**
  
```html
<template>
  <m-editor v-model="dsl"></m-editor>
</template>

<script setup>
import { ref } from 'Vue';

const dsl = ref({
  type: 'app',
  id: 'app_1',
  items: [
    {
      type: 'page',
      id: 'page_1',
      items: [
        {
          type: 'text',
          id: 'text_1',
          text: '文本'
        },
      ],
    },
  ],
});
</script>
```

## componentGroupList

- **详情：**
  
  左侧面板中的组件列表

- **默认值：** `[]`

- **类型：** `ComponentGroup[]`

  ::: details 查看 ComponentGroup 及关联类型定义
  <<< @/../packages/editor/src/type.ts#ComponentGroup{ts}

  <<< @/../packages/editor/src/type.ts#ComponentItem{ts}
  :::

::: tip
icon使用的是[element-plus icon](https://element-plus.org/zh-CN/component/icon.html)

也可直接使用url，例如
```js
{
  icon: 'https://vfiles.gtimg.cn/vupload/20220614/9cc3091655207317835.png'
}
```
url支持相对路径或者绝对路径，例如
```js
{
  icon: './icon.png'
}
{
  icon: '/icon.png'
}
```
:::

:::warning
请注意如果只是文件名的话是不行的，会被认为是css class
:::

- **示例：**

```html
<template>
  <m-editor :component-group-list="componentGroupList"></m-editor>
</template>

<script setup>
import { ref, markRaw } from 'Vue';
import { FolderOpened, SwitchButton, Tickets } from '@element-plus/icons-vue';

const componentGroupList = ref([
  {
    title: '容器',
    items: [
      {
        icon: markRaw(FolderOpened),
        text: '组',
        type: 'container',
      },
    ],
  },
  {
    title: '基础组件',
    items: [
      {
        icon: markRaw(Tickets),
        text: '文本',
        type: 'text',
      },
      {
        icon: markRaw(SwitchButton),
        text: '按钮',
        type: 'button',
      },
    ],
  },
]);
</script>
```

::: warning
此配置仅在[sidebar](#sidebar)中配置了'component-list'时有效
:::

## datasourceList

- **详情：**
  
  左侧数据源面板中可新增的自定义数据源列表

- **默认值：**  `[]`

- **类型：** `DatasourceTypeOption[]`

  ::: details 查看 DatasourceTypeOption 类型定义
  <<< @/../packages/editor/src/type.ts#DatasourceTypeOption{ts}
  :::

- **示例：**

```html
<template>
  <m-editor :datasource-list="datasourceTypeList"></m-editor>
</template>

<script setup>
import { ref } from 'Vue';

const datasourceTypeList = ref([
  {
    type: 'http',
    text: 'Http数据源'
  }
])
</script>
```

:::tip
系统默认已提供了base,http两种基础数据源，此处配置的使用者新增的数据源
:::

## sidebar

- **详情：**
  
  左侧面板，目前只支持type: 'tabs';

- **默认值：** 

```js
{
  type: 'tabs',
  status: '组件',
  items: ['component-list', 'layer', 'code-block'],
}
```

- **类型：** `SideBarData`

  ::: details 查看 SideBarData 及关联类型定义
  <<< @/../packages/editor/src/type.ts#SideBarData{ts}

  <<< @/../packages/editor/src/type.ts#SideItem{ts}

  <<< @/../packages/editor/src/type.ts#SideItemKey{ts}

  <<< @/../packages/editor/src/type.ts#SideComponent{ts}

  <<< @/../packages/editor/src/type.ts#MenuComponent{ts}

  <<< @/../packages/editor/src/type.ts#Services{ts}
  :::

- **示例：**
  
```html
<template>
  <m-editor :sidebar="sidebar"></m-editor>
</template>

<script setup>
import { ref, markRaw } from 'Vue';
import { List } from '@element-plus/icons-vue';
import ModListPanel from '../components/sidebars/ModListPanel.vue';

const sidebar = ref({
  type: 'tabs',
  status: '组件',
  items: [
    'component-list',
    'layer',
    {
      type: 'component',
      icon: markRaw(List),
      component: markRaw(ModListPanel),
      text: '模块',
    },
  ],
});
</script>

```

::: tip
icon使用的是[element-plus icon](https://element-plus.org/zh-CN/component/icon.html)

也可直接使用url，例如
```js
{
  icon: 'https://vfiles.gtimg.cn/vupload/20220614/9cc3091655207317835.png'
}
```
:::

## menu

- **详情：**
  
  顶部工具栏

  系统提供了几个常用功能： `'/' | 'delete' | 'undo' | 'redo' | 'zoom-in' | 'zoom-out' | 'zoom' | 'guides' | 'rule' | 'scale-to-original' | 'scale-to-fit' | 'history-list'`

  '/': 分隔符

  'delete': 删除按钮

  'undo': 撤销按钮

  'redo': 恢复按钮

  'zoom-in': 放大按钮
  
  'zoom-out': 缩小按钮

  'zoom': 缩放(zoom-in', 'zoom-out', 'scale-to-original', 'scale-to-fit' 的集合)

  'guides': 显示隐藏参考线
  
  'rule': 显示隐藏标尺

  'scale-to-original': 缩放到实际大小

  'scale-to-fit': 缩放以适应

  'history-list': 历史记录面板（按 页面 / 数据源 / 代码块 三个 tab 展示操作历史，相邻同目标修改自动合并，支持点击跳转、回到初始状态、单步回滚及差异对比，详见[历史记录面板](/guide/advanced/history-list.md)）

- **默认值：**
  
```js
{ left: [], center: [], right: [] }
```

- **类型：** `MenuBarData`

  ::: details 查看 MenuBarData 及关联类型定义
  <<< @/../packages/editor/src/type.ts#MenuBarData{ts}

  <<< @/../packages/editor/src/type.ts#ColumnLayout{ts}

  <<< @/../packages/editor/src/type.ts#MenuItem{ts}

  <<< @/../packages/editor/src/type.ts#MenuButton{ts}

  <<< @/../packages/editor/src/type.ts#MenuComponent{ts}

  <<< @/../packages/editor/src/type.ts#Services{ts}
  :::

- **示例：**
  
```html
<template>
  <m-editor :menu="menu"></m-editor>
</template>

<script setup>
import { ref, markRaw, toRaw } from 'Vue';
import { ArrowLeft, Coin } from '@element-plus/icons-vue';

const menu = ref({
  left: [
    {
      type: 'button',
      icon: markRaw(ArrowLeft),
      tooltip: '返回',
    },
    '/',
    {
      type: 'text',
      text: '.temp',
    },
  ],
  center: ['delete', 'undo', 'redo', 'zoom'],
  right: [
    {
      type: 'button',
      text: '保存',
      icon: markRaw(Coin),
      disabled: true,
      handler: ({ editorService }) => {
        console.log(toRaw(editorService.get('root'));
      }),
    },
  ],
})
</script>
```

## layerContentMenu

- **详情：** 扩展已选组件（组件树）右键菜单

- **默认值：** `[]`

- **类型：** `(MenuButton | MenuComponent)[]`

  ::: details 查看 MenuButton / MenuComponent 及关联类型定义
  <<< @/../packages/editor/src/type.ts#MenuButton{ts}

  <<< @/../packages/editor/src/type.ts#MenuComponent{ts}

  <<< @/../packages/editor/src/type.ts#Services{ts}
  :::

- **示例：**

```html
<template>
  <m-editor :layer-content-menu="layerContentMenu"></m-editor>
</template>

<script setup>
import { ref, toRaw } from 'Vue';
import { Upload } from '@element-plus/icons-vue';

const layerContentMenu = ref([
  {
    {
      type: 'button',
      icon: toRow(Upload),
      text: '导出',
      handler: () => {
        console.log('export')
      },
    },
  },
]);
</script>
```

## stageContentMenu

- **详情：** 扩展stage（画布区域）右键菜单

- **默认值：** `[]`

- **类型：** `(MenuButton | MenuComponent)[]`

  > 已在上面 [layerContentMenu](#layercontentmenu) 段落展开过相同类型，参考即可。

- **示例：**

```html
<template>
  <m-editor :stage-content-menu="stageContentMenu"></m-editor>
</template>

<script setup>
import { ref, toRaw } from 'Vue';
import { Upload } from '@element-plus/icons-vue';

const stageContentMenu = ref([
  {
    {
      type: 'button',
      icon: toRow(Upload),
      text: '导出',
      handler: () => {
        console.log('export')
      },
    },
  },
]);
</script>
```

## runtimeUrl

- **详情：**

  [runtime](../../guide/runtime.md)的HTML地址

  在编辑器画布中渲染组件是使用iframe实现，runtimeUrl就是配置在iframe上的src属性

- **默认值：** `undefined`

- **类型：** `string`

- **示例：**

```html
<template>
  <m-editor
    runtime-url="https://tencent.github.io/tmagic-editor/playground/runtime/vue/playground/index.html"
  ></m-editor>
</template>
```

## render

- **详情：**
  
  中间工作区域中画布渲染的内容，通常是通过解析[modelValue](#modelValue)来渲染出DOM，return的DOM结构需要有一个根节点。

  :::tip
  [runtimeUrl](#runtimeurl)与render有且只需要配置一个
  :::
  
- **默认值：** `undefined`

- **类型：** (stage: [StageCore](../stage/coreMethods.md)) => `HTMLDivElement` | Promise<`HTMLDivElement`>
  

- **示例：**

```html
<template>
  <m-editor
    :render="renderFunction"
  ></m-editor>
</template>

<script setup>
const renderFunction = async (stage) => {
  const { iframe } = stage.renderer;

  if (!iframe) throw new Error('iframe 未创建');

  return iframe.contentDocument.createElement('div');
}
</script>
```

## renderType

- **详情：**
  
  是用iframe渲染还是直接渲染

- **默认值：** `iframe`

- **类型：** `string`
  
  'iframe' | 'native'

- **示例：**

```html
<template>
  <m-editor render-type="native"></m-editor>
</template>
```

## autoScrollIntoView

- **详情：**
  
  选中组件时，是否自动滚动该组件到可视区域
  
- **默认值：** `undefined`

- **类型：** `boolean`

- **示例：**

```html
<template>
  <m-editor :auto-scroll-intoView="true"></m-editor>
</template>
```

## propsConfigs

- **详情：**
  
  组件的属性配置[表单的dsl](../../form-config/fields/text.md)

  :::tip
  该属性最终会设置到[propsService](./propsServiceMethods.md)中，所以也可直接调用[propsService.setPropsConfigs()](./propsServiceMethods.md#setPropsConfigs)方法来配置
  :::

  当选中一个组件时，会根据组件的type值从propsConfigs中获取对应的[表单的dsl](../../form-config/fields/text.md)，并在属性面板中渲染出来

  :::tip
  获取[表单的dsl](../../form-config/fields/text.md)后实际上还会经过[propsService.fillConfig()](./propsServiceMethods.md#fillConfig)方法来处理，用于添加公共配置
  :::
  
- **默认值：** `{}`
- 
- **类型：** `Record<string, FormConfig>`

  ::: details 查看 FormConfig 及关联类型定义
  <<< @/../packages/form-schema/src/base.ts#FormConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#FormItemConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#ChildConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#DynamicTypeConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#FormItem{ts}
  :::

- **示例：**
  
```html
<template>
  <m-editor :props-configs="propsConfigs"></m-editor>
</template>

<script setup>
const propsConfigs = {
  text: [
    {
      name: 'text',
      text: '文本',
    },
    {
      name: 'multiple',
      text: '多行文本',
      type: 'switch',
    },
  ],
  button: [
    {
      name: 'text',
      text: '文本',
    },
  ]
}
</script>
```

## propsValues

- **详情：**
  
  添加组件时的默认值

  添加组件时，组件节点DSL的生成过程为，先从[componentGroupList](#componentgrouplist)中items中item的data得到一个基础配置，然后再通过[propsService.getPropsValue()](./propsServiceMethods.md#getPropsValue)方法，获取到propsValues中对应type的默认值，二者合并生成新增节点的DSL配置

  :::tip
  该属性最终会设置到[propsService](./propsServiceMethods.md)中，所以也可直接调用[propsService.setPropsValues()](./propsServiceMethods.md#setPropsValues)方法来配置
  :::
  
- **默认值：** `{}`

- **类型：** `Record<string, Object>`
  
- **示例：**

```html
<template>
  <m-editor :props-values="propsValues"></m-editor>
</template>

<script setup>
const propsValues = {
  text: {
    text: '文本',
    // 多行文本
    multiple: true,
  },
  button: {
    text: '按钮',
  },
};
</script>
```

## eventMethodList

- **详情：**
  
  组件属性配置中事件tab中的事件名与动作的下拉选项列表

  :::tip
  该属性最终会设置到[eventsService](./eventsServiceMethods.md)中，所以也可直接调用[eventsService.setEvents()](./eventsServiceMethods.md#setEvents)与[eventsService.setMethods()](./eventsServiceMethods.md#setMethods)方法来配置
  :::

- **默认值：** `{}`

- **类型：** `Record<string, { events: EventOption[]; methods: EventOption[] }>`

  ::: details 查看 EventOption 类型定义
  <<< @/../packages/core/src/utils.ts#EventOption{ts}
  :::
  
- **示例：**

```html
<template>
  <m-editor :event-method-list="eventMethodList"></m-editor>
</template>

<script setup>
const eventMethodList = {
  page: {
    methods: [
      {
        label: '刷新',
        value: 'refresh',
      },
    ],
    events: [
      {
        label: '加载',
        value: 'load',
      },
    ],
  },
};
</script>
```

## datasourceValues

- **详情：**
  
  与 `propsValues` 类似，新增数据源时的默认值

  :::tip
  该属性最终会设置到[dataSourceService](./dataSourceServiceMethods.md)中，所以也可直接调用[dataSourceService.setFormValue()](./dataSourceServiceMethods.md#setFormValue)方法来配置
  :::

- **默认值：** `{}`

- **类型：** `Record<string, Partial<DataSourceSchema>>`

  ::: details 查看 DataSourceSchema 及关联类型定义
  <<< @/../packages/schema/src/index.ts#DataSourceSchema{ts}

  <<< @/../packages/schema/src/index.ts#DataSchema{ts}

  <<< @/../packages/schema/src/index.ts#MockSchema{ts}

  <<< @/../packages/schema/src/index.ts#CodeBlockContent{ts}

  <<< @/../packages/schema/src/index.ts#CodeParam{ts}

  <<< @/../packages/schema/src/index.ts#EventConfig{ts}

  <<< @/../packages/schema/src/index.ts#JsEngine{ts}
  :::
  
- **示例：**

```html
<template>
  <m-editor :datasource-values="datasourceValues"></m-editor>
</template>

<script setup>
const datasourceValues = {
  'user-info': {
    type: 'user-info',
    title: '用户信息',
    description: '用户信息',
    fields: [
      {
        type: 'string',
        name: 'nick',
        title: '昵称',
        defaultValue: '请登录',
        enable: true,
      },
    ]
  },
};
</script>
```

## datasourceConfigs

- **详情：**
  
  与 `propsConfigs` 类似，数据源的属性配置[表单的dsl](../../form-config/fields/text.md)

  :::tip
  该属性最终会设置到[dataSourceService](./dataSourceServiceMethods.md)中，所以也可直接调用[dataSourceService.setFormConfig()](./dataSourceServiceMethods.md#setFormConfig)方法来配置
  :::

- **默认值：** `{}`

- **类型：** `Record<string, FormConfig>`

  > 已在上面 [propsConfigs](#propsconfigs) 段落展开过 `FormConfig` 类型定义，参考即可。
  
- **示例：**

```html
<template>
  <m-editor  :datasource-configs="datasourceConfigs"></m-editor>
</template>

<script setup>
const datasourceConfigs = {
  'user-info': [
    {
      type: 'select',
      name: 'type',
      text: '类型'，
      options: [
        { text: 'qq', value: 'qq'}
      ]
    }
  ],
};
</script>
```

## datasourceEventMethodList

- **详情：**
  
  组件属性配置中事件tab中的事件名与动作的下拉选项列表

- **默认值：** `{}`

## moveableOptions

- **详情：**
  
  画布中的选中框配置选项，使用的是[moveable](https://github.com/daybrush/moveable)第三方库，可以用来控制组件在画布中是否能被拖动等行为

- **默认值：** `{}`

- **类型：** `((config: CustomizeMoveableOptionsCallbackConfig) => MoveableOptions) | `[`MoveableOptions`](https://daybrush.com/moveable/release/latest/doc/)

  ::: details 查看 CustomizeMoveableOptionsCallbackConfig 类型定义
  <<< @/../packages/stage/src/types.ts#CustomizeMoveableOptionsCallbackConfig{ts}
  :::

- **示例：**

```html
<template>
  <m-editor :moveable-options="moveableOptions"></m-editor>
</template>

<script setup>
const moveableOptions = ({ targetId }) => {
  const options = {};
  const node = editorService.getNodeById(id);

  if (!node) return options;

  const isPage = node.type === 'page';

  // 页面不允许拖动
  options.draggable = !isPage;
  options.resizable = !isPage

  return options;
};
</script>
```

## defaultSelected

- **详情：**
  
  编辑器初始化后默认选中的组件节点id

- **默认值：** `undefined`

- **类型：** `string | number`

- **示例：**

```html
<template>
  <m-editor :default-selected="defaultSelected"></m-editor>
</template>

<script setup>
import { ref } from 'vue';

const defaultSelected = ref('');

// 加载dsl后设置默认选中节点
getDsl().then(() => {
  defaultSelected.value = 'xxx';
});
</script>
```

## canSelect

- **详情：**
  
  鼠标在画布点击时，当前坐标下的dom节点是否可以选中，当前坐标下的dom可能不止只有一个，当有多个时会遍历这些节点并调用canSelect方法进行判断，第一个返回true的dom节点将被选中

  :::tip
  获取坐标下的节点是通过[document.elementsFromPoint](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/elementsFromPoint)方法
  :::

- **默认值：** `(el: HTMLElement) => Boolean(el.id)`

- **类型：** `(el: HTMLElement) => boolean | Promise<boolean>`

- **示例：**

```html
<template>
  <m-editor :can-select="canSelect"></m-editor>
</template>

<script setup>
// 只有dom id为纯数字时才可以被选中
const canSelect = (el) => /^\d+$/.test(el.id);
</script>
```

## isContainer

- **详情：**
  
  当组件拖动过程中停留在画布上超过 [containerHighlightDuration](#containerHighlightDuration) 时长时，识别当前是否有容器

  当停留超过[containerHighlightDuration](#containerHighlightDuration) 时长时，会通过停留的坐标获取当前坐标下所有dom节点，然后遍历这些节点并通过isContainer方法判断，第一个返回true的节点将视为容器

  :::tip
  获取坐标下的节点是通过[document.elementsFromPoint](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/elementsFromPoint)方法
  :::

- **默认值：** `(el: HTMLElement) => el.classList.contains('magic-ui-container')`

- **类型：** `(el: HTMLDivElement) => boolean | Promise<boolean>;`

- **示例：**

```html
<template>
  <m-editor :is-container="isContainer"></m-editor>
</template>

<script setup>
const canSelect = (el) => /^\d+$/.test(el.id);

const isContainer = (el) =>
  canSelect(el) &&
  (el.classList.contains('magic-ui-container') ||
    el.classList.contains('magic-ui-pc-container') ||
    el.classList.contains('magic-ui-page') ||
    el.classList.contains('magic-ui-pop-content'));
</script>
```

## canDropIn

- **详情：**

  用于自定义判断当前正在拖动的源是否可以拖入目标节点内部。同时覆盖"组件树拖动"和"画布拖入"两类场景，通过第三个参数 `scene` 区分；返回值有 3 种语义。

  **scene 取值：**

  | scene | 触发场景 | `sourceIds` | `targetId` |
  | --- | --- | --- | --- |
  | `'layer'` | "已选组件"面板组件树拖动 | 被拖动节点 id（单选时长度为 1） | 目标节点 id |
  | `'stage-drag'` | 画布上拖动已有组件 | 被拖动组件 id 列表（多选时为多个） | 候选容器节点 id |
  | `'stage-add'` | 从左侧组件列表拖入新组件到画布 | 始终为空数组（尚无 id，可仅依据 `targetId` 判断） | 候选容器节点 id |

  **返回值语义：**

  | 返回值 | layer | stage-drag | stage-add |
  | --- | --- | --- | --- |
  | `false` | 禁用 inner；同时禁用所有"target 子节点的 before/after"（这些位置等价于放入 target，避免被绕过） | 阻止该容器被高亮命中 | 取消此次拖入 |
  | `Id`（string \| number） | 将 inner 拖入目标重定向为该 id 对应的节点；与 `false` 一致禁用所有"target 子节点的 before/after" | 高亮命中切换到该 id 对应元素，最终拖入到该节点 | 直接将组件添加到该 id 对应节点（layout 坐标也基于其 DOM 重新计算） |
  | `true` / `void` / `undefined` | 按原 targetId 正常拖入 | 同左 | 同左 |

  `scene` 取 `'stage-drag'` 或 `'stage-add'` 时该函数会被透传给 `StageCore` 的 `canDropIn`，因此直接使用 `@tmagic/stage` 时同样生效

  :::tip
  - 可通过 `editorService.getNodeById(id, false)` 把 id 还原为 `MNode` 以便基于业务字段（`type`、`name` 等）做判断。
  - 该函数为**同步**调用（拖动事件在浏览器中需要立即响应，不接受异步返回）。
  - 重定向到一个不存在或非容器的目标 id 时会被忽略：layer/stage-add 场景会取消此次拖入；stage-drag 场景不会高亮。
  :::

- **默认值：** `undefined`

- **类型：** `(sourceIds: Id[], targetId: Id, scene: 'layer' | 'stage-drag' | 'stage-add') => Id | boolean | void`

- **示例 1：禁止某些组件拖入特定容器**

```html
<template>
  <m-editor :can-drop-in="canDropIn"></m-editor>
</template>

<script setup>
import { editorService } from '@tmagic/editor';

// 禁止 button 类型的组件被拖入 list 容器内部，组件树拖动与画布拖入均生效
const canDropIn = (sourceIds, targetId, scene) => {
  const targetNode = editorService.getNodeById(targetId, false);
  if (targetNode?.type !== 'list') return true;

  // 从组件列表新增组件时直接放行
  if (scene === 'stage-add') return true;

  return sourceIds.every((id) => {
    const node = editorService.getNodeById(id, false);
    return node?.type !== 'button';
  });
};
</script>
```

- **示例 2：将拖入"卡片外壳"重定向到"卡片内容"内层容器**

```html
<template>
  <m-editor :can-drop-in="canDropIn"></m-editor>
</template>

<script setup>
import { editorService } from '@tmagic/editor';

// 当用户拖入到 card 节点时，自动改为放入其 card-content 内层容器
const canDropIn = (sourceIds, targetId) => {
  const targetNode = editorService.getNodeById(targetId, false);
  if (targetNode?.type !== 'card') return true;

  const innerContent = targetNode.items?.find((item) => item.type === 'card-content');
  return innerContent?.id ?? true;
};
</script>
```

## containerHighlightClassName

- **详情：**
  
识别到容器后，会给其dom上添加的class

- **默认值：** `'tmagic-stage-container-highlight'`

- **类型：** `string`

## containerHighlightDuration

- **详情：**
  
当组件拖动过程中停留在画布上超过 [containerHighlightDuration](#containerHighlightDuration) 时长时，识别当前是否有容器

- **默认值：** `800` （单位为ms）

- **类型：** `number`


## containerHighlightType

- **详情：**

在画布中，将组件拖入其他容器的方式
  
启动方式

default: 停留在画布上启动识别

alt: 按住alt键启动识别

其他值：不启动
  
- **默认值：** `'default'`


- **类型：** `'default' | 'alt' | ''`
  
## stageRect

- **详情：**

  画布的大小

  :::tip
  该属性最终会设置到[uiService](./uiServiceMethods.md)中，所以也可直接调用[uiService.set('stageRect', value)](./uiServiceMethods.md#set)方法来配置
  :::
  
- **默认值：**
  
```js
{
  width: 375,
  height: 817,
}
```

- **类型：**

```ts
interface StageRect {
  width: number;
  height: number;
}
```

## codeOptions

- **详情：**

  编辑器中的代码编辑器配置

  :::tip
  tmagic-editor中的所有代码编辑器都使用[monaco-editor](https://microsoft.github.io/monaco-editor/)，详细配置请前往[monaco-editor](https://microsoft.github.io/monaco-editor/)官网查看
  :::
  
- **默认值：** ``{}

- **类型：** `Object`

- **示例：**

```html
<template>
  <m-editor :code-options="codeOptions"></m-editor>
</template>

<script setup>
const codeOptions = {
  tabSize: 2,
  fontSize: 16,
  formatOnPaste: true,
}
</script>
```

## updateDragEl

- **详情：**
  
当选中框与组件不贴合时，可以通过此方法进行调整

:::tip
由于画布中组件是渲染在iframe中，而选中框是渲染在编辑器中，所以会导致两者的坐标系有差异，为了解决这个问题，在[canSelect](#canselect)为true后会在编辑中创建一个位置大小与组件（target）一致的dom（el）
:::

- **类型：** `(el: HTMLElement | SVGElement, target: HTMLElement | SVGElement) => void`
  
- **默认值：** `undefined`

- **示例：**

```html
<template>
  <m-editor :update-drag-el="updateDragEl"></m-editor>
</template>

<script setup>
const updateDragEl = (el, target) => {
  const node = editorStore.pop;
  if (!node || !isPop(node)) {
    return;
  }

  const { top, left } = target.getBoundingClientRect();

  el.style.transform = 'none';
  el.style.top = `${top}px`;
  el.style.left = `${left}px`;
};
```

## disabledDragStart

- **详情：**
  
禁用组件未选中情况下，按住鼠标直接拖动

- **类型：** `boolean`
  
- **默认值：** `false`

- **示例：**

```html
<template>
  <m-editor :disabled-drag-start="true"></m-editor>
</template>
```
  
## disabledMultiSelect

- **详情：**
  
禁止多选

- **类型：** `boolean`
  
- **默认值：** `false`

- **示例：**

```html
<template>
  <m-editor :disabled-multi-select="true"></m-editor>
</template>
```

## alwaysMultiSelect

- **详情：**

  始终启用多选模式：开启后无需按住 `Ctrl/Meta` 键，组件树和画布上点击即多选。
  当 [`disabledMultiSelect`](#disabledmultiselect) 为 `true` 时本配置失效。

- **类型：** `boolean`

- **默认值：** `false`

- **示例：**

```html
<template>
  <m-editor :always-multi-select="true"></m-editor>
</template>
```

## guidesOptions

- **详情：**
  
  画布标尺和参考线的配置选项

- **默认值：** `undefined`

- **类型：** `Partial<GuidesOptions>`

- **示例：**

```html
<template>
  <m-editor :guides-options="guidesOptions"></m-editor>
</template>

<script setup>
const guidesOptions = {
  // 标尺刻度单位
  unit: 1,
  // 标尺背景色
  backgroundColor: '#f0f0f0',
  // 标尺文字颜色
  textColor: '#333',
  // 参考线颜色
  lineColor: '#ff0000',
};
</script>
```

## disabledPageFragment

- **详情：**
  
  禁用页面片功能

  页面片是可以在多个页面中复用的组件集合

- **默认值：** `false`

- **类型：** `boolean`

- **示例：**

```html
<template>
  <m-editor :disabled-page-fragment="true"></m-editor>
</template>
```

## disabledFlashTip

- **详情：**

  禁用「非点击画布选中组件时的高亮闪烁提示」。

  当组件不是通过点击画布选中（如从组件树、面包屑等外部方式选中）时，编辑器会在画布上对选中区域做一次高亮闪烁，帮助用户快速定位组件在画布中的位置。设置为 `true` 可关闭该提示。

  注：选中页面（`magic-ui-page`）时不会触发闪烁。

- **默认值：** `false`

- **类型：** `boolean`

- **示例：**

```html
<template>
  <m-editor :disabled-flash-tip="true"></m-editor>
</template>
```

## disabledStageOverlay

- **详情：**
  
  禁用双击在浮层中单独编辑选中组件的功能

  启用时，双击组件可以在浮层中单独编辑，避免其他组件干扰

- **默认值：** `false`

- **类型：** `boolean`

- **示例：**

```html
<template>
  <m-editor :disabled-stage-overlay="true"></m-editor>
</template>
```

## disabledShowSrc

- **详情：**

  禁用属性配置面板右下角"显示源码"的按钮

  该按钮可以查看和编辑组件的 JSON 配置

- **默认值：** `false`

- **类型：** `boolean`

- **示例：**

```html
<template>
  <m-editor :disabled-show-src="true"></m-editor>
</template>
```

## enablePropsFormValidate

- **详情：**

  是否启用「属性配置表单校验」联动能力。

  开启后（默认 `false` 关闭），当属性面板（属性表单 / 样式表单）校验失败时，编辑器会**仍按当前表单值更新节点**，并把错误信息集中记录到 `editorService`（`invalidNodeIds` 状态），用于：

  - 组件树（图层）中对出错节点标红并显示错误图标，鼠标悬停可查看错误文案；
  - 保存前拦截：业务可通过 `editorService.getInvalidNodeIds()` 读取错误节点，存在校验错误时阻止保存（参考 [playground 菜单保存拦截](../../guide/advanced/prop-form-validate.md#保存拦截)）。

  关闭时保持原行为：属性 / 样式表单校验失败则丢弃本次改动，不写入节点。

  :::tip
  校验错误以「来源」为维度分别记录 —— 属性表单来源记为 `props`，样式表单来源记为 `style`；两者指向同一节点，互不覆盖。节点只要任一来源存在错误即视为出错。

  错误信息会随 DSL 操作写入历史记录快照，因此「撤销 / 重做」能正确还原校验错误状态（撤销一个「校验失败」的改动后错误消失，重做后错误恢复）。
  :::

- **默认值：** `false`

- **类型：** `boolean`

- **示例：**

```html
<template>
  <!-- 开启属性配置表单校验联动能力 -->
  <m-editor :enable-props-form-validate="true"></m-editor>
</template>
```

- **相关 API：**

  - `editorService` 错误状态与方法：`get('invalidNodeIds')` / [setInvalidNode](#setinvalidnode) / [deleteInvalidNode](#deleteinvalidnode) / [getInvalidNodeIds](#getinvalidnodeids) / [getInvalidNodeInfo](#getinvalidnodeinfo) / [resetInvalidNodeId](#resetinvalidnodeid)
  - 错误状态变化事件：[invalid-node-change](#invalid-node-change)
  - 进阶用法见[属性配置表单校验联动](../../guide/advanced/prop-form-validate.md)


## disabledDataSource

- **详情：**
  
  禁用数据源功能

  禁用后，左侧面板将不显示数据源选项卡

- **默认值：** `false`

- **类型：** `boolean`

- **示例：**

```html
<template>
  <m-editor :disabled-data-source="true"></m-editor>
</template>
```

## disabledCodeBlock

- **详情：**
  
  禁用代码块功能

  禁用后，左侧面板将不显示代码块选项卡

- **默认值：** `false`

- **类型：** `boolean`

- **示例：**

```html
<template>
  <m-editor :disabled-code-block="true"></m-editor>
</template>
```

## treeIndent

- **详情：**
  
  组件树、代码块列表、数据源列表的缩进配置（单位：px）

- **默认值：** `undefined`

- **类型：** `number`

- **示例：**

```html
<template>
  <m-editor :tree-indent="20"></m-editor>
</template>
```

## treeNextLevelIndentIncrement

- **详情：**
  
  组件树、代码块列表、数据源列表子节点缩进增量配置（单位：px）

  每一级子节点会在父节点缩进基础上增加该值

- **默认值：** `undefined`

- **类型：** `number`

- **示例：**

```html
<template>
  <!-- 第一级缩进20px，第二级缩进35px，第三级缩进50px -->
  <m-editor :tree-indent="20" :tree-next-level-indent-increment="15"></m-editor>
</template>
```

## customContentMenu

- **详情：**
  
  用于自定义组件树（图层）、画布、数据源、代码块的右键菜单

  该函数会在显示右键菜单前被调用，接收默认菜单项与菜单类型作为参数，返回最终显示的菜单项

  第二个参数 `type` 用于区分菜单来源：`'layer'`（图层）、`'viewer'`（画布）、`'data-source'`（数据源）、`'code-block'`（代码块）

  第三个参数 `getTarget` 仅在**数据源**与**代码块**面板下传入，用于读取当前右键目标（节点 `id` 与原始数据）；图层 / 画布不会传入该参数

- **默认值：** `(menus) => menus`

- **类型：**

```ts
interface ContentMenuTarget {
  /** 目标 ID */
  id: string;
  /** 原始节点数据（树节点等） */
  data?: TreeNodeData;
}

type ContentMenuType = 'layer' | 'data-source' | 'viewer' | 'code-block';

type CustomContentMenuFunction = (
  menus: (MenuButton | MenuComponent)[],
  type: ContentMenuType,
  getTarget?: () => ContentMenuTarget | null,
) => (MenuButton | MenuComponent)[];
```

- **示例：**

```html
<template>
  <m-editor :custom-content-menu="customContentMenu"></m-editor>
</template>

<script setup>
const customContentMenu = (menus, type, getTarget) => {
  // 为数据源右键菜单追加自定义菜单
  if (type === 'data-source') {
    menus.push({
      type: 'button',
      text: '查看详情',
      handler: () => {
        // getTarget 仅在数据源 / 代码块面板下传入
        const target = getTarget?.();
        if (target) {
          console.log(target.id, target.data);
        }
      },
    });
  }

  // 可以过滤掉某些菜单项
  return menus.filter((menu) => menu.text !== '删除');
};
</script>
```

## layerNodeIsExpandable

- **详情：**

  用于自定义判断"已选组件"面板中组件树节点是否可展开（即是否要展示为拥有子节点的形态）

  该函数返回 `true` 时，节点会显示展开图标，并在展开后渲染子节点容器；返回 `false` 时，展开图标显示为透明占位，且不渲染子节点容器

  默认行为：当节点的 `items` 中至少存在一个 `visible` 状态为 `true` 的子节点时认为可展开（被搜索过滤隐藏的子节点不会让父节点显示为可展开）

- **默认值：** `defaultIsExpandable`

- **类型：** `(data: TreeNodeData, nodeStatusMap: Map<Id, LayerNodeStatus>) => boolean`

- **示例：**

```html
<template>
  <m-editor :layer-node-is-expandable="layerNodeIsExpandable"></m-editor>
</template>

<script setup>
import { defaultIsExpandable } from '@tmagic/editor';

// 即使没有可见子节点，特定类型的容器节点也保持展开图标可见
const layerNodeIsExpandable = (data, nodeStatusMap) => {
  if (data.type === 'my-special-container') {
    return true;
  }
  return defaultIsExpandable(data, nodeStatusMap);
};
</script>
```

::: tip
该函数仅作用于"已选组件"面板的组件树节点，不影响代码块、数据源等其它面板内的树。

第三方业务可从 `@tmagic/editor` 直接导入 `defaultIsExpandable` 复用默认逻辑作为兜底。
:::

## beforeLayerNodeDblclick

- **详情：**

  "已选组件"面板组件树节点双击前的钩子函数

  在用户双击组件树节点时，先于默认行为执行；返回 `false` 时阻止默认行为（默认行为是切换可展开节点的展开/收起状态）。返回其他值（包括 `true`、`undefined`、`Promise`）则继续执行默认行为，并向上抛出 [`layer-node-dblclick`](./events.md#layer-node-dblclick) 事件。

  常见用途：拦截特定类型节点的双击行为，或在双击时执行业务自定义动作（如重命名、打开抽屉等）后阻断默认展开/收起。

- **默认值：** `undefined`

- **类型：** `(event: MouseEvent, data: TreeNodeData) => boolean | void | Promise<boolean | void>`

- **示例：**

```html
<template>
  <m-editor
    :before-layer-node-dblclick="beforeLayerNodeDblclick"
    @layer-node-dblclick="onLayerNodeDblclick"
  ></m-editor>
</template>

<script setup>
// 双击 page 节点时阻止默认的展开/收起行为
const beforeLayerNodeDblclick = (event, data) => {
  if (data.type === 'page') {
    return false;
  }
};

const onLayerNodeDblclick = (event, data) => {
  console.log('双击节点', data.id);
};
</script>
```

::: tip
- 该钩子仅作用于"已选组件"面板的组件树节点，不影响画布上的双击行为（画布双击请使用 [`beforeDblclick`](#beforedblclick)）。
- 返回 `false` 时，会同时阻断默认的"展开/收起"行为以及向上抛出的 [`layer-node-dblclick`](./events.md#layer-node-dblclick) 事件；返回其他值则继续触发默认行为并抛出事件。
:::

## extendFormState

- **详情：**
  
  扩展表单状态

  用于在属性表单中注入自定义的状态数据，这些数据可以在表单配置的各个字段为函数时的第一个参数中获取

- **默认值：** `undefined`

- **类型：** `(state: FormState) => Record<string, any> | Promise<Record<string, any>>`

- **示例：**

```html
<template>
  <m-editor :extend-form-state="extendFormState"></m-editor>
</template>

<script setup>
const extendFormState = async (state) => {
  // 返回自定义的状态数据
  return {
    // 可以是同步数据
    currentUser: {
      name: 'Admin',
      role: 'admin',
    },
    // 也可以是异步获取的数据
    projectConfig: await fetchProjectConfig(),
  };
};
</script>
```

:::tip
扩展的状态可以在表单配置中通过 `state` 访问，例如：

```js
{
  name: 'title',
  text: '标题',
  // 根据扩展的状态动态设置
  disabled: (state) => state.currentUser.role !== 'admin',
}
```
:::

## historyListExtraTabs

- **详情：**

  [历史记录面板](/guide/advanced/history-list.md) 的自定义扩展 tab。

  业务方可借此在历史记录面板内置的「页面 / 数据源 / 代码块」三个 tab 之后追加自定义模块的历史 tab，例如某个自定义模块维护自己的操作历史时，可在面板中增加一个独立的 tab 来展示与回滚。

- **默认值：** `[]`

- **类型：** `HistoryListExtraTab[]`

  ::: details 查看 HistoryListExtraTab 类型定义
  <<< @/../packages/editor/src/type.ts#HistoryListExtraTab{ts}
  :::

- **示例：**

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
    label: () => '我的模块',
    component: markRaw(MyModuleHistoryTab),
    // 传入内容组件的 props
    props: { foo: 'bar' },
    // 内容组件的事件监听
    listeners: {
      goto: (cursor) => console.log(cursor),
    },
  },
];
</script>
```

::: tip
内容组件内部可自行通过 `useServices()` 获取 `historyService` 等服务来读取与回滚自定义模块的历史。
:::

## pageBarSortOptions

- **详情：**
  
  页面标签栏的拖拽排序配置参数

  用于配置页面标签的拖拽排序行为

- **默认值：** `undefined`

- **类型：** `PageBarSortOptions`

  ::: details 查看 PageBarSortOptions 类型定义
  <<< @/../packages/editor/src/type.ts#PageBarSortOptions{ts}
  :::

- **示例：**

```html
<template>
  <m-editor :page-bar-sort-options="sortOptions"></m-editor>
</template>

<script setup>
const sortOptions = {
  // 是否启用拖拽排序
  animation: 150,
  // 拖拽手柄的class
  handle: '.page-bar-item',
  // 其他 sortablejs 配置
};
</script>
```

## pageFilterFunction

- **详情：**
  
  页面搜索/过滤函数

  用于自定义页面的搜索逻辑，在页面列表中输入关键词时会调用该函数进行过滤

- **默认值：** `undefined`

- **类型：** `(page: MPage | MPageFragment, keyword: string) => boolean`

- **示例：**

```html
<template>
  <m-editor :page-filter-function="pageFilterFunction"></m-editor>
</template>

<script setup>
const pageFilterFunction = (page, keyword) => {
  // 自定义搜索逻辑
  // 不仅搜索页面名称，还搜索页面的其他属性
  return (
    page.name?.includes(keyword) ||
    page.title?.includes(keyword) ||
    page.id?.includes(keyword)
  );
};
</script>
```

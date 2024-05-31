# Editor组件 props

## modelValue/v-model

- **详情：**
  
  页面初始值

- **默认值：** `{}`
  

- **类型：** [MApp](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/schema/src/index.ts?plain=1#L66-L73)[]

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

- **类型：** [ComponentGroup](https://github.com/Tencent/tmagic-editor/blob/5880dfbe15fcead63e9dc7c91900f8c4e7a574d8/packages/editor/src/type.ts#L355)

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

- **类型：** [DatasourceTypeOption](https://github.com/Tencent/tmagic-editor/blob/5880dfbe15fcead63e9dc7c91900f8c4e7a574d8/packages/editor/src/type.ts#L589)

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

- **类型：** [SideBarData](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L258-L265)

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

  系统提供了几个常用功能： `'/' | 'delete' | 'undo' | 'redo' | 'zoom-in' | 'zoom-out' | 'zoom' | 'guides' | 'rule' | 'scale-to-original' | 'scale-to-fit'`

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

- **默认值：**
  
```js
{ left: [], center: [], right: [] }
```

- **类型：** [MenuBarData](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L235-L242)

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

- **类型：** ([MenuButton](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L168-L195) | [MenuComponent](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L197-L210))[]

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

- **类型：** ([MenuButton](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L168-L195) | [MenuComponent](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L197-L210))[]

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
    runtime-url="https://tencent.github.io/tmagic-editor/playground/runtime/vue3/playground/index.html"
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
- **类型：** Record<string, [FormConfig](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/form/src/schema.ts#L706)>

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
  该属性最终会设置到[eventsService](./eventsServiceMethods.md)中，所以也可直接调用[eventsService.setEvents()](./eventsServiceMethods.md#setEvents)与[eventsService.setMethods()](./eventsServiceMethods#setMethods)方法来配置
  :::

- **默认值：** `{}`

- **类型：** Record<string, { events: [EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[]; methods: [EventOption](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/core/src/events.ts#L26-L29)[] }>
  
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

- **类型：** Record<string, Partial<[DataSourceSchema](https://github.com/Tencent/tmagic-editor/blob/5880dfbe15fcead63e9dc7c91900f8c4e7a574d8/packages/schema/src/index.ts#L221)>>
  
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

- **类型：** Record<string, [FormConfig](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/form/src/schema.ts#L706)>
  
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

- **类型：** ((config?: [CustomizeMoveableOptionsCallbackConfig](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/stage/src/types.ts#L97-L109)) => MoveableOptions) | [MoveableOptions](https://daybrush.com/moveable/release/latest/doc/)

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
  
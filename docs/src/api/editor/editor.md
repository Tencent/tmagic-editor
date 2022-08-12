# m-editor

## props

### modelValue

- **类型：** [MApp](https://github.com/Tencent/tmagic-editor/blob/master/packages/schema/src/index.ts)[]
  
- **默认值：** {}
  
- **详情：**
  
  页面初始值

- **示例：**
  
```js
{
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
        }
      ]
    }
  ]
}
```

### componentGroupList

- **类型：** [ComponentGroup](https://github.com/Tencent/tmagic-editor/blob/master/packages/editor/src/type.ts)[]
  
- **默认值：** []
  
- **详情：**
  
  左侧面板中的组件列表

- **示例：**

```js
import { FolderOpened, SwitchButton, Tickets } from '@element-plus/icons-vue';

[
  {
    title: '容器',
    items: [
      {
        icon: FolderOpened,
        text: '组',
        type: 'container',
      },
    ],
  },
  {
    title: '基础组件',
    items: [
      {
        icon: Tickets,
        text: '文本',
        type: 'text',
      },
      {
        icon: SwitchButton,
        text: '按钮',
        type: 'button',
      },
    ],
  },
]
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

::: warning
此配置仅在[sidebar](#sidebar)中配置了'component-list'时有效
:::

### sidebar

- **类型：** [SideBarData](https://github.com/Tencent/tmagic-editor/blob/master/packages/editor/src/type.ts)
  
- **默认值：** { type: 'tabs', status: '组件', items: ['component-list', 'layer'] }
  
- **详情：**
  
  左侧面板，目前只支持type: 'tabs';

  component-list的text为'组件'

- **示例：**
  
```js
import { List } from '@element-plus/icons-vue';
import ModListPanel from '../components/sidebars/ModListPanel.vue';

{
  type: 'tabs',
  status: '组件',
  items: [
    'component-list',
    'layer',
    {
      type: 'component',
      icon: List,
      component: ModListPanel,
      text: '模块',
    },
}
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

### menu

- **类型：** [MenuBarData](https://github.com/Tencent/tmagic-editor/blob/master/packages/editor/src/type.ts)
  
- **默认值：** { left: [], center: [], right: [] }
  
- **详情：**
  
  顶部工具栏

  系统提供了几个常用功能： '/' | 'delete' | 'undo' | 'redo' | 'zoom-in' | 'zoom-out' | 'zoom'

  '/': 分隔符

  'delete': 删除按钮

  'undo': 撤销按钮

  'redo': 恢复按钮

  'zoom-in': 放大按钮
  
  'zoom-out': 缩小按钮

  'zoom': 缩放

- **示例：**

```js
import { toRaw } from 'vue';
import { ArrowLeft, Coin } from '@element-plus/icons-vue';

{
  left: [
    {
      type: 'button',
      icon: ArrowLeft,
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
      icon: Coin,
      disabled: true,
      handler: ({ editorService }) => console.log(toRaw(editorService.get('root'))),
    },
  ],
}
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

### render

- **类型：** Function
  
- **默认值：** undefined
  
- **详情：**
  
  中间工作区域中画布渲染的内容，通常是通过解析[modelValue](#modelValue)来渲染出DOM，return的DOM结构需要有一个根节点。

- **示例：**

```js
(renderer) => renderer.contentWindow.document.createElement('div')
```

### runtimeUrl

- **类型：** string
  
- **默认值：** undefined
  
- **详情：**
  
  runtime 的HTML地址，可以是一个HTTP地址，如果和编辑器不同域，需要设置跨域，也可以是一个相对或绝对路径

### propsConfigs

- **类型：** { [type: string]: [FormConfig](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts) }
  
- **默认值：** {}
  
- **详情：**
  
  组件的属性配置表单的dsl

- **示例：**
  
```js
{
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
```

### propsValues

- **类型：** { [type: string]: Object }
  
- **默认值：** {}
  
- **详情：**
  
  添加组件时的默认值

- **示例：**

```js
{
  text: {
    text: '文本',
    multiple: true,
  },
  button: {
    text: '按钮',
  },
}
```

### moveableOptions

- **类型：** ((core: StageCore) => MoveableOptions) | [MoveableOptions](https://daybrush.com/moveable/release/latest/doc/)
  
- **默认值：** {}
  
- **详情：**
  
  画布中的选中框配置选项，使用的是[moveable](https://github.com/daybrush/moveable)第三方库

### stageRect

- **类型：** { width: number; height: number }

- **默认值：** { width: 375, height: 817 }
  
- **详情：**
  
  画布的大小配置

### autoScrollIntoView

- **类型：** boolean
  
- **默认值：** undefined
  
- **详情：**
  
选中组件时，是否自动滚动该组件到可视区域

### updateDragEl

- **类型：** (el: HTMLDivElement, target: HTMLElement) => void;
  
- **默认值：** undefined
  
- **详情：**
  
当选中框与组件不贴合时，可以通过此方法进行调整

### isContainer

- **类型：** (el: HTMLDivElement) => boolean | Promise\<boolean\>;
  
- **默认值：** (el: HTMLElement) => el.classList.contains('magic-ui-container')
  
- **详情：**
  
当组件拖动过程中停留在画布上超过 [containerHighlightDuration](#containerHighlightDuration) 时长时，识别当前是否有容器

### containerHighlightDuration

- **类型：** number;
  
- **默认值：** 800（单位为ms）
  
- **详情：**
  
当组件拖动过程中停留在画布上超过 [containerHighlightDuration](#containerHighlightDuration) 时长时，识别当前是否有容器

### containerHighlightClassName

- **类型：** string;
  
- **默认值：** 'tmagic-stage-container-highlight'
  
- **详情：**
  
识别到容器后，会给其dom上添加的class

### containerHighlightType

- **类型：** 'default' | 'alt' | '';
  
- **默认值：** 'default'
  
- **详情：**
  
启动方式

default: 停留在画布上启动识别

alt: 按住alt键启动识别

其他值：不启动


## slots

### nav

- **详情：** 工具栏

### sidebar

- **详情：** 左侧栏

### workspace

- **详情：** 中间工作区域

### workspace-content

- **详情：** 中间工作区域内部
  
:::tip
在没有 workspace slots 的时候才可以用
:::

### propsPanel

- **详情：** 属性面板

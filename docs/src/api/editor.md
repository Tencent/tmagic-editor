# m-editor

## props

### data

- **类型：** MApp(https://github.com/Tencent/tmagic-editor/blob/master/packages/schema/src/index.ts)[]
  
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
[
  {
    title: '容器',
    items: [
      {
        icon: 'folder-opened',
        text: '组',
        type: 'container',
      },
      {
        icon: 'el-icon-files',
        text: '标签页(tab)',
        type: 'tabs',
      },
    ],
  },
  {
    title: '基础组件',
    items: [
      {
        icon: 'tickets',
        text: '文本',
        type: 'text',
      },
      {
        icon: 'switch-button',
        text: '按钮',
        type: 'button',
      },
    ],
  },
]
```

::: tip
icon使用的是[element-plus icon](https://element-plus.org/zh-CN/component/icon.html)
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
import ModListPanel from '../components/sidebars/ModListPanel.vue';

{
  type: 'tabs',
  status: '组件',
  items: [
    'component-list',
    'layer',
    {
      type: 'component',
      icon: 'el-icon-s-order',
      component: ModListPanel,
      text: '模块',
    },
}
```

### menu

- **类型：** [MenuBarData](https://github.com/Tencent/tmagic-editor/blob/master/packages/editor/src/type.ts)
  
- **默认值：** { left: [], center: [], right: [] }
  
- **详情：**
  
  顶部工具栏

  系统提供了几个常用功能： '/' | 'delete' | 'undo' | 'redo' | 'zoom-in' | 'zoom-out'

  '/': 分隔符

  'delete': 删除按钮

  'undo': 撤销按钮

  'redo': 恢复按钮

  'zoom-in': 放大按钮
  
  'zoom-out': 缩小按钮

- **示例：**

```js
{
  left: [
    {
      type: 'button',
      icon: 'el-icon-arrow-left',
      tooltip: '返回',
    },
    '/',
    {
      type: 'text',
      text: '魔方',
    },
  ],
  center: ['delete', 'undo', 'redo', 'zoom-in', 'zoom-out'],
  right: [
    {
      type: 'button',
      text: '保存',
      icon: 'el-icon-coin',
      disabled: true,
      handler: ({ store }) => console.log(toRaw(store.get('root'))),
    },
  ],
}
```

### render

- **类型：** Function
  
- **默认值：** undefined
  
- **详情：**
  
  中间工作区域中画布渲染的内容

- **示例：**

```js
(renderer) => renderer.contentWindow.document.createElement('div')
```

### runtimeUrl

- **类型：** string
  
- **默认值：** undefined
  
- **详情：**
  
  中间工作区域中画布通过iframe渲染时的页面url

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

# 布局

## 配置类型

::: details 查看 ContainerCommonConfig / RowConfig / TabConfig / TabPaneConfig / FieldsetConfig / PanelConfig / StepConfig / FlexLayoutConfig / GroupListConfig / TableConfig / TableColumnConfig / TableGroupListCommonConfig / GroupListHeaderConfig 配置类型定义
<<< @/../packages/form-schema/src/base.ts#ContainerCommonConfig{ts}

<<< @/../packages/form-schema/src/base.ts#RowConfig{ts}

<<< @/../packages/form-schema/src/base.ts#TabConfig{ts}

<<< @/../packages/form-schema/src/base.ts#TabPaneConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FieldsetConfig{ts}

<<< @/../packages/form-schema/src/base.ts#PanelConfig{ts}

<<< @/../packages/form-schema/src/base.ts#StepConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FlexLayoutConfig{ts}

<<< @/../packages/form-schema/src/base.ts#GroupListConfig{ts}

<<< @/../packages/form-schema/src/base.ts#TableConfig{ts}

<<< @/../packages/form-schema/src/base.ts#TableColumnConfig{ts}

<<< @/../packages/form-schema/src/base.ts#TableGroupListCommonConfig{ts}

<<< @/../packages/form-schema/src/base.ts#GroupListHeaderConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

## 基础用法

<demo-block type="form" :config="[{
  name: 'text',
  text: '配置1',
}, {
  name: 'text2',
  text: '配置2',
}, {
  name: 'text3',
  text: '配置3',
}]"></demo-block>

## 行内布局

可以通过配置span，来指定行内的配置项占用多少位置，一行为24，例如一行要显示三个配置则 span 可以配置 8；四个则为 6。默认会自动调节在一行中显示。

<demo-block type="form" :config="[{
  type: 'row',
  labelWidth: '100px',
  span: 8,
  items: [{
    name: 'text',
    text: '配置1',
  }, {
    name: 'text2',
    text: '配置2',
  }, {
    name: 'text3',
    text: '配置3',
  }]
}, {
  type: 'row',
  span: 12,
  labelWidth: '100px',
  items: [{
    name: 'text4',
    text: '配置1',
  }, {
    name: 'text5',
    text: '配置2',
  }, {
    name: 'text6',
    text: '配置3',
  }]
}]"></demo-block>

## 混合布局

<demo-block type="form" :config="[{
  name: 'text0',
  labelWidth: '100px',
  text: '配置0',
}, {
  type: 'row',
  labelWidth: '100px',
  items: [{
    name: 'text',
    text: '配置1',
  }, {
    name: 'text2',
    text: '配置2',
  }, {
    name: 'text3',
    text: '配置3',
  }]
}]"></demo-block>

## 对象容器

### Object

<demo-block type="form" :config="[{
  name: 'data',
  items: [{
    name: 'text2',
    text: '配置2',
  }, {
    name: 'text3',
    text: '配置3',
  }]
}]"></demo-block>

### fieldset

<demo-block type="form" :config="[{
  type: 'fieldset',
  labelWidth: '100px',
  legend: 'fieldset',
  items: [{
    name: 'text',
    text: '配置1',
  }, {
    type: 'row',
    items: [{
      name: 'text2',
      text: '配置2',
    }, {
      name: 'text3',
      text: '配置3',
    }]
  }]
}]"></demo-block>

`legend` 除了支持字符串，也支持函数，函数返回值作为标题展示，可根据表单数据动态生成：

<demo-block type="form" :config="[{
  type: 'fieldset',
  labelWidth: '100px',
  legend: (mForm, { formValue }) => `当前值：${formValue.text || '空'}`,
  items: [{
    name: 'text',
    text: '配置1',
  }]
}]"></demo-block>

### panel

<demo-block type="form" :config="[{
  type: 'panel',
  title: 'panel',
  items: [{
    name: 'text',
    text: '配置1',
  }, {
    type: 'row',
    items: [{
      name: 'text2',
      text: '配置2',
    }, {
      name: 'text3',
      text: '配置3',
    }]
  }]
}]"></demo-block>

### tabs

<demo-block type="form" :config="[{
  type: 'tab',
  items: [{
    title: 'tab1',
    items: [{
      name: 'text',
      text: '配置1',
    }]
  }, {
    title: 'tab2',
    items: [{
      name: 'text2',
      text: '配置2',
    }, {
      name: 'text3',
      text: '配置3',
    }]
  }]
}]"></demo-block>

## 数组容器

### groupList

<demo-block type="form" :config="[{
  type: 'groupList',
  name: 'group',
  items: [{
    name: 'text',
    text: '配置1',
  }, {
    type: 'row',
    items: [{
      name: 'text2',
      text: '配置2',
    }, {
      name: 'text3',
      text: '配置3',
    }]
  }]
}]"></demo-block>

#### 标题吸顶

列表项较多、需要边滚动边看清当前编辑的是哪一项时，可以用 `header.sticky` 让卡片标题吸顶：

```ts
{
  type: 'groupList',
  name: 'group',
  header: { sticky: true },
  items: [/* ... */],
}
```

吸顶默认关闭，需要逐层显式开启：外层开了不会带动内层，嵌套列表想一起吸顶就各自配一次，内层标题会自动下移让开外层标题。

标题让位的高度默认按 65px 计算。如果自定义了卡片标题的样式导致实际高度不同、内层标题出现重叠或空隙，用 `header.height` 告知真实高度即可（它只影响内层的让位距离，不会改变标题本身的高度）。

::: warning 行为变更
1.8.0-beta.28 之前，group-list 的卡片标题在任何情况下都会吸顶。现在改为默认关闭、由 `header.sticky` 显式开启。升级后如需保持原有表现，请在对应配置上补上 `header: { sticky: true }`。
:::

### table

<demo-block type="form" :config="[{
  type: 'table',
  name: 'table',
  items: [{
    name: 'text',
    label: '配置1',
  }]
}]"></demo-block>

### step

<demo-block type="form" :config="[{
  type: 'step',
  items: [{
    title: '步骤1',
    items: [{
      name: 'text',
      text: '配置1',
    }]
  }, {
    title: '步骤2',
    items: [{
      name: 'text2',
      text: '配置2',
    }]
  }]
}]"></demo-block>

### flex-layout

<demo-block type="form" :config="[{
  type: 'flex-layout',
  gap: '20px',
  items: [{
    name: 'text',
    text: '配置1',
    span: 12
  }, {
    name: 'text2',
    text: '配置2',
    span: 12
  }]
}]"></demo-block>

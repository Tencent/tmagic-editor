# 布局

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

### table

<demo-block type="form" :config="[{
  type: 'table',
  name: 'table',
  items: [{
    name: 'text',
    label: '配置1',
  }]
}]"></demo-block>

# Cascader 级联选择器

当一个数据集合有清晰的层级结构时，可通过级联选择器逐级查看并选择。

## 基础用法

有两种触发子菜单的方式

<demo-block type="form" :config="[{
  type: 'cascader',
  name: 'cascader',
  text: '选项',
  placeholder: '请选择',
  options: [
    { 
      value: 'zhinan',
      label: '指南',
      children: [{
        value: 'shejiyuanze',
        label: '设计原则',
        children: [{
          value: 'yizhi',
          label: '一致'
        }, {
          value: 'fankui',
          label: '反馈'
        }]
      }, {
        value: 'daohang',
        label: '导航',
        children: [{
          value: 'cexiangdaohang',
          label: '侧向导航'
        }, {
          value: 'dingbudaohang',
          label: '顶部导航'
        }]
      }]
    },
    { 
      value: 'zujian',
      label: '组件',
      children: [{
        value: 'basic',
        label: 'Basic',
        children: [{
          value: 'layout',
          label: 'Layout 布局'
        }, {
          value: 'color',
          label: 'Color 色彩'
        }]
      }, {
        value: 'form',
        label: 'Form',
        children: [{
        value: 'checkbox',
        label: 'Checkbox 多选框'
        }, {
          value: 'input',
          label: 'Input 输入框'
        }]
      }]
    }
  ]
}]"><template #source><p>type为'cascader'</p></template></demo-block>

## 禁用选项

通过在数据源中设置 disabled 字段来声明该选项是禁用的

<demo-block type="form" :config="[{
  type: 'cascader',
  name: 'cascader',
  text: '选项',
  placeholder: '请选择',
  disabled: true,
  options: [
  ]
}, {
  type: 'cascader',
  name: 'cascader1',
  text: '选项2',
  placeholder: '请选择',
  options: [
    { 
      value: 'zhinan',
      label: '指南',
      disabled: true,
      children: [{
        value: 'shejiyuanze',
        label: '设计原则',
        children: [{
          value: 'yizhi',
          label: '一致'
        }, {
          value: 'fankui',
          label: '反馈'
        }]
      }, {
        value: 'daohang',
        label: '导航',
        children: [{
          value: 'cexiangdaohang',
          label: '侧向导航'
        }, {
          value: 'dingbudaohang',
          label: '顶部导航'
        }]
      }]
    },
    { 
      value: 'zujian',
      label: '组件',
      children: [{
        value: 'basic',
        label: 'Basic',
        disabled: true,
        children: [{
          value: 'layout',
          label: 'Layout 布局'
        }, {
          value: 'color',
          label: 'Color 色彩'
        }]
      }, {
        value: 'form',
        label: 'Form',
        children: [{
        value: 'checkbox',
        label: 'Checkbox 多选框'
        }, {
          value: 'input',
          disabled: true,
          label: 'Input 输入框'
        }]
      }]
    }
  ]
}]">
  <template #source>
    <p>
      本例中，options 指定的数组中的第一个元素含有 disabled: true 键值对，因此是禁用的。在默认情况下，Cascader 会检查数据中每一项的 disabled 字段是否为 true ，如果你的数据中表示禁用含义的字段名不为 disabled ，可以通过 disabled 属性来指定（详见下方 API 表格）。当然， value 、 label 和 children 这三个字段名也可以通过同样的方式指定。
    </p>
  </template>
</demo-block>
 
## 多选

可通过 `multiple = true` 来开启多选模式

<demo-block type="form" :config="[{
  type: 'cascader',
  name: 'cascader',
  text: '选项',
  multiple: true,
  placeholder: '请选择',
  options: [
    { 
      value: 'zhinan',
      label: '指南',
      children: [{
        value: 'shejiyuanze',
        label: '设计原则',
        children: [{
          value: 'yizhi',
          label: '一致'
        }, {
          value: 'fankui',
          label: '反馈'
        }]
      }, {
        value: 'daohang',
        label: '导航',
        children: [{
          value: 'cexiangdaohang',
          label: '侧向导航'
        }, {
          value: 'dingbudaohang',
          label: '顶部导航'
        }]
      }]
    },
    { 
      value: 'zujian',
      label: '组件',
      children: [{
        value: 'basic',
        label: 'Basic',
        children: [{
          value: 'layout',
          label: 'Layout 布局'
        }, {
          value: 'color',
          label: 'Color 色彩'
        }]
      }, {
        value: 'form',
        label: 'Form',
        children: [{
        value: 'checkbox',
        label: 'Checkbox 多选框'
        }, {
          value: 'input',
          label: 'Input 输入框'
        }]
      }]
    }
  ]
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>

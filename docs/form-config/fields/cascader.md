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

## 任意一级可选

在单选模式下，你只能选择叶子节点；而在多选模式下，勾选父节点真正选中的都是叶子节点。启用该功能后，可让父子节点取消关联，选择任意一级选项。

可通过 `checkStrictly = true` 来设置父子节点取消选中关联，从而达到选择任意一级选项的目的。

<demo-block type="form" :config="[{
  type: 'cascader',
  name: 'cascader',
  text: '选项',
  placeholder: '请选择',
  checkStrictly: true,
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
      }]
    }
  ]
}]">
  <template #source>
    <p>
      配置 checkStrictly 为 true，可选择任意一级选项
    </p>
  </template>
</demo-block>

## 仅返回选中节点的值

在选中节点改变时，默认返回由该节点所在的各级菜单的值所组成的数组。可通过 `emitPath = false` 设置仅返回该节点的值。

<demo-block type="form" :config="[{
  type: 'cascader',
  name: 'cascader',
  text: '选项',
  placeholder: '请选择',
  emitPath: false,
  checkStrictly: true,
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
      }]
    }
  ]
}]">
  <template #source>
    <p>
      配置 emitPath 为 false，仅返回选中节点的值，而非完整路径数组
    </p>
  </template>
</demo-block>

## 值分隔符

当需要将选中值以字符串形式存储时，可通过 `valueSeparator` 指定分隔符，组件会自动将数组转换为字符串存储，读取时也会自动还原。

<demo-block type="form" :config="[{
  type: 'cascader',
  name: 'cascader',
  text: '选项',
  placeholder: '请选择',
  valueSeparator: '/',
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
        }]
      }]
    }
  ]
}]">
  <template #source>
    <p>
      配置 valueSeparator 为 '/'，选中值将以 'zhinan/shejiyuanze/yizhi' 的字符串形式存储
    </p>
  </template>
</demo-block>

## 远程选项

通过接口请求获取选项列表

<demo-block type="form" :config="[{
  type: 'cascader',
  name: 'cascader',
  text: '选项',
  placeholder: '请选择',
  remote: true,
  option: {
    url: 'cascader/remote',
    root: 'data',
    cache: true,
    timeout: 5000,
    body: { query: '' },
    item: (data) => data
  }
}]">
  <template #source>
    <p>
      配置 remote 为 true，然后配置 option 对象，而不是 options 数组
    </p>
  </template>
</demo-block>

同时在 `src/main.ts` 中需要自定义实现请求：

```typescript 
app.use(MagicForm, {
  request: async (options: any) => {
    // 自定义请求实现
  },
});
```

## 动态选项

options 支持传入函数，可根据表单其他字段动态生成选项列表

```typescript
{
  type: 'cascader',
  name: 'cascader',
  text: '选项',
  options: (mForm, { model, formValue }) => {
    // 根据表单值动态返回选项
    return [
      { value: 'a', label: '选项A', children: [] }
    ];
  }
}
```

## Cascader Attributes

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| name | 绑定值 | string | — | — |
| text | 表单标签 | string | — | — |
| placeholder | 输入框占位文本 | string | — | — |
| disabled | 是否禁用 | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form-schema/src/base.ts) | — | false |
| multiple | 是否多选 | boolean | — | false |
| emitPath | 在选中节点改变时，是否返回由该节点所在的各级菜单的值所组成的数组，若设置 false，则只返回该节点的值 | boolean | — | true |
| checkStrictly | 是否严格的遵守父子节点不互相关联 | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form-schema/src/base.ts) | — | false |
| valueSeparator | 合并成字符串时的分隔符 | string / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form-schema/src/base.ts) | — | — |
| popperClass | 弹出内容的自定义类名 | string | — | — |
| remote | 是否为远程搜索 | boolean | — | false |
| options | 选项数据源 | Array / Function | — | — |
| option | 远程选项配置 | Object | — | — |
| onChange | 值变化时触发的函数 | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form-schema/src/base.ts) | — | — |

## options item

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| value | 选项的值 | any | — | — |
| label | 选项的标签 | string | — | — |
| children | 子选项 | Array | — | — |

## option（远程配置）

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| url | 请求地址 | string | — | — |
| root | 响应数据的根路径 | string | — | — |
| cache | 是否缓存请求结果 | boolean | — | false |
| timeout | 请求超时时间（毫秒） | number | — | — |
| body | 请求体 | Object / Function | — | — |
| item | 数据转换函数，将响应数据转换为选项格式 | Function | — | — |

# Select 选择器

当选项过多时，使用下拉菜单展示并选择内容。

## 基础用法

适用广泛的基础单选

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ]
}]">
  <template #source>
    <p>
      type为'select'
    </p>
  </template>
</demo-block>

## 有禁用选项

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2, disabled: true }
  ]
}]">
  <template #source>
    <p>
      在 opitons 选项配置中，设定 disabled 值为 true，即可禁用该选项
    </p>
  </template>
</demo-block>

## 禁用状态

选择器不可用状态

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  disabled: true,
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ]
}]">
  <template #source>
    <p>
      为 el-select 设置 disabled 属性，则整个选择器不可用
    </p>
  </template>
</demo-block>

## 基础多选

适用性较广的基础多选，用 Tag 展示已选项

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  multiple: true,
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 },
    { text: '选项3', value: 3 }
  ]
}]"></demo-block>

## 分组

备选项进行分组展示

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  group: true,
  options: [
    {
      label: 'group1',
      options: [
        { text: '选项1', value: 1 },
        { text: '选项2', value: 2 },
        { text: '选项3', value: 3 }
      ],
      disabled: true
    }, {
      label: 'group2',
      options: [
        { text: '选项4', value: 4 },
        { text: '选项5', value: 5 },
        { text: '选项6', value: 6 }
      ]
    }
  ]
}]">
  <template #source>
    <p>
      配置group为true
    </p>
  </template>
</demo-block>

## 创建条目

可以创建并选中选项中不存在的条目

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  allowCreate: true,
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ]
}]"></demo-block>

## 远程选项

通过接口请求获取选项列表

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  remote: true,
  option: {
    url: 'select/remote',
    root: 'data',
    method: 'post',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: { query: '' },
    json: true,
    text: option => `${option.name}`,
    value: option => `${option.id}`,
  }
}]">
  <template #source>
    <p>
      配置remote为true，然后配置option，而不是options
    </p>
  </template>
</demo-block>

同时在 `src/main.ts` 中需要自定义实现请求
```typescript 
app.use(MagicForm, {
      request: async (options: any) =>  {
           // 自定义请求实现
      },
});
```

:::tip
如果 Select 的绑定值为对象类型，请务必指定 valueKey 作为它的唯一性标识。
:::

## Select Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| name | 绑定值 | string | — | — |
| placeholder  | 输入框占位文本   | string |       —        |      —   |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| multiple | 是否多选 | boolean | — | false |
| valueKey | 作为 value 唯一标识的键名，绑定值为对象类型时必填 | string | — | value |
| allowCreate | 是否允许用户创建新条目 | boolean | — | false |
| remote | 是否为远程搜索 | boolean | — | false |
| group | 是否选择分组 | boolean | — | false |
| onChange  | 值变化时触发的函数  | [OnChangeHandler ](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |
| options  | 选项  | Array   | — | -   |
| option  | 选项  | Object   | — | -   |

## options item
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| text |  | 选项的标签 | string/number/object | — | — |
| value | 选项的值	 | string | — | — |
| disabled  | 是否禁用    | boolean | — | false   |
| label |  string | — | — | — |
| options | Array | — | — | — |

## option
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| url | string | — | — | — |
| root | string | — | — | — |
| text | string / Function | — | — | — |
| value | string / Function | — | — | — |

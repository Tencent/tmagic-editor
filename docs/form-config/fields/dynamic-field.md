# DynamicField 动态表单

根据模型中某个字段的值，动态生成一组表单字段。

## 基础用法

<demo-block type="form" :config="[{
  type: 'select',
  name: 'type',
  text: '类型',
  options: [
    { label: '类型A', value: 'a' },
    { label: '类型B', value: 'b' }
  ]
}, {
  type: 'dynamic-field',
  text: '动态字段',
  dynamicKey: 'type',
  returnFields: async (config, model, request) => {
    if (model.type === 'a') {
      return [{ name: 'fieldA', label: '字段A', defaultValue: 'valueA' }];
    } else if (model.type === 'b') {
      return [{ name: 'fieldB', label: '字段B', defaultValue: 'valueB' }];
    }
    return [];
  }
}]">
  <template #source>
    <p>
      当“类型”发生变化时，“动态字段”会根据 `returnFields` 返回的配置生成不同的输入框。
    </p>
  </template>
</demo-block>

:::warning
特别注意：`dynamic-field` 的上一级配置必须设置 `extensible: true`，才能保存未在 schema 中声明的动态字段。
:::

## Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| type | 组件类型 | string | dynamic-field | — |
| text     | 表单标签   | string |       —        |      —   |
| dynamicKey | 监听的字段名。当该字段值变化时，触发 `returnFields` 重新计算 | string | — | — |
| returnFields | 返回字段列表的函数 | (config, model, request) => Promise<Field[]> | — | — |

### Field 对象结构
| 参数      | 说明          | 类型      | 默认值  |
|---------- |-------------- |---------- |-------- |
| name | 字段名 | string | — |
| label | 标签名 | string | — |
| defaultValue | 默认值 | any | — |


# Display 只读文本

用于显示，不可编辑

## TS 定义

```typescript
interface Display extends FormItem {
  type: 'display';
}
```

点击查看[FormItem](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)的定义

## 基础用法

<demo-block type="form" :config="[{
  type: 'display',
  name: 'display',
  text: '只读文本',
  defaultValue: 'display'
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>


## Input Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |

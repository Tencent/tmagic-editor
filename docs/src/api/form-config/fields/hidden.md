# Hidden 隐藏域

改值体现于最终提交的表单中，用于例如编辑记录的id这种场景中

## TS 定义

```typescript
interface Hidden extends FormItem {
  type: 'hidden';
}
```

点击查看[FormItem](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)的定义

## 基础用法

<demo-block type="form" :config="[{
  type: 'hidden',
  name: 'hidden'
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

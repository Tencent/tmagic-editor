# UISelect 组件选择器

用于在画布中选择组件的选择器。

::: warning 注意
此组件仅在编辑器环境中可用，需要配合 `@tmagic/editor` 使用。
:::

## 基础用法

```js
{
  type: 'ui-select',
  name: 'targetId',
  text: '目标组件'
}
```

## 值校验

安装 `@tmagic/editor` 后该字段会自动注册内置 `typeMatch` 校验规则：须为 `string` 或 `number`，有节点树时须为已有组件 id。服务数据未就绪时仅做基础形态校验。详见[表单校验 - Editor 字段内置规则](/form-config/rules.md#editor-字段内置规则)。

## Attributes

| 参数     | 说明               | 类型                                                                                                                                                     | 可选值 | 默认值 |
| -------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| name     | 绑定值             | string                                                                                                                                                   | —      | —      |
| text     | 表单标签           | string                                                                                                                                                   | —      | —      |
| disabled | 是否禁用           | boolean / `FilterFunction` | —      | false  |
| onChange | 值变化时触发的函数 | `OnChangeHandler`           | —      | -      |

::: details 查看 FilterFunction / OnChangeHandler 及关联类型定义
<<< @/../packages/form-schema/src/base.ts#FilterFunction{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandler{ts}

<<< @/../packages/form-schema/src/base.ts#OnChangeHandlerData{ts}

<<< @/../packages/form-schema/src/base.ts#ChangeRecord{ts}

<<< @/../packages/form-schema/src/base.ts#FormValue{ts}
:::


## 配置类型

::: details 查看 UISelectConfig 配置类型定义
<<< @/../packages/form-schema/src/editor.ts#UISelectConfig{ts}

<<< @/../packages/form-schema/src/base.ts#FormItem{ts}

:::

## 使用说明

1. 点击"点击此处选择"按钮进入选择模式
2. 在画布中点击目标组件完成选择
3. 选择后会显示组件名称和ID
4. 可通过清除按钮清空选择
5. 点击组件名称可跳转到对应组件

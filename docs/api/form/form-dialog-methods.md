# FormDialog组件 methods

## cancel

- **详情：** 关闭弹窗

## save

- **签名：** `save(): Promise<void>`

- **返回：**

  - `{Promise<void>}`

- **详情：** 调用内部 Form 的 `submitForm` 进行校验，校验通过后触发 `submit` 事件（参数为表单值与 `{ changeRecords }`）；若校验失败则触发 `error` 事件

## show

- **签名：** `show(): void`

- **详情：** 打开弹窗，等价于将内部 `dialogVisible` 置为 `true`

## hide

- **签名：** `hide(): void`

- **详情：** 关闭弹窗，等价于将内部 `dialogVisible` 置为 `false`

## form

- **类型：** `Ref<InstanceType<typeof Form> | undefined>`

- **详情：** 内部 Form 组件的实例引用，可通过它访问 Form 上 `defineExpose` 暴露的方法与属性

## saveFetch

- **类型：** `Ref<boolean>`

- **详情：** 保存按钮的 loading 状态

## dialogVisible

- **类型：** `Ref<boolean>`

- **详情：** 弹窗的显示状态

# Form组件 methods

## resetForm

- **详情：** 重置该表单项，将其值重置为初始值，并移除校验结果

## submitForm

- **签名：** `async (native?: boolean) => Promise<any>`

- **参数：**

  - `native?: boolean` - 是否返回原始表单值。当 `native` 为 `true` 时返回内部 `values.value`（响应式原值）；否则返回 `cloneDeep(toRaw(values.value))`（深拷贝后的纯对象）

- **返回：**

  - `{Promise<any>}` - 校验通过后返回当前表单值；校验失败时会触发 `error` 事件并 throw 一个包含错误信息的 `Error`

- **详情：** 提交表单，先执行校验，校验通过后清空 `changeRecords` 并返回当前表单值

- **相关：** 如果你想脱离组件树以函数方式完成一次表单提交，参见 [`submitForm` 函数](./submit-form.md)

## changeHandler

- **签名：** `(prop: string, value: any, eventData?: ContainerChangeEventData) => void`

- **详情：** 表单项值变更处理函数，会根据传入的 `propPath` 更新内部表单值，并向上 emit `change` 事件

## getTextByName

- **签名：** `(name: string) => string | undefined`

- **参数：**

  - `name: string` - 字段名，支持点分隔的路径格式，如 `'a.b.c'`

- **返回：**

  - `{string | undefined}` - 找到的 `text` 值，如果未找到则返回 `undefined`

- **详情：** 通过 `name` 从表单 `config` 中查找对应表单项的 `text`

- **相关：** 表单校验失败时是否使用该方法生成错误提示前缀，由 [`useFieldTextInError`](./form-props.md#usefieldtextinerror) prop 控制（默认 `true`）

## values

- **类型：** `Ref<FormValue>`

- **详情：** 当前表单值的响应式引用

## lastValuesProcessed

- **类型：** `Ref<FormValue>`

- **详情：** 对比模式下，处理后的待对比表单值

## formState

- **类型：** `FormState`

- **详情：** 内部使用的 formState 对象（`reactive`），通过 `provide('mForm')` 注入给子组件

## initialized

- **类型：** `Ref<boolean>`

- **详情：** 表单是否已经完成初始化

## changeRecords

- **类型：** `ShallowRef<ChangeRecord[]>`

- **详情：** 表单变更记录列表，提交成功或重置后会被清空

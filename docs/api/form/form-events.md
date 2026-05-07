# Form组件 events

## change

- **详情：** 表单中任何值发生变化

- **事件回调函数：** `(values: any, eventData: ContainerChangeEventData) => void`

  其中 `ContainerChangeEventData` 定义如下：

  ```ts
  interface ChangeRecord {
    propPath?: string;
    value: any;
  }

  interface ContainerChangeEventData {
    modifyKey?: string;
    changeRecords?: ChangeRecord[];
  }
  ```

## error

- **详情：** 表单校验失败时触发。回调收到的是 element-plus `validate` 返回的 `invalidFields` 结构（按字段名分组的校验失败项），而**不是** `Error` 实例

- **事件回调函数：** `(invalidFields: Record<string, { message: string; field: string }[]>) => void`

## field-input

- **详情：** 表单项 input 事件触发时由内部表单项向上派发，用于监听单个字段的输入

- **事件回调函数：** `(prop: string, value: any) => void`

## field-change

- **详情：** 表单项 change 事件触发时由内部表单项向上派发，用于监听单个字段的变更

- **事件回调函数：** 存在两种派发形式，监听时需注意区分：
  - 大多数表单项（如 `Tabs`、`useImport` 等）派发的是 `(prop: string, value: any) => void`；
  - 表格类容器（`useSortable`、`useTableColumns` 等）会**只派发整行/整批数据**：`(newData: any) => void`。

  如果只关心字段维度，可在回调里通过 `arguments.length === 1` 区分，或在表格类场景额外监听上层的 `change` 事件。

## update:stepActive

- **详情：** 当内部 step 容器切换步骤时触发。`Step.vue` 在点击步骤时派发的是 `index + 1`（`number`），文档类型保留 `string | number` 兼容父级初始传入

- **事件回调函数：** `(active: string | number) => void`

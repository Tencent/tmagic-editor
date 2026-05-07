# FormDialog组件 events

## close

- **详情：** 弹出关闭

- **事件回调函数：** `() => void`

## submit

- **详情：** 调用 [save()](./form-dialog-methods.md#save) 校验通过后触发

- **事件回调函数：** `(values: any, eventData: { changeRecords: ChangeRecord[] }) => void`

## error

- **详情：** 表单校验**不**通过时触发

- **事件回调函数：** `(invalidFields: Record<string, { message: string; field: string }[]>) => void`

  注意：与 `Form` 的 `error` 事件一致，回调收到的是 element-plus `validate` 返回的 `invalidFields` 结构，**不是** `Error` 实例。

## change

- **详情：** 表单中任何值发生变化

- **事件回调函数：** `(values: any, eventData: ContainerChangeEventData) => void`

  注意：第一个参数是**整张表单**的 `values`，并非单个字段的值。

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

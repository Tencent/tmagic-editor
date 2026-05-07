# Table组件 events

## sort-change

- **参数：**
  - `{ column, prop, order }` - 排序信息对象
    - `column: Object` - 排序的列配置
    - `prop: string` - 排序的列属性名
    - `order: 'ascending' | 'descending' | null` - 排序方式

- **说明：** 当表格的排序条件发生变化时触发

- **示例：**
  ```js
  const handleSortChange = ({ column, prop, order }) => {
    console.log('排序变化:', prop, order);
  };
  ```

## after-action

- **参数：**
  - `payload: { index: number }` - 触发动作所在行的索引

- **说明：** 表格行的编辑型动作（如 actions 中 `type: 'edit'` 的保存）执行结束后触发。

  注意：`ActionsColumn` 在 handler 返回值为「假值」（如 `undefined`/`null`/未返回）时同样会派发该事件；**仅当**返回值为对象且 `res.ret !== 0` 时才视为失败、不派发。如果业务需要严格在「业务接口成功」后再处理，应在 handler 内显式 `return { ret: 0 }` 并在监听处自行判断 `res.ret`。

- **示例：**
  ```js
  const handleAfterAction = ({ index }) => {
    console.log('操作完成，行索引:', index);
  };
  ```

## after-action-cancel

- **参数：**
  - `payload: { index: number }` - 触发动作所在行的索引

- **说明：** 表格行的编辑型动作被取消后触发

- **示例：**
  ```js
  const handleAfterActionCancel = ({ index }) => {
    console.log('操作取消，行索引:', index);
  };
  ```

## select

- **参数：**
  - `selection: Array<any>` - 当前选中的行数据数组
  - `row: any` - 刚刚被选中的行数据

- **说明：** 当用户手动勾选某一行时触发

- **示例：**
  ```js
  const handleSelect = (selection, row) => {
    console.log('选中行:', row);
    console.log('当前选中:', selection);
  };
  ```

## select-all

- **参数：**
  - `selection: Array<any>` - 当前选中的行数据数组

- **说明：** 当用户手动勾选全选 Checkbox 时触发

- **示例：**
  ```js
  const handleSelectAll = (selection) => {
    console.log('全选/取消全选:', selection.length);
  };
  ```

## selection-change

- **参数：**
  - `selection: Array<any>` - 当前选中的行数据数组

- **说明：** 当选择项发生变化时触发

- **示例：**
  ```js
  const handleSelectionChange = (selection) => {
    console.log('选中项变化:', selection);
  };
  ```

## expand-change

- **参数：**
  - `row: any` - 被展开/收起的行数据
  - `expandedRows: Array<any>` - 当前所有展开的行数据数组

- **说明：** 当用户展开或收起某一行时触发（用于可展开表格）

- **示例：**
  ```js
  const handleExpandChange = (row, expandedRows) => {
    console.log('展开状态变化:', row);
    console.log('当前展开行:', expandedRows);
  };
  ```

## cell-click

- **参数：**
  - `row: any` - 行数据
  - `column: Object` - 列配置
  - `cell: HTMLElement` - 单元格 DOM 元素
  - `event: Event` - 原生事件对象

- **说明：** 当某个单元格被点击时触发

- **示例：**
  ```js
  const handleCellClick = (row, column, cell, event) => {
    console.log('单元格点击:', row, column.property);
  };
  ```

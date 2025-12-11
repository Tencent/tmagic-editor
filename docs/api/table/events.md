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
  - `action: string` - 操作类型
  - `data: any` - 操作相关数据

- **说明：** 表格操作完成后触发

- **示例：**
  ```js
  const handleAfterAction = (action, data) => {
    console.log('操作完成:', action, data);
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

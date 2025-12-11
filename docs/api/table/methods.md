# Table组件 methods

## toggleRowSelection

- **参数：**
  - `row: any` - 要切换选中状态的行数据
  - `selected?: boolean` - 是否选中，不传则切换当前状态

- **说明：** 切换某一行的选中状态

- **示例：**
  ```js
  tableRef.value.toggleRowSelection(row, true); // 选中
  tableRef.value.toggleRowSelection(row, false); // 取消选中
  tableRef.value.toggleRowSelection(row); // 切换状态
  ```

## toggleRowExpansion

- **参数：**
  - `row: any` - 要展开/收起的行数据
  - `expanded?: boolean` - 是否展开，不传则切换当前状态

- **说明：** 切换某一行的展开状态（用于可展开表格）

- **示例：**
  ```js
  tableRef.value.toggleRowExpansion(row, true); // 展开
  tableRef.value.toggleRowExpansion(row, false); // 收起
  ```

## clearSelection

- **参数：** 无

- **说明：** 清空所有选中的行

- **示例：**
  ```js
  tableRef.value.clearSelection();
  ```

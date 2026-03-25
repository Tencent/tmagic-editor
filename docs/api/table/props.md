# Table组件 props

## data

- **详情：** 表格数据，数组格式
  
- **默认值：** `[]`

- **类型：** `Array<any>`

- **示例：**
  ```js
  [
    { id: 1, name: '张三', age: 20 },
    { id: 2, name: '李四', age: 25 }
  ]
  ```

## columns

- **详情：** 表格列配置
  
- **默认值：** `[]`

- **类型：** `Array<ColumnConfig>`

- **示例：**
  ```js
  [
    { prop: 'name', label: '姓名', width: 120 },
    { prop: 'age', label: '年龄', width: 80 }
  ]
  ```

## spanMethod

- **详情：** 合并行或列的计算方法
  
- **默认值：** `undefined`

- **类型：** `Function`

- **参数：**
  - `{ row, column, rowIndex, columnIndex }`
  
- **返回值：** `[rowspan, colspan]` 或 `{ rowspan, colspan }`

- **示例：**
  ```js
  ({ rowIndex, columnIndex }) => {
    if (rowIndex % 2 === 0) {
      if (columnIndex === 0) {
        return [1, 2];
      } else if (columnIndex === 1) {
        return [0, 0];
      }
    }
  }
  ```

## loading

- **详情：** 是否显示加载状态
  
- **默认值：** `false`

- **类型：** `boolean`

## showHeader

- **详情：** 是否显示表头
  
- **默认值：** `true`

- **类型：** `boolean`

## bodyHeight

- **详情：** Table 的最大高度。合法的值为数字或者单位为 px 的高度
  
- **默认值：** `undefined`

- **类型：** `string | number`

- **示例：**
  ```js
  bodyHeight: 400
  bodyHeight: '400px'
  ```

## emptyText

- **详情：** 空数据时显示的文本内容
  
- **默认值：** `'暂无数据'`

- **类型：** `string`

## defaultExpandAll

- **详情：** 是否默认展开所有行，当 Table 包含展开行存在或者为树形表格时有效
  
- **默认值：** `false`

- **类型：** `boolean`

## rowkeyName

- **详情：** 行数据的 Key，用来优化 Table 的渲染
  
- **默认值：** `'id'`

- **类型：** `string`

- **说明：** 在使用 reserve-selection 功能与显示树形数据时，该属性是必填的

## border

- **详情：** 是否显示边框
  
- **默认值：** `false`

- **类型：** `boolean`

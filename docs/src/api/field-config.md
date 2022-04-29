# 基础组件

## Cascader 级联选择器

当一个数据集合有清晰的层级结构时，可通过级联选择器逐级查看并选择。

### 基础用法

有两种触发子菜单的方式

<demo-block type="form" :config="[{
  type: 'cascader',
  name: 'cascader',
  text: '选项',
  placeholder: '请选择',
  options: [
    { 
      value: 'zhinan',
      label: '指南',
      children: [{
        value: 'shejiyuanze',
        label: '设计原则',
        children: [{
          value: 'yizhi',
          label: '一致'
        }, {
          value: 'fankui',
          label: '反馈'
        }]
      }, {
        value: 'daohang',
        label: '导航',
        children: [{
          value: 'cexiangdaohang',
          label: '侧向导航'
        }, {
          value: 'dingbudaohang',
          label: '顶部导航'
        }]
      }]
    },
    { 
      value: 'zujian',
      label: '组件',
      children: [{
        value: 'basic',
        label: 'Basic',
        children: [{
          value: 'layout',
          label: 'Layout 布局'
        }, {
          value: 'color',
          label: 'Color 色彩'
        }]
      }, {
        value: 'form',
        label: 'Form',
        children: [{
        value: 'checkbox',
        label: 'Checkbox 多选框'
        }, {
          value: 'input',
          label: 'Input 输入框'
        }]
      }]
    }
  ]
}]"><template #source><p>type为'cascader'</p></template></demo-block>

### 禁用选项

通过在数据源中设置 disabled 字段来声明该选项是禁用的

<demo-block type="form" :config="[{
  type: 'cascader',
  name: 'cascader',
  text: '选项',
  placeholder: '请选择',
  disabled: true,
  options: [
  ]
}, {
  type: 'cascader',
  name: 'cascader1',
  text: '选项2',
  placeholder: '请选择',
  options: [
    { 
      value: 'zhinan',
      label: '指南',
      disabled: true,
      children: [{
        value: 'shejiyuanze',
        label: '设计原则',
        children: [{
          value: 'yizhi',
          label: '一致'
        }, {
          value: 'fankui',
          label: '反馈'
        }]
      }, {
        value: 'daohang',
        label: '导航',
        children: [{
          value: 'cexiangdaohang',
          label: '侧向导航'
        }, {
          value: 'dingbudaohang',
          label: '顶部导航'
        }]
      }]
    },
    { 
      value: 'zujian',
      label: '组件',
      children: [{
        value: 'basic',
        label: 'Basic',
        disabled: true,
        children: [{
          value: 'layout',
          label: 'Layout 布局'
        }, {
          value: 'color',
          label: 'Color 色彩'
        }]
      }, {
        value: 'form',
        label: 'Form',
        children: [{
        value: 'checkbox',
        label: 'Checkbox 多选框'
        }, {
          value: 'input',
          disabled: true,
          label: 'Input 输入框'
        }]
      }]
    }
  ]
}]">
  <template #source>
    <p>
      本例中，options 指定的数组中的第一个元素含有 disabled: true 键值对，因此是禁用的。在默认情况下，Cascader 会检查数据中每一项的 disabled 字段是否为 true ，如果你的数据中表示禁用含义的字段名不为 disabled ，可以通过 disabled 属性来指定（详见下方 API 表格）。当然， value 、 label 和 children 这三个字段名也可以通过同样的方式指定。
    </p>
  </template>
</demo-block>
 
#### 多选

可通过 `multiple = true` 来开启多选模式

<demo-block type="form" :config="[{
  type: 'cascader',
  name: 'cascader',
  text: '选项',
  multiple: true,
  placeholder: '请选择',
  options: [
    { 
      value: 'zhinan',
      label: '指南',
      children: [{
        value: 'shejiyuanze',
        label: '设计原则',
        children: [{
          value: 'yizhi',
          label: '一致'
        }, {
          value: 'fankui',
          label: '反馈'
        }]
      }, {
        value: 'daohang',
        label: '导航',
        children: [{
          value: 'cexiangdaohang',
          label: '侧向导航'
        }, {
          value: 'dingbudaohang',
          label: '顶部导航'
        }]
      }]
    },
    { 
      value: 'zujian',
      label: '组件',
      children: [{
        value: 'basic',
        label: 'Basic',
        children: [{
          value: 'layout',
          label: 'Layout 布局'
        }, {
          value: 'color',
          label: 'Color 色彩'
        }]
      }, {
        value: 'form',
        label: 'Form',
        children: [{
        value: 'checkbox',
        label: 'Checkbox 多选框'
        }, {
          value: 'input',
          label: 'Input 输入框'
        }]
      }]
    }
  ]
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>

## Checkbox 多选框
一组备选项中进行多选

### 基础用法

单独使用可以表示两种状态之间的切换。

<demo-block type="form" :config="[{
  type: 'checkbox',
  name: 'checkbox',
  text: '选项'
}]">
  <template #source>
    <p>
      要使用 Checkbox 组件，只需要配置type: 'checkbox'，选中意味着变量的值为true。默认绑定变量的值会是 Boolean ，选中为 true 。
    </p>
  </template>
</demo-block>

### 禁用状态

多选框不可用状态。

<demo-block type="form" :config="[{
  type: 'checkbox',
  name: 'checkbox',
  text: '选项',
  disabled: () => true
}]">
  <template #source>
    <p>
     设置 disabled 属性即可，它接受一个 Boolean ， true 为禁用，也可以接受一个返回 Boolean 的函数。
    </p>
  </template>
</demo-block>

### 多选框组

适用于多个勾选框绑定到同一个数组的情景，通过是否勾选来表示这一组选项中选中的项。

<demo-block type="form" :config="[{
  type: 'checkbox-group',
  name: 'checkbox',
  text: '选项',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ]
}]">
  <template #source>
    <p>
      checkbox-group 元素能把多个 checkbox 管理为一组。
    </p>
  </template>
</demo-block>


### Checkbox Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)    | — | false   |
| activeValue  | 选中时的值	    | string / number / Function   | — | 1   |
| inactiveValue  | 没有选中时的值  | string / number / Function   | — | 0   |
| onChange  | 值变化时触发的函数  | [OnChangeHandler ](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |

### CheckboxGroup Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| onChange  | 值变化时触发的函数  | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |
| options  | 选项  | Array   | — | -   |

## ColorPicker 颜色选择器

用于颜色选择，支持多种格式。

### 基础用法

<demo-block type="form" :config="[{
  text: '颜色选择器',
  type: 'colorPicker',
  name: 'color',
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>


## DatePicker 日期选择器

用于选择或输入日期

### 基础用法

<demo-block type="form" :config="[{
  type: 'date',
  name: 'date',
  text: '日期选择器'
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>

### 禁用状态

<demo-block type="form" :config="[{
  type: 'date',
  name: 'date',
  text: '日期选择器',
  disabled: () => true
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>
###  日期格式

使用`format`指定输入框的格式；使用`valueFormat`指定绑定值的格式。

默认情况下，组件接受并返回`Date`对象。以下为可用的格式化字串，以 UTC 2017年1月2日 03:04:05 为例：

:::warning
请注意大小写
:::

| 格式 | 含义 | 备注 | 举例 |
|------|------|------|------|
| `yyyy` | 年 | | 2017 |
| `M`  | 月 | 不补0 | 1 |
| `MM` | 月 | | 01 |
| `W`  | 周 | 仅周选择器的 `format` 可用；不补0 | 1 |
| `WW` | 周 | 仅周选择器的 `format` 可用 | 01 |
| `d`  | 日 | 不补0 | 2 |
| `dd` | 日 | | 02 |
| `H`  | 小时 | 24小时制；不补0 | 3 |
| `HH` | 小时 | 24小时制 | 03 |
| `h`  | 小时 | 12小时制，须和 `A` 或 `a` 使用；不补0 | 3 |
| `hh` | 小时 | 12小时制，须和 `A` 或 `a` 使用 | 03 |
| `m`  | 分钟 | 不补0 | 4 |
| `mm` | 分钟 | | 04 |
| `s`  | 秒 | 不补0 | 5 |
| `ss` | 秒 | | 05 |
| `timestamp` | JS时间戳 | 组件绑定值为`number`类型 | 1483326245000 |
| `[MM]` | 不需要格式化字符 | 使用方括号标识不需要格式化的字符 (如  [A] [MM])  | MM |

<demo-block type="form" :config="[{
  type: 'date',
  name: 'date',
  text: '日期选择器',
  valueFormat: 'timestamp'
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>

### Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)    | — | false   |
| value-format | 可选，绑定值的格式。不指定则绑定值为 Date 对象 | string | 见[日期格式](#/zh-CN/component/date-picker#ri-qi-ge-shi) | — |
| onChange  | 值变化时触发的函数  | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |




## DateTimePicker 日期时间选择器

在同一个选择器里选择日期和时间

### 基础用法

<demo-block type="form" :config="[{
  type: 'datetime',
  name: 'dateTime',
  text: '日期时间选择器'
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>

### 禁用状态

<demo-block type="form" :config="[{
  type: 'datetime',
  name: 'dateTime',
  text: '日期时间选择器',
  disabled: () => true
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>

###  日期格式

使用`format`指定输入框的格式；使用`valueFormat`指定绑定值的格式。

默认情况下，组件接受并返回`Date`对象。以下为可用的格式化字串，以 UTC 2017年1月2日 03:04:05 为例：

:::warning
请注意大小写
:::

| 格式 | 含义 | 备注 | 举例 |
|------|------|------|------|
| `yyyy` | 年 | | 2017 |
| `M`  | 月 | 不补0 | 1 |
| `MM` | 月 | | 01 |
| `W`  | 周 | 仅周选择器的 `format` 可用；不补0 | 1 |
| `WW` | 周 | 仅周选择器的 `format` 可用 | 01 |
| `d`  | 日 | 不补0 | 2 |
| `dd` | 日 | | 02 |
| `H`  | 小时 | 24小时制；不补0 | 3 |
| `HH` | 小时 | 24小时制 | 03 |
| `h`  | 小时 | 12小时制，须和 `A` 或 `a` 使用；不补0 | 3 |
| `hh` | 小时 | 12小时制，须和 `A` 或 `a` 使用 | 03 |
| `m`  | 分钟 | 不补0 | 4 |
| `mm` | 分钟 | | 04 |
| `s`  | 秒 | 不补0 | 5 |
| `ss` | 秒 | | 05 |
| `A`  | AM/PM | 仅 `format` 可用，大写 | AM |
| `a`  | am/pm | 仅 `format` 可用，小写 | am |
| `timestamp` | JS时间戳 | 仅 `valueFormat` 可用；组件绑定值为`number`类型 | 1483326245000 |
| `[MM]` | 不需要格式化字符 | 使用方括号标识不需要格式化的字符 (如  [A] [MM])  | MM |

<demo-block type="form" :config="[{
  type: 'datetime',
  name: 'dateTime',
  text: '日期时间选择器',
  format: 'yyyy-MM-dd',
  valueFormat: 'timestamp'
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>

### Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)    | — | false   |
| format | 显示在输入框中的格式 | string | 见[日期格式](#/zh-CN/component/date-picker#ri-qi-ge-shi) | yyyy-MM-dd HH:mm:ss |
| value-format | 可选，绑定值的格式。不指定则绑定值为 Date 对象 | string | 见[日期格式](#/zh-CN/component/date-picker#ri-qi-ge-shi) | — |
| onChange  | 值变化时触发的函数  | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |

## Display 只读文本

用于显示，不可编辑

### TS 定义

```typescript
interface Display extends FormItem {
  type: 'display';
}
```

点击查看[FormItem](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)的定义

### 基础用法

<demo-block type="form" :config="[{
  type: 'display',
  name: 'display',
  text: '只读文本',
  defaultValue: 'display'
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>


### Input Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |

## Hidden 隐藏域

改值体现于最终提交的表单中，用于例如编辑记录的id这种场景中

### TS 定义

```typescript
interface Hidden extends FormItem {
  type: 'hidden';
}
```

点击查看[FormItem](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)的定义

### 基础用法

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


### Input Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |

## InputNumber 计数器

仅允许输入标准的数字值，可定义范围

### 基础用法

<demo-block type="form" :config="[{
  type: 'number',
  name: 'number',
  text: '计数器'
}]">
  <template #source>
    <p>
      type为'number'
    </p>
  </template>
</demo-block>

### 禁用状态

<demo-block type="form" :config="[{
  type: 'number',
  name: 'number',
  text: '计数器',
  disabled: () => true
}]">
  <template #source>
    <p>
      disabled 属性接受一个 Boolean，设置为 true 即可禁用整个组件，也可以接受一个返回 Boolean 的函数，如果你只需要控制数值在某一范围内，可以设置 min 属性和 max 属性，不设置 min 和 max 时，最小值为 0。
    </p>
  </template>
</demo-block>

### 步数

允许定义递增递减的步数控制

<demo-block type="form" :config="[{
  type: 'number',
  name: 'number',
  text: '计数器',
  step: 10
}]">
  <template #source>
    <p>
      设置 step 属性可以控制步长，接受一个 Number 。
    </p>
  </template>
</demo-block>


### Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|----------|-------------- |----------|--------------------------------  |-------- |
| name | 绑定值 | string | — | — |
| placeholder  | 输入框占位文本   | string |       —        |      —   |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| min      | 设置计数器允许的最小值 | number | — | -Infinity |
| max      | 设置计数器允许的最大值 | number | — | Infinity |
| step     | 计数器步长           | number   | — | 1 |
| onChange  | 值变化时触发的函数  | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |

## Input 输入框

通过鼠标或键盘输入字符

### 基础用法

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框'
}]">
  <template #source>
    <p>
      Input输入框的type为'text', 是type的默认值，所以可以不配置
    </p>
  </template>
</demo-block>


### 禁用状态

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  disabled: () => true
}]">
  <template #source>
    <p>
      通过 disabled 属性指定是否禁用 input 组件
    </p>
  </template>
</demo-block>

### 复合型输入框

后置内容

<demo-block type="form" :config="[{
  name: 'text',
  text: '重量',
  append: '公斤'
}]">
  <template #source>
    <p>
      可以通过配置append来增加一个后置内容。
    </p>
  </template>
</demo-block>

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  append: {
    type: 'button',
    text: '操作',
    handler: (vm) => {
      vm.$message(vm.mForm.values.text);
    }
  }
}]">
  <template #source>
    <p>
      可以通过配置append来增加一个后置按钮。
    </p>
  </template>
</demo-block>

### 过滤内容

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  filter: 'number'
}]">
  <template #source>
    <p>
      设置filter为'number'，可以将值转换成数值，也可以配置一个函数来自由转换。
    </p>
  </template>
</demo-block>

### 去掉首尾空格

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  trim: true
}]">
  <template #source>
    <p>
      设置trim为true'，可以去掉首尾空格。
    </p>
  </template>
</demo-block>

### 显示详情

<demo-block type="form" :config="[{
  name: 'text',
  text: '输入框',
  tooltip: true
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>

### Input Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| placeholder  | 输入框占位文本   | string |       —        |      —   |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| tooltip  | 输入时显示内容    | boolean   | — | false   |
| placeholder   | 输入框占位文本   | string          | — | — |
| trim  | 是否去掉首尾空格  | boolean   | — | false  |
| filter  | 过滤值  | string / Function   | number | -  |
| onChange  | 值变化时触发的函数  | [OnChangeHandler ](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |
| append  | 后置内容  | string / Object   | — | -   |

### append Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| type | 内容类型 | string | button | — |
| text     | 文本内容   | string |       —        |      —   |
| handler  | 点击操作    | Function   | — | -   |

## Link 链接

用于显示，不可编辑

### TS 定义

```typescript
interface Link extends FormItem {
  type: 'link';
  href?: string | typeof LinkHrefFunction;
  css?: {
    [key: string]: string | number;
  };
  disabledCss?: {
    [key: string]: string | number;
  };
  formTitle?: string;
  formWidth?: number | string;
  displayText?: string | typeof LinkDisplayTextFunction;
  form: FormConfig | typeof LinkFormFunction;
}
```

点击查看[FormItem](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)的定义

### 基础用法

<demo-block type="form" :config="[{
  type: 'link',
  name: 'link',
  text: '链接',
  href: 'https://tencent.github.io/tmagic-editor/playground/index.html#/'
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>

### 打开表单

<demo-block type="form" :config="[{
  type: 'link',
  name: 'link',
  text: '链接',
  form: [{
    name: 'text',
    text: 'input'
  }]
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>


### Input Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |

## Radio 单选框

在一组备选项中进行单选

### TS 定义

```typescript
interface RedioGroup extends FormItem {
  type: 'redioGroup';
  options: {
    value: any;
    text: string;
  }[];
}
```

点击查看[FormItem](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)的定义

### 基础用法

由于选项默认可见，不宜过多，若选项过多，建议使用 Select 选择器。

<demo-block type="form" :config="[{
  type: 'radio-group',
  name: 'radio',
  text: '选项',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ]
}]">
  <template #source>
    <p>
      要使用 Radio 组件，只需要配置type: 'radio-group'。
    </p>
  </template>
</demo-block>

### 禁用状态

单选框不可用的状态。

<demo-block type="form" :config="[{
  type: 'radio-group',
  name: 'radio',
  text: '选项',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ],
  disabled: () => true
}]">
  <template #source>
    <p>
      只要在配置中设置 disabled 属性即可，它接受一个 Boolean ， true 为禁用，也可以接受一个返回 Boolean 的函数。
    </p>
  </template>
</demo-block>

### RadioGroup Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)    | — | false   |
| options  | 选项  | Array   | — | -   |
| onChange  | 值变化时触发的函数  | [OnChangeHandler ](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)    | — | -   |

## Select 选择器

当选项过多时，使用下拉菜单展示并选择内容。

### 基础用法

适用广泛的基础单选

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ]
}]">
  <template #source>
    <p>
      type为'select'
    </p>
  </template>
</demo-block>

### 有禁用选项

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2, disabled: true }
  ]
}]">
  <template #source>
    <p>
      在 opitons 选项配置中，设定 disabled 值为 true，即可禁用该选项
    </p>
  </template>
</demo-block>

### 禁用状态

选择器不可用状态

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  disabled: true,
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ]
}]">
  <template #source>
    <p>
      为 el-select 设置 disabled 属性，则整个选择器不可用
    </p>
  </template>
</demo-block>

### 基础多选

适用性较广的基础多选，用 Tag 展示已选项

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  multiple: true,
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 },
    { text: '选项3', value: 3 }
  ]
}]"></demo-block>

### 分组

备选项进行分组展示

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  group: true,
  options: [
    {
      label: 'group1',
      options: [
        { text: '选项1', value: 1 },
        { text: '选项2', value: 2 },
        { text: '选项3', value: 3 }
      ],
      disabled: true
    }, {
      label: 'group2',
      options: [
        { text: '选项4', value: 4 },
        { text: '选项5', value: 5 },
        { text: '选项6', value: 6 }
      ]
    }
  ]
}]">
  <template #source>
    <p>
      配置group为true
    </p>
  </template>
</demo-block>

### 创建条目

可以创建并选中选项中不存在的条目

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  allowCreate: true,
  options: [
    { text: '选项1', value: 1 },
    { text: '选项2', value: 2 }
  ]
}]"></demo-block>

### 远程选项

通过接口请求获取选项列表

<demo-block type="form" :config="[{
  type: 'select',
  name: 'select',
  text: '选项',
  placeholder: '请选择',
  remote: true,
  option: {
    url: 'xxx',
    root: 'data',
    method: 'post',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: { query: '' },
    json: true,
    text: option => `${option.name}`,
    value: option => `${option.id}`,
  }
}]">
  <template #source>
    <p>
      配置remote为true，然后配置option，而不是options
    </p>
  </template>
</demo-block>

:::tip
如果 Select 的绑定值为对象类型，请务必指定 valueKey 作为它的唯一性标识。
:::

### Select Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| name | 绑定值 | string | — | — |
| placeholder  | 输入框占位文本   | string |       —        |      —   |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| multiple | 是否多选 | boolean | — | false |
| valueKey | 作为 value 唯一标识的键名，绑定值为对象类型时必填 | string | — | value |
| allowCreate | 是否允许用户创建新条目 | boolean | — | false |
| remote | 是否为远程搜索 | boolean | — | false |
| group | 是否选择分组 | boolean | — | false |
| onChange  | 值变化时触发的函数  | [OnChangeHandler ](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |
| options  | 选项  | Array   | — | -   |
| option  | 选项  | Object   | — | -   |

### options item
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| text |  | 选项的标签 | string/number/object | — | — |
| value | 选项的值	 | string | — | — |
| disabled  | 是否禁用    | boolean | — | false   |
| label |  string | — | — | — |
| options | Array | — | — | — |

### option
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| url | string | — | — | — |
| root | string | — | — | — |
| text | string / Function | — | — | — |
| value | string / Function | — | — | — |

## Switch 开关

表示两种相互对立的状态间的切换，多用于触发「开/关」。

### 基本用法

<demo-block type="form" :config="[{
  type: 'switch',
  name: 'switch',
  text: '开关'
}]"></demo-block>

### 扩展的 value 类型

<demo-block type="form" :config="[{
  type: 'switch',
  name: 'switch',
  text: '开关',
  activeValue: 'on',
  inactiveValue: 'off'
}]">
  <template #source>
    <p>
      设置 activeValue 和 inactiveValue 属性，接受 Boolean , String 或 Number 类型的值。
    </p>
  </template>
</demo-block>

### 禁用状态

<demo-block type="form" :config="[{
  type: 'switch',
  name: 'switch',
  text: '开关',
  disabled: true
}]">
  <template #source>
    <p>
      设置 disabled 属性，接受一个 Boolean，设置 true 即可禁用。
    </p>
  </template>
</demo-block>


### Attributes

| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| disabled  | 是否禁用    | boolean / [Function](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| active-value  | switch 打开时的值    | boolean / string / number | — | true |
| inactive-value  | switch 关闭时的值    | boolean / string / number | — | false |

## Textarea 文本域

### 基础用法

<demo-block type="form" :config="[{
  type: 'textarea',
  name: 'textarea',
  text: '文本域'
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>

### 禁用状态

<demo-block type="form" :config="[{
  type: 'textarea',
  name: 'textarea',
  text: '文本域',
  disabled: () => true
}]">
  <template #source>
    <p>
      通过 disabled 属性指定是否禁用 input 组件
    </p>
  </template>
</demo-block>

### Input Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| name | 绑定值 | string | — | — |
| placeholder  | 输入框占位文本   | string |       —        |      —   |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |
| placeholder   | 输入框占位文本   | string          | — | — |
| trim  | 是否去掉首尾空格  | boolean   | — | false  |
| filter  | 过滤值  | string / Function   | number | -  |
| onChange  | 值变化时触发的函数  | [OnChangeHandler ](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | -   |

## TimePicker 时间选择器

 用于选择或输入日期

### 基础用法

<demo-block type="form" :config="[{
  type: 'time',
  name: 'time',
  text: '时间选择器'
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>

### 禁用状态

<demo-block type="form" :config="[{
  type: 'time',
  name: 'time',
  text: '时间选择器',
  disabled: () => true
}]">
  <template #source>
    <p>
      在开启多选模式后，默认情况下会展示所有已选中的选项的Tag
    </p>
  </template>
</demo-block>


### Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| name | 绑定值 | string | — | — |
| placeholder  | 输入框占位文本   | string |       —        |      —   |
| text     | 表单标签   | string |       —        |      —   |
| disabled  | 是否禁用    | boolean / [Function](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)   | — | false   |

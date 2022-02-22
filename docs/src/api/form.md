# m-form

## props

### initValues

- **类型：** Object
  
- **默认值：** {}
  
- **详情：**
  
  表单初始化值

- **示例：**

```js
{
  text: 'text',
  multiple: true,
}
```

:::tip
initValues应该是与config一一对应的，如果initValues中的key没有出现在config的name中，那么这个值将被丢掉
:::

### config

- **类型：** [FormConfig](https://github.com/Tencent/tmagic-editor/blob/master/packages/form/src/schema.ts)
  
- **默认值：** []
  
- **详情：**
  
  表单配置

- **示例：**

```js
[
  {
    name: 'text',
    text: '文本',
  },
  {
    name: 'multiple',
    text: '多行文本',
    type: 'switch',
  },
]
```

### labelWidth

- **类型：** string | number
  
- **默认值：** '200px'
  
- **详情：**
  
  表单域标签的宽度，例如 '50px'。 作为 Form 直接子元素的 form-item 会继承该值。 支持 auto

### disabled

- **类型：** boolean
  
- **默认值：** false
  
- **详情：**
  
  是否禁用该表单内的所有组件。 若设置为 true，则表单内组件上的 disabled 属性不再生效

- **示例：**

### height

- **类型：** string
  
- **默认值：** 'auto'
  
- **详情：**
  
  表单高度

### stepActive

- **类型：** string | number
  
- **默认值：** 1
  
- **详情：**
  
  使用了 step 组件时，默认的选中的步骤数

### size

- **类型：**  'medium' | 'small' | 'mini'
  
- **默认值：** 'small'
  
- **详情：**
  
  用于控制该表单内组件的尺寸

### inline

- **类型：** boolean
  
- **默认值：** false
  
- **详情：**
  
  行内表单模式	

### labelPosition

- **类型：** 'right' | 'left' | 'top'
  
- **默认值：** 'right'
  
- **详情：**
  
  表单域标签的位置， 如果值为 left 或者 right 时，则需要设置 label-width

### keyProp

- **类型：** string
  
- **默认值：** '__key'
  
- **详情：**
  
  作为表单项的组件实例的key

- **示例：**

```js
[
  {
    name: 'text',
    type: 'text',
    text: '文本',
    __key: 123,
  }
]
```

## instance methods

### submitForm

- **参数：**

  - `{boolean}` native

- **返回：**

  - `{Object}` 整个表单的值

- **用法：**

  提交表单，获取表单的值

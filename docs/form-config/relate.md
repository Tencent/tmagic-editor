# 联动

## 显隐

<demo-block type="form" :config="[{
  name: 'switch',
  text: '显示text',
  type: 'switch'
}, {
  name: 'text2',
  text: '配置2',
  display: (mForm, { model }) => model.switch
}]"></demo-block>

## 输入关联

<demo-block type="form" :config="[{
  name: 'firstName',
  text: '名',
  onChange: (mForm, v, { model }) => {
      model.fullName = `${model.lastName}${model.firstName}`
    },
  defaultValue: '三'
}, {
  name: 'lastName',
  text: '姓',
  onChange: (mForm, v, { model }) => {
      model.fullName = `${model.lastName}${model.firstName}`
    },
  defaultValue: '张'
}, {
  name: 'fullName',
  text: '姓名',
  type: 'display',
  defaultValue: '张三'
}]"></demo-block>


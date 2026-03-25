# ColorPicker 颜色选择器

用于颜色选择，支持多种颜色格式，包括透明度设置。

## 基础用法

<demo-block type="form" :config="[{
  text: '颜色选择器',
  type: 'colorPicker',
  name: 'color'
}]">
  <template #source>
    <p>
      type 为 'colorPicker'，默认支持透明度选择（showAlpha: true）。
    </p>
  </template>
</demo-block>

## 禁用状态

<demo-block type="form" :config="[{
  text: '颜色选择器',
  type: 'colorPicker',
  name: 'color',
  disabled: true
}]">
  <template #source>
    <p>
      设置 disabled 属性可禁用颜色选择器。
    </p>
  </template>
</demo-block>

## 设置默认值

<demo-block type="form" :config="[{
  text: '颜色选择器',
  type: 'colorPicker',
  name: 'color',
  defaultValue: '#409EFF'
}]">
  <template #source>
    <p>
      通过 defaultValue 设置默认颜色值。
    </p>
  </template>
</demo-block>

## 带透明度的颜色

颜色选择器默认开启透明度选择，返回值为 rgba 格式。

<demo-block type="form" :config="[{
  text: '颜色选择器',
  type: 'colorPicker',
  name: 'color',
  defaultValue: 'rgba(64, 158, 255, 0.5)'
}]">
  <template #source>
    <p>
      支持 rgba 格式的颜色值，可以设置透明度。
    </p>
  </template>
</demo-block>

## ColorPicker Attributes

| 参数 | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| name | 绑定值 | string | — | — |
| text | 表单标签 | string | — | — |
| disabled | 是否禁用 | boolean / [FilterFunction](https://github.com/Tencent/tmagic-editor/blob/master/packages/form-schema/src/base.ts) | — | false |
| defaultValue | 默认颜色值 | string | — | — |
| onChange | 值变化时触发的函数 | [OnChangeHandler](https://github.com/Tencent/tmagic-editor/blob/master/packages/form-schema/src/base.ts) | — | — |

## 颜色格式说明

支持以下颜色格式：

| 格式 | 示例 | 说明 |
|------|------|------|
| HEX | #409EFF | 十六进制颜色值 |
| RGB | rgb(64, 158, 255) | RGB 颜色值 |
| RGBA | rgba(64, 158, 255, 0.5) | 带透明度的 RGBA 颜色值 |
| HSL | hsl(210, 100%, 63%) | HSL 颜色值 |
| HSLA | hsla(210, 100%, 63%, 0.5) | 带透明度的 HSLA 颜色值 |

# ColorPicker 颜色选择器

用于颜色选择，支持多种格式。

## 基础用法

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

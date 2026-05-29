# 表单对比
tmagic-form可以支持两个版本的表单值对比，如果有容器嵌套，将在tab标签页展示对应tab下存在的差异数，便于在复杂嵌套表单场景下直观的看到差异情况

## 使用方法
在初始化表单时，开启对比模式 `is-compare`，并传入当前版本的表单值（`init-values`）、上一版本的表单值（`last-values`）以及表单配置，具体可参见[Form Playground](https://tencent.github.io/tmagic-editor/playground/index.html#/form)的demo演示。

```html
<m-form
  :config="config"
  :is-compare="true"
  :init-values="curValues"
  :last-values="lastValues"
></m-form>
```

相关属性详见 Form 组件 props：

- [`isCompare`](/api/form/form-props.html#iscompare)：是否开启对比模式；
- [`lastValues`](/api/form/form-props.html#lastvalues)：需对比的上一版本表单值；
- [`showDiff`](/api/form/form-props.html#showdiff)：自定义「是否展示对比内容」的判断函数，用于规避语义相等但结构不同导致的误判。

## 对比模式下的字段行为
对比模式下，表单仅做只读展示：增删、复制、排序、导入、编辑等写操作按钮会被隐藏。对于由列表或嵌套子表单组成的复合字段（如 `event-select`、`code-select`、`code-select-col`），表单会按索引对齐前后值，逐项展示新增 / 删除 / 修改的高亮差异，而不会渲染出两套独立组件。

## 应用场景
编辑器的[历史记录面板](/guide/advanced/history-list.md)即基于该能力，对历史步骤的前后值做表单形式的差异对比。

## 效果展示
<img src="https://vip.image.video.qpic.cn/vupload/20230301/c626071677661813135.png" alt="表单对比"/>


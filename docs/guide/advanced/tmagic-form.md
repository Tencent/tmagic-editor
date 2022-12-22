# @tmagic/form

tmagic-editor的表单配置，核心就是使用了 @tmagic/form 来作为渲染器。@tmagic/form 是一个 npm 包，可以安装它，在你想使用的地方单独使用。

@tmagic/form 接受一个表单配置，详细配置可参考[表单 api](../../api/form/form-props.md)。

## 安装

```bash
# 最新稳定版
$ npm install @tmagic/form
```

```bash
$ npm install @tmagic/element-plus-adapter @tmagic/design element-plus -S
```

## 快速上手

本节将介绍如何在项目中使用 @tmagic/form

### 引入 @tmagic/form

MagicForm 使用了 element-ui 库

在 main.js 中写入以下内容：

```javascript
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

import TMagicDesign from '@tmagic/design';
import MagicElementPlusAdapter from '@tmagic/element-plus-adapter';
import MagicForm from '@tmagic/form';

import App from './App.vue';

const app = createApp(App);
app.use(ElementPlus, {
  locale: zhCn,
});
app.use(TMagicDesign, MagicElementPlusAdapter);
app.use(MagicForm);
app.mount("#app");
```


以上代码便完成了 @tmagic/form 的引入。需要注意的是，ElementUI 的样式文件需要单独引入。

在 App.Vue 中写入以下内容：

```html
<m-form :config="config" :init-values="initValue"></m-form>

<script>
  export default {
    data() {
      return {
        config: [
          {
            text: "文本",
            name: "text",
          },
          {
            type: "number",
            text: "计数器",
            name: "number",
          },
          {
            type: "row",
            items: [
              {
                type: "date",
                text: "日期",
                name: "date",
              },
              {
                type: "checkbox",
                text: "多选框",
                name: "checkbox",
              },
            ],
          },
          {
            type: "fieldset",
            name: "fieldset",
            legend: "分组",
            items: [
              {
                type: "select",
                text: "下拉选项",
                name: "select",
                options: [
                  { text: "选项1", value: 1 },
                  { text: "选项2", value: 2 },
                ],
              },
            ],
          },
        ],
        initValue: {
          text: "文本",
          number: 10,
          fieldset: {
            select: 1,
          },
        },
      };
    },
  };
</script>
```

### 开始使用

至此，一个基于 Vue 和 @tmagic/form 的开发环境已经搭建完毕，现在就可以编写代码了。

### 示例

<demo-block type="form" :config="[{
  text: '文本',
  name: 'text'
}, {
  type: 'number',
  text: '计数器',
  name: 'number'
}, {
  type: 'row',
  items: [{
    type: 'date',
    text: '日期',
    name: 'date'
  }, {
    type: 'checkbox',
    text: '多选框',
    name: 'checkbox'
  }]
}, {
  type: 'fieldset',
  name: 'fieldset',
  legend: '分组',
  items: [{
    type: 'select',
    text: '下拉选项',
    name: 'select',
    options: [
      { text: '选项1', value: 1 },
      { text: '选项2', value: 2 }
    ]
  }]
}]">
</demo-block>

# 快速开始

tmagic-editor的编辑器我们已经封装成一个 npm 包，可以直接安装使用。编辑器是使用 vue3 开发的，但使用编辑器的业务可以不限框架，可以用 vue2、react 等开发业务组件。

## 安装

node.js > 14

可以通过[Vite](https://github.com/vitejs/vite) 或 [Vue CLI](https://cli.vuejs.org/zh/)快速创建项目。

推荐使用 npm 的方式安装，它能更好地和 [webpack](https://webpack.js.org/) 打包工具配合使用。

> 使用Vue CLI生成的项目需要在vue.config.js中加上配置：transpileDependencies: [/@tmagic/]

```bash
# 最新稳定版
$ npm install @tmagic/editor@latest -S
```

editor 中组件自定义属性配置由[@tmagic/form](./advanced/magic-form.md)提供，需要添加@tmagic/form 依赖；editor 与 form 中使用到的 UI 组件都由 [element-plus](https://element-plus.org/)提供，需要添加 element-plus 依赖。

```bash
$ npm install @tmagic/form@latest element-plus -S
```

editor 中还包含了[monaco-editor](https://github.com/microsoft/monaco-editor)，可以参考 monaco-editor 的[配置指引](https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md)。

## 快速上手

### 引入 @tmagic/editor

在 main.js 中写入以下内容：

```js
import { createApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";

import MagicEditor from "@tmagic/editor";
import MagicForm from "@tmagic/form";

import App from "./App.vue";

import "element-plus/dist/index.css";
import "@tmagic/editor/dist/style.css";
import "@tmagic/form/dist/style.css";

const app = createApp(App);
app.use(ElementPlus, {
  locale: zhCn,
});
app.use(MagicEditor);
app.use(MagicForm);
app.mount("#app");
```

以上代码便完成了 @tmagic/editor 的引入。需要注意的是，样式文件需要单独引入。

### 使用 m-editor 组件

在 App.vue 中写入以下内容：

```html
<template>
  <m-editor
    v-model="data"
    :menu="menu"
    :runtime-url="runtimeUrl"
    :props-configs="propsConfigs"
    :props-values="propsValues"
    :component-group-list="componentGroupList"
  >
  </m-editor>
</template>

<script>
  import { defineComponent, ref } from "vue";

  export default defineComponent({
    name: "App",

    setup() {
      return {
        menu: ref({
          left: [
            // 顶部左侧菜单按钮
          ],
          center: [
            // 顶部中间菜单按钮
          ],
          right: [
            // 顶部右侧菜单按钮
          ],
        }),

        data: ref({
          // 初始化页面数据
        }),

        runtimeUrl: "/runtime/vue3/playground.html",
        propsConfigs: [
          // 组件属性列表
        ],
        propsValues: [
          // 组件默认值
        ],

        componentGroupList: ref([
          // 组件列表
        ]),
      };
    },
  });
</script>

<style lang="scss">
  #app {
    width: 100%;
    height: 100%;
    display: flex;
  }

  .m-editor {
    flex: 1;
    height: 100%;
  }
</style>
```

关于 [@tmagic/editor](https://www.npmjs.com/package/@tmagic/editor) 组件，更多的属性配置详情请参考[编辑器 API](../api/editor/editor.md)。

其中，**有四个需要注意的属性配置项**：`runtimeUrl` `values` `configs` `componentGroupList`。这是能让我们的编辑器正常运行的关键。

### runtimeUrl

该配置涉及到 [runtime 概念](conception.html#runtime)，tmagic-editor编辑器中心的模拟器画布，是一个 iframe（这里的 `runtimeUrl` 配置的，就是你提供的 iframe 的 url），其中渲染了一个 runtime，用来响应编辑器中的组件增删改等操作。

::: tip 如何快速得到一个 runtime
如果要快速启动，可以使用[tmagic-editor项目源码](https://github.com/Tencent/tmagic-editor)中的 runtime，在提供的三个框架 vue2/vue3/react runtime 目录中选择一个，执行 `npm run build` 得到产物，并将产物放到你的项目中，此处的 runtimeUrl 指向你放置 playground.html 的路径。
:::

### componentGroupList

`componentGroupList` 是指定左侧组件库内容的配置。此处定义了在编辑器组件库中有什么组件。在添加的时候通过组件 `type` 来确定 runtime 中要渲染什么组件。可以参考 [componentGroupList 配置](../api/editor/editor.html#componentgrouplist)。

### propsConfigs/propsValues

`propsConfigs` `propsValues` 和 `componentGroupList` 中声明的组件是一一对应的，通过 `type` 来识别属于哪个组件，该配置涉及的内容，就是组件的表单配置描述，在[组件开发中](../component/introduction.html#组件开发)会通过 formConfig 配置来声明这份内容。

`configs` 既可以通过 hardcode 方式写上每个组件的表单配置，也可以通过组件打包方式得到对应内容，然后通过异步加载来载入。比如：

```javascript
setup() {
  asyncLoadJs(`/runtime/vue3/assets/config.js`).then(() => {
    propsConfigs.value = window.magicPresetConfigs;
  });
  asyncLoadJs(`/runtime/vue3/assets/value.js`).then(() => {
    propsValues.value = window.magicPresetValues;
  });
}
```

::: tip 如何快速得到一个 configs/values
上述的 runtime 产物中，assets 目录中即包含一个 configs 文件，在你的项目组件初始化之后，异步加载它。并如上面代码中，赋值给 configs/values 即可。
:::

### 更多

通过上述步骤，可以快速得到一个初始化的简单编辑器。在编辑器中，对于使用者来说，需要了解的核心内容：

- [tmagic-editor编辑器的基础概念](conception)
- [编辑器的产物 DSL](../page/introduction.html#编辑器产物-dsl)
- [runtime 的概念](../page/introduction.html)
- [如何实现一个 runtime](../page/advanced.html)

除了上述内容外，文档的其他章节中，也会更深入的描述整个tmagic-editor的设计理念和实现细节。同时你也可以查看我们的[项目源码](https://github.com/Tencent/tmagic-editor)，从源码提供的 playground 和 runtime 示例来开发和理解tmagic-editor。

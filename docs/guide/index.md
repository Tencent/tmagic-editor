# 快速开始

tmagic-editor的编辑器我们已经封装成一个 npm 包，可以直接安装使用。编辑器是使用 vue3 开发的(仅支持vue3)，但使用编辑器的业务(runtime)可以不限框架，可以用 vue2、react 等开发业务组件。

## 安装

node.js >= 18

可以通过[Vite](https://cn.vitejs.dev/) 或 [Vue CLI](https://cli.vuejs.org/zh/)快速创建项目。

> 使用Vue CLI生成的项目需要在vue.config.js中加上配置：transpileDependencies: [/@tmagic/]

```bash
$ npm install @tmagic/editor @tmagic/form -S
```

由于在实际应用中项目常常会用到例如[element-plus](https://element-plus.org/)、[tdesign-vue-next](https://tdesign.tencent.com/vue-next/overview)等UI组件库。为了能让使用者能够选择不同UI库，[@tmagic/editor](https://github.com/Tencent/tmagic-editor/tree/master/packages/editor)将其中使用到的UI组件封装到[@tmagic/design](https://github.com/Tencent/tmagic-editor/tree/master/packages/design)中，然后通过不同的adapter来指定使用具体的对应的UI库，我们提供了[@tmagic/element-plus-adapter](https://github.com/Tencent/tmagic-editor/tree/master/packages/element-plus-adapter)来支持[element-plus](https://element-plus.org/)，所以还需要安装相关的依赖。

```bash
$ npm install @tmagic/element-plus-adapter @tmagic/design element-plus -S
```

editor 中还包含了[monaco-editor](https://microsoft.github.io/monaco-editor/)，所以还需安装monaco-editor，可以参考 monaco-editor 的[配置指引](https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md)。

```bash
$ npm install monaco-editor -S
```

## 快速上手

## 引入 @tmagic/editor

在 main.js 中写入以下内容：

```js
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

import TMagicDesign from '@tmagic/design';
import MagicEditor from '@tmagic/editor';
import MagicElementPlusAdapter from '@tmagic/element-plus-adapter';
import MagicForm from '@tmagic/form';

import App from './App.vue';

import 'element-plus/dist/index.css';
import '@tmagic/editor/dist/style.css';
import '@tmagic/form/dist/style.css';

const app = createApp(App);
app.use(ElementPlus, {
  locale: zhCn,
});
app.use(TMagicDesign, MagicElementPlusAdapter);
app.use(MagicEditor);
app.use(MagicForm);
app.mount("#app");
```

以上代码便完成了 @tmagic/editor 的引入。需要注意的是，样式文件需要单独引入。

可以参考我们提供的[Playground](https://github.com/Tencent/tmagic-editor/blob/master/playground/src/main.ts)示例实现代码

## 使用 m-editor 组件

在 App.vue 中写入以下内容：

```html
<template>
  <m-editor
    v-model="dsl"
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

        dsl: ref({
          // 初始化页面数据
        }),

        runtimeUrl: "/runtime/vue3/playground/index.html",

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
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

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

关于 [@tmagic/editor](https://github.com/Tencent/tmagic-editor/tree/master/packages/editor) 组件，更多的属性配置详情请参考[编辑器 API](../api/editor/props.md)。

其中，**有四个需要注意的属性配置项**：`runtimeUrl` `values` `configs` `componentGroupList`。这是能让我们的编辑器正常运行的关键。

:::tip
如果出现```Preprocessor dependency "sass" not found. Did you install it?```，那么需要install sass

```bash
npm install sass -D
```
:::

:::tip
如果是使用vite构建工具，如果出现 ```Uncaught ReferenceError: global is not defined```，那么需要再vite.config.js中添加如下配置：

```js
{
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
}
```
:::

## runtimeUrl

该配置涉及到 [runtime 概念](runtime.md)，tmagic-editor编辑器中心的模拟器画布，是一个 iframe（这里的 `runtimeUrl` 配置的，就是你提供的 iframe 的 url），其中渲染了一个 runtime，用来响应编辑器中的组件增删改等操作。

## componentGroupList

`componentGroupList` 是指定左侧组件库内容的配置。此处定义了在编辑器组件库中有什么组件。在添加的时候通过组件 `type` 来确定 runtime 中要渲染什么组件。可以参考 [componentGroupList 配置](../api/editor/props.html#componentgrouplist)。

## propsConfigs/propsValues

`propsConfigs` `propsValues` 和 `componentGroupList` 中声明的组件是一一对应的，通过 `type` 来识别属于哪个组件，该配置涉及的内容，就是组件的表单配置描述，在[组件开发中](./component.md)会通过 formConfig 配置来声明这份内容。

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
上述的 runtime 产物中，dist 目录中即包含一个 entry 文件夹，在你的项目组件初始化之后，分别异步加载里面的config/index.umd.js、value/index.umd.js。并如上面代码中，赋值给 configs/values 即可。
:::

## 更多

通过上述步骤，可以快速得到一个初始化的简单编辑器。

除了上述内容外，文档的其他章节中，也会更深入的描述整个tmagic-editor的设计理念和实现细节。同时你也可以查看我们的[项目源码](https://github.com/Tencent/tmagic-editor)，从源码提供的 playground 和 runtime 示例来开发和理解tmagic-editor。

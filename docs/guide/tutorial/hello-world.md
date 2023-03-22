# 1.Hello World

## 环境准备

使用[@vue/cli](https://cli.vuejs.org/zh/guide/installation.html)初始化项目

```bash
npm install -g @vue/cli
```

> 由于大部分新的webpack插件都已不支持webpack5以下，建议使用@vue/cli@5.0.0及以上版本
> 如现有项目是webpack4的，需要注意安装node_module时使用对应的版本
> 使用@vue/cli@4的，需要在vue.config.ts 中加入 transpileDependencies: [/@tmagic/]

::: tip
虽然这里使用@vue/cli作为示例教程，但是更推荐使用[vite](https://github.com/vitejs/vite)
:::

::: warning
:warning: 如用node 16安装不成功，可以尝试用node 14
:::

## 创建项目

[关于@vue/cli的详细教程可以查看官方文档](https://cli.vuejs.org/zh/guide/installation.html)

```bash
vue create hello-world

cd hello-world
```

得到项目目录如下

```
.
└─hello-world
   └─ public
   └─ test
   └─ src
      ├─ APP.vue
      ├─ main.ts
      └─ components
         └─ HelloWorld.vue
   └─ vue.config.js
   ...
```

> src/components在本次教程中暂时没有用到，可以删掉；

## 添加依赖

```bash
npm install --save @tmagic/editor @tmagic/form @tmagic/stage @tmagic/design @tmagic/element-plus-adapter element-plus
```

## 注册组件

将以下代码覆盖到src/main.ts中

```ts
import 'element-plus/dist/index.css';
import '@tmagic/editor/dist/style.css';
import '@tmagic/form/dist/style.css';

import { createApp } from 'vue';
import ElementPlus from 'element-plus';

import TMagicDesign from '@tmagic/design';
import TMagicEditor from '@tmagic/editor';
import TMagicElementPlusAdapter from '@tmagic/element-plus-adapter';
import TMagicForm from '@tmagic/form';

import App from './App.vue';

createApp(App)
  .use(ElementPlus)
  .use(TMagicDesign, TMagicElementPlusAdapter)
  .use(TMagicEditor)
  .use(TMagicForm)
  .mount('#app');

```

## 渲染编辑器

将以下代码覆盖到src/App.vue中

```vue
<template>
  <m-editor
    v-model="value"
    :render="render"
    :component-group-list="componentGroupList"
  ></m-editor>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const value = ref();

const componentGroupList = ref([]);

const render = () => window.document.createElement('div');
</script>

<style>
html,
body,
#app,
.m-editor {
  height: 100vh;
}

body {
  margin: 0;
}
</style>

```

## 运行项目

```bash
npm run serve
```

到这里一个空白的编辑器就运行起来了。不出意外，通过浏览器访问 **http:\/\/localhost:8081/** ，将看到

<img src="/tutorial/one/init.png" />

## 添加组件列表

api详情：[componentGroupList](../../api/editor/props.md#componentgrouplist)

```ts
const componentGroupList = ref([
  {
    title: '组件列表',
    items: [
      {
        icon: 'https://vfiles.gtimg.cn/vupload/20220614/9cc3091655207317835.png',
        text: 'HelloWorld',
        type: 'hello-world',
      },
    ],
  },
]);
```

到这里，左侧会出现一个叫HelloWorld的爱心图标，点击它会发现没有反应，打开控制台会发现有error；这是因为还没有创建页面

点击中间的新增页面也会发现没有反应，这是因为没有编辑器初始值，只需要给value赋上初始值就可以了

## 设置编辑器初始值

api详情：[modelValue](../../api/editor/props.md#modelvalue-v-model)

```ts
const value = ref({
  type: 'app',
  // 必须加上ID，这个id可能是数据库生成的key，也可以是生成的uuid
  id: 1,
  items: [],
});
```

加上初始值后，点击新增页面就可以渲染出一个画布了，但是点击添加HelloWorld组件依然没有反应

这是因为这时的编辑器并能理解HelloWorld是什么，需要在[render](../../api/editor/props.html#render)函数中处理

## 渲染

api详情：[render](../../api/editor/props.md#render)

```ts
const render = () => {
  const root = window.document.createElement('div');
  const page = value.value.items[0];

  if (!page) return root;

  root.id = `${page.value.id}`;

  createApp(
    {
      template: '<p v-for="node in config.items" :key="node.id" :id="node.id">hello world</p>',
      props: ['config'],
    },
    {
      config: page,
    },
  ).mount(root);

  return root;
};
```

这里用到了动态编译Vue模板，所以需要在vue.config.js中添加vue alias

```js
configureWebpack: {
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.esm-bundler.js',
    },
  },
}
```

> render函数中获取page是通过value.value.items[0]，这样只是表示第一个页面，如果页面有多个页面就会有问题
> 可以通过[editorService.get('page')](../../api/editor/editorServiceMethods.md#get)获取到当前选中的页面

```ts
import { editorService } from '@tmagic/editor';
import type { MPage } from '@tmagic/schema';

const page = computed(() => editorService.get<MPage>('page'))
```

到这已经能渲染出HelloWorld组件了，但是会发现无法选中，因为这时并不知道画布中的Dom已经发生变化，所以需要通知编辑器

需要调用

```ts
renderer.iframe.contentWindow.magic?.onRuntimeReady({});
renderer.iframe.contentWindow.magic?.onPageElUpdate(root);
```
> render函数接收一个stageCore参数 [StageCore](../../api/stage/coreMethods.md)

最终完整的render函数实现

```ts
import type StageCore from '@tmagic/stage';

const render = async ({ renderer }: StageCore) => {
  const root = window.document.createElement('div');

  if (!page.value) return root;

  const { width = 375, height = 1700 } = page.value.style || {};

  root.id = `${page.value.id}`;
  root.style.cssText = `
    width: ${width}px;
    height: ${height}px;
  `;

  createApp(
    {
      template: '<div v-for="node in config.items" :key="node.id" :id="node.id">hello world</div>',
      props: ['config'],
    },
    {
      config: page.value,
    },
  ).mount(root);

  renderer.on('onload', () => {
    const style = window.document.createElement('style');
    // 隐藏滚动条，重置默认样式
    style.innerHTML = `
      body {
        overflow: auto;
      }

      html,body {
        height: 100%; margin: 0;padding: 0;
      }
      
      html::-webkit-scrollbar {
        width: 0 !important;
        display: none;
      }
    `;

    renderer.iframe?.contentDocument?.head.appendChild(style);

    renderer.contentWindow?.magic?.onPageElUpdate(root);
    renderer.contentWindow?.magic?.onRuntimeReady({});
  });

  return root;
};
```

以上就是一个简单的搭建编辑器的示例，安装上面的步骤完成后会发现，可以添加组件，也可选中组件，但是无法拖动，配置属性中的样式也无法生效，这是因为上述的render函数并不完整，没有处理dsl中style，下一节将详细介绍runtime的搭建，将不再使用render函数的方式而是使用[runtimeUrl](../../api/editor/props.md#runtimeurl)。

::: tip
并不是render函数不好，但是从设计上将，render函数还是让渲染逻辑落到了编辑器中，@tmagic/editor的设计是希望做到渲染跟编辑器解耦
:::

[源码](https://github.com/vft-magic/tmagic-tutorial)

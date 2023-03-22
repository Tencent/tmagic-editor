# 2.Runtime

## 创建项目

[关于@vue/cli的详细教程可以查看官方文档](https://cli.vuejs.org/zh/guide/installation.html)

### 创建editor项目

将[上一教程](./hello-world.md)中的[hello-world](https://github.com/jia000/tmagic-tutorial/tree/master/course1/hello-world)复制过来，改名hello-editor


### 创建runtime项目

```bash
vue create editor-runtime

cd editor-runtime
```

删除src/components/HelloWorld.vue

按钮需要用的ts types依赖

```bash
npm install --save @tmagic/schema @tmagic/stage
```

## 实现runtime

将hello-editor中的render函数实现移植到runtime项目中

新建ui-page.vue文件

```vue
<template>
  <div v-if="config" :id="config.id" :style="style">
    <div v-for="node in config.items" :key="node.id" :id="node.id">hello world</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  config: any;
}>();

const style = computed(() => {
  const { width = 375, height = 1700 } = props.config.style || {};
  return {
    width: `${width}px`,
    height: `${height}px`,
  };
});
</script>
```

将以下代码覆盖到src/App.vue中

```vue
<template>
  <uiPage :config="page"></uiPage>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import uiPage from './ui-page.vue';

const page = ref<any>();
</script>
```

## 启动runtime

```bash
npm run serve -- --port=8078
```

## 修改editor

删除render props，添加runtimeUrl

修改样式

```vue
<template>
  <m-editor
    v-model="value"
    :runtime-url="runtimeUrl"
    :component-group-list="componentGroupList"
  ></m-editor>
</template>

<script lang="ts" setup>
// imports

const value = ref({
  type: 'app',
  // 必须加上ID，这个id可能是数据库生成的key，也可以是生成的uuid
  id: 1,
  items: [],
});

const componentGroupList = ref([
  // ...
]);

const runtimeUrl = 'http://localhost:8078/';
</script>

<style>
#app {
  overflow: auto;
}

html,body,#app {
  height: 100%; margin: 0;padding: 0;
}

#app::-webkit-scrollbar {
  width: 0 !important;
  display: none;
}
</style>
```

## 启动editor

```bash
cd hello-editor

npm run serve -- --port=8080
```

## 跨域问题

在editor-runtime项目下的vue.config.js中添加如下配置

```javascript
devServer: {
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
},
```

## runtime与editor通信

到这里项目就可以正常访问了，但是会发现添加组件没有反应。

这是因为在runtime中无法直接获取到editor中的dsl，所以需要通过editor注入到window的magic api来交互

> 如出现在runtime中出现magic为undefined， 可以尝试在App.vue中通过监听message，来准备获取magic注入时机，然后调用magic.onRuntimeReady，示例代码如下
```js
window.addEventListener('message', ({ data }) => {
  if (!data.tmagicRuntimeReady) {
    return;
  }

  window.magic?.onRuntimeReady({
    // ...
  });
});
```
> 这里可能会出现editor抛出message的时候，runtime还没有执行到监听message的情况
> 编辑器只在iframe onload事件中抛出message
> 如果出现runtime中接收不到message的情况，可以尝试在onMounted的时候调用magic.onRuntimeReady


```ts
import type { Magic } from '@tmagic/stage';

declare global {
  interface Window {
    magic?: Magic;
  }
}
```

```ts
import type { RemoveData, UpdateData } from '@tmagic/stage';
import type { Id, MApp, MNode } from '@tmagic/schema';

const root = ref<MApp>();

window.magic?.onRuntimeReady({
  /** 当编辑器的dsl对象变化时会调用 */
  updateRootConfig(config: MApp) {
    root.value = config;
  },

  /** 当编辑器的切换页面时会调用 */
  updatePageId(id: Id) {
    page.value = root.value?.items?.find((item) => item.id === id);
  },

  /** 新增组件时调用 */
  add({ config }: UpdateData) {
    const parent = config.type === 'page' ? root.value : page.value;
    parent.items?.push(config);
  },

  /** 更新组件时调用 */
  update({ config }: UpdateData) {
    const index = page.value.items?.findIndex((child: MNode) => child.id === config.id);
    page.value.items.splice(index, 1, reactive(config));
  },

  /** 删除组件时调用 */
  remove({ id }: RemoveData) {
    const index = page.value.items?.findIndex((child: MNode) => child.id === id);
    page.value.items.splice(index, 1);
  },
});

```

## 同步页面dom给编辑器

由于组件渲染在runtime中，对于编辑器来说是个黑盒，并不知道哪个dom节点才是页面（对于dsl的解析渲染可能是千奇百怪的），所以需要将页面的dom节点同步给编辑器

```ts
watch(page, async () => {
  // page配置变化后，需要等dom更新
  await nextTick();
  window?.magic.onPageElUpdate(pageComp.value?.$el);
});
```

以上就是一个简单runtime实现，以及与编辑的交互，这是一个不完善的实现(会发现组件再画布中无法自由拖动，是因为没有完整的解析style)，但是其中已经几乎覆盖所有需要关心的内容

当前教程中实现了一个简单的page，tmagic提供了一个比较完善的实现，将在下一节介绍

[源码](https://github.com/vft-magic/tmagic-tutorial/tree/master/course2)

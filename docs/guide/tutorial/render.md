# 3.[DSL](../conception.md#dsl) 解析渲染

tmagic 提供了 vue3/vue2/react 三个版本的解析渲染组件，可以直接使用

[@tmagic/ui](https://www.npmjs.com/package/@tmagic/ui)

[@tmagic/ui-vue2](https://www.npmjs.com/package/@tmagic/ui-vue2)

[@tmagic/ui-react](https://www.npmjs.com/package/@tmagic/ui-react)

接下来是以vue3为基础，来讲述如何实现一个[@tmagic/ui](https://www.npmjs.com/package/@tmagic/ui)

## 准备工作

### 创建项目

将[上一教程](./runtime.md)中的[editor-runtime](https://github.com/jia000/tmagic-tutorial/tree/master/course2/editor-runtime)和[hello-editor](https://github.com/jia000/tmagic-tutorial/tree/master/course2/hellow-editor)复制过来

## 基础概念

### 节点（Node）

每一个组件最终都是由一个节点来描述，每个节点至少拥有id,type两个属性

id: 节点的唯一标识，不可重复

type: 节点的类型，有业务自行定义

### 容器（Container）

容器也是节点的一种，容器可以包含多个节点并且是保存在items属性下

items: 容器下包含的节点组成的数组，items中不能有page,app

### 页面（Page)

页面是容器的一种，type固定为page，items中不能有page

### 根（Root)

根节点也是一个容器，type固定为app，items只能是page

## 实现

创建hello-ui目录

```
.
└─editor-runtime
└─hello-editor
└─hello-ui
```

### 渲染节点

在hello-ui下创建 Component.vue 文件

由于节点的type是由业务自行定义的，所以需要使用动态组件渲染，在vue下可以使用[component](https://cn.vuejs.org/api/built-in-special-elements.html#component)组件来实现

[component](https://cn.vuejs.org/api/built-in-special-elements.html#component) 是通过is参数来决定哪个组件被渲染，所以将type与组件做绑定

例如有组件 HelloWorld，可以将组件全局注册

```js
app.component('hello-world', HelloWorld);
```

然后将'hello-world'作为type，那么is="hello-world"就会渲染 HelloWorld 组件

为了让组件渲染出来的dom能被编辑器识别到，还需要将节点的id作为dom的id

```vue
<template>
  <component v-if="config" :is="type" :id="`${id}`" :style="style" :config="config"></component>
</template>

<script lang=ts setup>
import { computed } from 'vue';

import type { MNode } from '@tmagic/schema';

// 将节点作品参数传入组件中
const props = defineProps<{
  config: MNode;
}>();

const type = computed(() => {
  if (!props.config.type || ['page', 'container'].includes(props.config.type)) return 'div';
  return props.config.type;
});

const id = computed(() => props.config.id);
</script>
```

接下来就需要解析节点的样式，在tmagic/editor中默认会将样式配置保存到节点的style属性中，如果自行定义到了其他属性，则已实际为准

解析style需要注意几个地方

1. 数字

css中的数值有些是需要单位的，例如px，有些是不需要的，例如opacity

在tmagic/editor中，默认都是不带单位的，所以需要将需要单位的地方补齐单位

这里做补齐px处理，如果需要做屏幕大小适应， 可以使用rem或者vw，这个可以根据自身需求处理。

2. url

css中的[url](https://developer.mozilla.org/zh-CN/docs/Web/CSS/url)需要是用url()，所以当值为url时，需要转为url(xxx)

3. transform

[transform](https://developer.mozilla.org/zh-CN/docs/Web/CSS/transform)属性可以指定为关键字值none 或一个或多个transform-function值。

```ts
const fillBackgroundImage = (value: string) => {
  if (value && !/^url/.test(value) && !/^linear-gradient/.test(value)) {
    return `url(${value})`;
  }
  return value;
};

const style = computed(() => {
  if (!props.config.style) {
    return {};
  }

  const results: Record<string, any> = {};

  const whiteList = ['zIndex', 'opacity', 'fontWeight'];
  Object.entries(props.config.style).forEach(([key, value]) => {
    if (key === 'backgroundImage') {
      value && (results[key] = fillBackgroundImage(value));
    } else if (key === 'transform' && typeof value !== 'string') {
      results[key] = Object.entries(value as Record<string, string>)
        .map(([transformKey, transformValue]) => {
          let defaultValue = 0;
          if (transformKey === 'scale') {
            defaultValue = 1;
          }
          return `${transformKey}(${transformValue || defaultValue})`;
        })
        .join(' ');
    } else if (!whiteList.includes(key) && value && /^[-]?[0-9]*[.]?[0-9]*$/.test(value)) {
      results[key] = `${value}px`;
    } else {
      results[key] = value;
    }
  });

  return results;
});
```

### 渲染容器

容器与普通节点的区别，就是需要多一个items的解析

新增Container.vue文件

```vue
<template>
  <Component :config="config">
    <Component v-for="item in config.items" :key="item.id" :config="item"></Component>
  </Component>
</template>

<script lang="ts" setup>
import type { MContainer } from '@tmagic/schema';

import Component from './Component.vue';

defineProps<{
  config: MContainer;
}>();
</script>
```

### 渲染页面

页面就是容器，之所以单独存在，是页面会自己的方法，例如reload等

Page.vue文件

```vue
<template>
  <Container :config="config"></Container>
</template>

<script lang="ts" setup>
import type { MPage } from '@tmagic/schema';

import Container from './Container.vue';

defineProps<{
  config: MPage;
}>();

defineExpose({
  reload() {
    window.location.reload();
  }
});
</script>
```

## 在runtime中使用 hello-ui

删除editor-runtime/src/ui-page.vue

将App.vue中的ui-page改成hello-ui中的Page

```vue
<template>
  <Page v-if="page" :config="page" ref="pageComp"></Page>
</template>

<script lang="ts" setup>
// eslint-disable-next-line
import { Page } from 'hello-ui';
<script>
```

在editor-runtime/vue.config.js中加上配置

```ts
configureWebpack: {
  resolve: {
    alias: {
      'hello-ui': path.resolve(__dirname, '../hello-ui'),
      vue$: path.resolve(__dirname, './node_modules/vue'),
    },
  },
},
```

## 添加HelloWorld组件

在hello-ui下新增HelloWorld.vue

```vue
<template>
  <div>hollo-world</div>
</template>

<script lang="ts" setup>
import type { MNode } from '@tmagic/schema';

defineProps<{
  config: MNode;
}>();
</script>
```

在editor-runtime main.ts中注册HelloWorld

```ts
import { createApp } from 'vue';

import type { Magic } from '@tmagic/stage';

// eslint-disable-next-line
import { HelloWorld } from 'hello-ui';

import App from './App.vue';

declare global {
  interface Window {
    magic?: Magic;
  }
}

const app = createApp(App);

app.component('hello-world', HelloWorld);

app.mount('#app');

```

[源码](https://github.com/jia000/tmagic-tutorial/tree/master/course3)

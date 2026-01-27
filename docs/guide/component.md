# 如何开发一个组件
tmagic-editor支持业务方进行自定义组件开发。在tmagic-editor中，组件是以 npm 包形式存在的，组件和插件只要按照规范开发，就可以在tmagic-editor的 runtime 中被加入并正确渲染组件。

### 组件规范
组件的基础形式，需要有四个文件
- index 入口文件，引入下面几个文件
- form-config 表单配置描述
- init-value 表单初始值
- event 定义联动事件，具体可以参考[组件联动](../guide/advanced/coupling.html#组件联动)
- component.{vue,jsx} 组件样式、逻辑代码

### 1. 创建组件

可以使用`npm create tmagic` 选择 `components:组件库(组件/插件/数据源)` 来快速创建一个组件库。

然后继续使用`npm create tmagic` 选择 `component:组件` 来快速创建一个组件。

:::tip

组件库并不是必须，组件如何管理可以根据具体情况来选择。直接放到 runtime 目录中也是一个不错的选择，如果选择放到runtime中可以在runtime中的package.json添加
```json
{
  "createTmagic": {
    "componentsPath": "./components",
    "pluginsPath": "./plugins",
    "dataSourcesPath": "./dataSources"
  }
}
```
来指定组件库的路径。这样在使用`npm create tmagic` 来创建组件时，会自动将组件添加到组件库中。
:::

:::tip
如需为组件添加npm scope name，可以在runtime中的package.json中添加
```json
{
  "createTmagic": {
     "npmScopeName": "@tmagic"
  }
}
```
:::


手动创建组件，可以在项目中，如 runtime  目录中，创建一个名为 test-component 的组件目录，其中包含上面四个规范文件。
```javascript
// index.js
// vue
import Test from './Test.vue';
// react 
import Test from './Test.tsx';

export { default as config } from './form-config';
export { default as value } from './init-value';

export default Test;
```

:::tip
如果在runtime中使用了@tmagic/cli，则必须保持此规范；不使用则可以自由书写。 
:::

```javascript
// form-config.js
export default [
  {
    type: 'select',
    text: '字体颜色',
    name: 'color',
    options: [
      {
        text: '红色字体',
        value: 'red',
      },
      {
        text: '蓝色字体',
        value: 'blue',
      },
    ],
  },
  {
    name: 'text',
    text: '配置文案',
  },
];
```

:::tip
配置内容必须是一个数组，每个元素是一个对象，包含 type、text、name 等属性，每个对象代表一个表单项。

type 是表单项的类型

text 是表单项的文本

name 是表单项值的key。

上述实例对应生成的值为
```json
{
  "color": "red",
  "text": "一段文字",
}
```

type 在@tmagic/form 和 @tmagic/editor 中默认提供了一些，@tmagic/form提供的可以前往[表单配置](/form-config/fields/text.html)查看。
:::


```javascript
// init-value.js
export default {
  color: 'red',
  text: '一段文字',
};
```

:::tip
在编辑器中添加组件时使用，作为初始值。
:::

Vue版本的组件代码示例
```vue
<!-- Test.vue -->
<template>
  <div>
    <span>this is a Test component:</span>
    <span :style="{ color: config.color }">{{ config.text }}</span>
  </div>
</template>

<script setup>
defineOptions({
  name: 'magic-ui-test',
});

defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
}):
</script>
```

:::tip
编辑器中配置的 config 对象，会作为 props 传入组件中。
:::

react 版本组件代码示例
```javascript
// Test.tsx
import React, { useContext } from 'react';

import Core from '@tmagic/core';
import { AppContent } from '@tmagic/ui-react';

function Test({ config }: { config: any }) {
  const app = useContext<Core | undefined>(AppContent);
  console.log(app)

  return (<div id={config.id}
    style={app.transformStyle(config.style || {})}>
    <span>this is a Test component:</span>
    <span style={ { color: config.color }}>{ config.text }</span>
  </div>);
}

export default Test;

```

## 插件开发
插件开发和组件开发形式类似，但是插件开发不需要有组件的规范。

我们只需要在插件中提供一个入口文件。插件需要提供一个 install 方法。

```javascript
// 在Vue的runtime中
export default {
  install(vueApp, { app: tmagicApp }) {}
}
```

```javascript
// 在React的runtime中
export default {
  install({ app: tmagicApp }) {}
}
```

在插件中开发者可以自由实现需要的业务逻辑。

## 集成到runtime中

### 使用@tmagic/cli

在使用`npm create tmagic` 创建的runtime中，自动集成了@tmagic/cli，将组件集成到此runtime中只需要在`tmagic.config.ts`中的packages字段中添加
```javascript
import { defineConfig } from '@tmagic/cli';

export default defineConfig({
  // other config
  packages: [
    {
      '组件type': '组件目录或者npm包名',
    },
  ],
});

```

:::tip
组件type需要与[componentGroupList](../api/editor/props.html#componentgrouplist)中的type对应。
:::


配置到packages字段中后，执行`npm run tmagic`来创建组件库的入口文件。

然后使用`npm run build:libs`命令来构建用于编辑器中的组件配置、组件初始值、组件事件联动的资源文件。


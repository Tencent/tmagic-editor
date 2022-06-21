# 如何开发一个组件
tmagic-editor支持业务方进行自定义组件开发。在tmagic-editor中，组件是以 npm 包形式存在的，组件和插件只要按照规范开发，就可以在tmagic-editor的 runtime 中被加入并正确渲染组件。

## 组件开发
以 vue3 的组件开发为例。运行项目中的 playground 示例，会自动加载 vue3 的 runtime。runtime会加载[@tmagic/ui](https://github.com/Tencent/tmagic-editor/tree/master/packages/ui)

## 组件注册
在 [playground](https://tencent.github.io/tmagic-editor/playground/index.html#/) 中，我们可以尝试点击添加一个组件，在模拟器区域里，就会出现这个组件。其中就涉及到组件注册。

这一步需要开发者基于tmagic-editor搭建了平台后，实现组件列表的注册、获取机制，tmagic-editor组件注册其实就是保存好组件 `type` 的映射关系。`type` 可以参考[组件介绍](../guide/conception.html#组件)。

可以参考 vue3 版本的 @tmagic/ui 中，[组件渲染](../guide/advanced/page.html#组件渲染)逻辑里，type 会作为组件名进入渲染。所以在 vue3 的组件开发中，我们也需要在为 vue 组件声明 name 字段时，和 type 值对应起来，才能正确渲染组件。

### 组件规范
组件的基础形式，需要有四个文件
- index 入口文件，引入下面几个文件
- formConfig 表单配置描述
- initValue 表单初始值
- event 定义联动事件，具体可以参考[组件联动](../guide/advanced/coupling.html#组件联动)
- component.{vue,jsx} 组件样式、逻辑代码

@tmagic/ui 中的 button/text 就是基础的组件示例。我们要求声明 index 入口，因为我们希望在后续的配套打包工具实现上，可以有一个统一规范入口。

### 1. 创建组件
在项目中，如 runtime vue3 目录中，创建一个名为 test-component 的组件目录，其中包含上面四个规范文件。
```javascript
// index.js
// vue
import Test from './Test.vue';
// react 
import Test from './Test.tsx';

export { default as config } from './formConfig';
export { default as value } from './initValue';

export default Test;
```

```javascript
// formConfig.js
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

```javascript
// initValue.js
export default {
  color: 'red',
  text: '一段文字',
};
```

vue3 版本的组件代码示例
```vue
<!-- Test.vue -->
<template>
  <div>
    <span>this is a Test component:</span>
    <span :style="{ color: config.color }">{{ config.text }}</span>
  </div>
</template>

<script>
export default {
  name: 'magic-ui-test',

  props: {
    config: {
      type: Object,
      default: () => ({}),
    },
  },

  setup() {},
};
</script>
```

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

### 2. 打包脚本
在 runtime vue3 中，我们已经提供好一份打包脚本示例。在 script 目录中。只需要在 unit.js 中加入你创建的组件到导出的 units 对象中，属性名即上面我们提到的组件 type，属性值为组件路径（如果是个 npm 包，则将路径替换为包名即可），打包脚本就会自动识别到你的组件。

```
const units = {
  test: path.join(__dirname, '../src/components/test-component/index.js'),
};
```
::: tip 自定义打包脚本
scripts目录中的打包脚本仅是一份示例。业务方可以自行处理打包方式。这份示例的目的，在于告诉开发者，我们是如何生成组件入口、表单配置描述、表单初始值三个入口文件，并提供出去的供 runtime 使用的。
:::

### 3. 启动 playground
在上面的步骤完成后，在 playground/src/page/Editor.vue 中。找到组件栏的基础组件列表，在其中加入你的开发组件
```javascript
{
  title: '基础组件',
  items: [
    {
      text: '文本',
      type: 'text',
    },
    {
      text: '按钮',
      type: 'button',
    },
    // 加入这个测试组件
    {
      text: '测试',
      type: 'test',
    },
  ],
}
```

然后，在 magic 项目根目录中，运行

```
npm run playground
```

至此，我们打开 playground 后，就能添加开发的中的组件，并且得到这个开发中的组件**在编辑器中的表现**了。

<img src="https://image.video.qpic.cn/oa_fd3c9c-3_548108267_1636719045199471">

### 4. 启动 runtime
在完成开发中组件在编辑器中的实现后，我们将编辑器中的 DSL 源码📄 打开，复制 DSL。并在 runtime/vue3/src/page 下。创建一个 page-config.js 文件。将 DSL 作为配置导出。

```javascript
window.magicDSL = [
  // DSL
]
```

在 page/main.ts 中，将这份配置读入
```javascript
import './page-config.js';
```

然后执行在 runtime/vue3 目录下执行
```
npm run start
```

至此，我们就可以得到这个开发中组件在编辑器中进行了配置并保存后，在真实页面中应该有的样子。

<img src="https://image.video.qpic.cn/oa_fd3c9c-3_1731965034_1636719708671597?imageView2/q/70" width="50%">

## 插件开发
插件开发和组件开发形式类似，但是插件开发不需要有组件的规范。在以 vue 为基础的 ui 和 runtime 中，插件其实就是一个 vue 插件。

我们只需要在插件中提供一个入口文件，其中包含 vue 的 install 方法即可。

```javascript
export default {
  install() {}
}
```

在插件中开发者可以自由实现需要的业务逻辑。插件和组件一样，只需要在 units.js 中，加入导出的 units 对象里即可。

## 业务定制
上述的步骤，如
1. 组件/插件初始化
2. 编辑器中的组件调试
3. 真实页面的组件调试
4. 编辑器中的 DSL 同步至本地调试页面

等许多步骤，都可以交由业务方进行定制，开发业务自定义的脚手架工具，或者如示例中一样，使用打包脚本来处理。
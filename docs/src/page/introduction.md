# 介绍
本章主要介绍魔方页面打包、发布相关的基础概念，打包原理，打包方案实现。使用了魔方开源代码的业务方可以自由定制页面的打包构建方案。

## 编辑器产物 uiconfig
编辑器中最终保存得到的的配置结果，同时也是魔方页面最终渲染的描述文件，就是一份 JS schema 形式的 uiconfig。其具体形式就是在 [JS Schema](/docs/guide/advanced/js-schema.html#uiconfig) 我们示例中提到的内容。

在魔方编辑器中，所有的操作和配置信息，最终都保存成这一份 uiconfig。这份配置在魔方 runtime 中被加载和渲染，最终呈现出魔方活动页。

## runtime
runtime 的概念，是理解魔方活动页运行的重要感念，runtime 是承载魔方活动页面的运行环境。可视化页面需要在魔方编辑器中搭建、渲染，通过模拟器所见即所得。搭建完成后，保存配置并发布，然后渲染到真实页面。其中涉及到两个不同的 runtime：
- 编辑器中的模拟器
- 终端打开真实页面

所以更深入描述，runtime 是魔方页面的渲染环境，提供不同场景下的能力封装。如果理解了魔方的设计，阅读了魔方的源码，可以发现，runtime 只是对魔方的渲染器做了一层包装，在不同 runtime 中，魔方的渲染逻辑和组件代码都是相同的。

并且，由于魔方在编辑器中的模拟器是通过 iframe 渲染的，和魔方平台本身可以做到框架解耦，所以 runtime 也可以用不同框架开发。目前魔方提供了 vue2/vue3 和 react 的 runtime 示例。

各个 runtime 的作用除了作为不同场景下的渲染环境，同时也是不同环境的打包构建载体。魔方示例代码中的打包就是基于 runtime 进行的。

### 业务相关
由于 runtime 是页面渲染的承载环境，其中会加载 Magic-UI 以及各个业务组件，业务发布活动页也是基于 runtime，所以在 runtime 中实现业务方的自定逻辑是最合适的。runtime 可以提供一些全局 API，供业务组件调用。我们可以把下面的模拟器中的 runtime 视为一个业务方runtime。

魔方提供了三个版本的 runtime 示例，可以参考：
- [vue3 runtime](https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue3)
- [vue2 runtime](https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue2)
- [react runtime](https://github.com/Tencent/tmagic-editor/blob/master/runtime/react)

### 真实页面渲染（Page）
这一部分，对应的是 runtime 中的 page。即把魔方保存后的配置进行加载、解析、渲染，然后呈现页面的过程。
<img src="https://image.video.qpic.cn/oa_88b7d-37_1139402464_1633761800125955" width="100%" alt="魔方 runtime page 示意图">

### 模拟器中的页面渲染（Playground）
这一部分，对应的是 runtime 中的 playground。其实仔细查看源码，playground 和 page runtime 的差异，在于 playground 中需要响应编辑器中用户的操作：
- 组件的增删改
- 表单配置修改

响应用户配置修改的操作代码并不需要在用户打开的页面被使用到，这是两个 runtime 的主要差异。
<img src="https://image.video.qpic.cn/oa_88b7d-32_528694230_1633762153731370" width="100%" alt="魔方 runtime playground 示意图">

## 打包脚本
在魔方各个框架的 runtime 目录中，有对应的 scripts 打包脚本目录。由于各个框架的 runtime 间有可能有不同的打包方式，所以为了架构职责明确，我们将示例打包代码分别放入对应 runtime 的 scripts 目录中。

详细的打包脚本，可以参考调用[魔方打包脚本 generateEntry](https://github.com/Tencent/tmagic-editor/blob/master/runtime/scripts/generateEntry.js)。

在 runtime 中，我们通过 vite.config.ts 定义了打包入口文件，在 package.json 中声明了打包命令。你可以进入对应的 runtime 目录中尝试执行
```bash
npm i
npm run build
```

我们就可以得到打包产物 dist 目录。其中有我们在线上活动页面使用的 page.html 和编辑器模拟器使用的 playground.html 两个 runtime 页面框架。

## 页面发布
魔方的页面发布，目前使用的是静态资源发布。而所有配置出的活动页唯一的区别，就是配置信息。我们发布页面时，将页面的配置信息插入到 page.html 中，然后将修改后的 page.html 发布至 CDN，得到活动页面。

原始的 page.html 页面框架
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Magic App</title>
    <script src="https://unpkg.com/vue@next/dist/vue.runtime.global.js"></script>
    <script type="module" crossorigin src="assets/page.js"></script>
    <link rel="modulepreload" href="assets/App.10f9c9e1.js">
    <link rel="modulepreload" href="assets/vendor.1dc07625.js">
    <link rel="modulepreload" href="assets/index.3456a0b9.js">
    <link rel="modulepreload" href="assets/components.js">
    <link rel="stylesheet" href="assets/App.91ddd4a6.css">
    <link rel="stylesheet" href="assets/page.6c73043b.css">
  </head>
  <body>
    <div id="app"></div>
    
  </body>
</html>
```

插入活动信息后的 page.html 
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Publish Page</title>
    <!-- 这里插入了活动相关的 uiconfig.js -->
    <script type="module" src="./uiconfig.js"></script>
    <script src="https://unpkg.com/vue@next/dist/vue.runtime.global.js"></script>
    <script type="module" crossorigin src="assets/page.js"></script>
    <link rel="modulepreload" href="assets/App.10f9c9e1.js">
    <link rel="modulepreload" href="assets/vendor.1dc07625.js">
    <link rel="modulepreload" href="assets/index.3456a0b9.js">
    <link rel="modulepreload" href="assets/components.js">
    <link rel="stylesheet" href="assets/App.91ddd4a6.css">
    <link rel="stylesheet" href="assets/page.6c73043b.css">
  </head>
  <body>
    <div id="app"></div>
    
  </body>
</html>

```


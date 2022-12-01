# @tmagic/ui
在前面[页面渲染](../advanced/page)中提到的 UI 渲染器，就是包含在 @tmagic/ui 中的渲染器组件。

tmagic-editor的设计是希望发布的页面支持多个前端框架，即各个业务方可以根据自己熟悉的语言来开发组件、发布页面。也可以通过 [实现一个 runtime](../runtime.html) 的方式，来实现一个自己的 @tmagic/ui。

所以tmagic-editor的设计中，针对每个前端框架，都需要有一个对应的 @tmagic/ui 来承担渲染器职责。同时，也需要一个使用和 @tmagic/ui 相同前端框架的 runtime 来 @tmagic/ui 和业务组件的，具体 runtime 概念，可以参考[页面发布](../publish)。

@tmagic/ui 在tmagic-editor设计中，承担的是业务逻辑无关的，基础组件渲染的功能。一切和业务相关的逻辑，都应该在 [runtime](../runtime.html) 中实现。这样 @tmagic/ui 就能保持其通用性。

我们以项目代码中提供的 vue3 版本的 @tmagic/ui 作为示例介绍其中包含的内容。

## 渲染器
在 vue3 中，实现渲染器的具体形式参考[页面渲染](../advanced/page)中描述的[容器渲染](../advanced/page.html#容器渲染)和[组件渲染](../advanced/page.html#容器渲染)。

## 基础组件
在 @tmagic/ui vue3 中，我们提供了几个基础组件，可以在项目源码中找到对应内容。

- page tmagic-editor的页面基础
- container tmagic-editor的容器渲染器
- Component.vue tmagic-editor的组件渲染器
- button/text 基础组件示例

其中 page/container/Component 是 UI 的基础，是每个框架的 UI 都应该实现的。

button/text 其实就是一个组件开发的示例，具体组件开发相关规范可以参考[组件开发](../component)。

## @tmagic/ui 示例
- [vue3 渲染器](https://github.com/Tencent/tmagic-editor/blob/master/packages/ui)
- [vue2 渲染器](https://github.com/Tencent/tmagic-editor/blob/master/packages/ui-vue2)
- [react 渲染器](https://github.com/Tencent/tmagic-editor/blob/master/packages/ui-react)
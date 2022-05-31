# 高级函数
tmagic-editor的一个高级特性，就是支持开发者在不修改组件代码的情况下，对项目页面进行特定的修改，方式即支持开发者在线编码，让这份代码特定时机执行。

<img src="https://image.video.qpic.cn/oa_88b7d-37_1895524853_1636348113209218">

## @tmagic/core
我们在 @tmagic/core 这个包中，实现了tmagic-editor组件节点的 Node 类，每个组件在tmagic-editor的运行环境被渲染前，都会对应初始化一个 Node 类实例。而这些 Node 实例上包含了一些基础功能，包括触发指定钩子函数。这是一个框架无关的核心库，所以支持在各个语言框架中使用。但是具体触发时机需要由各个框架的渲染器实现。

在 react 和 vue 两种框架下的执行时机，可以参考我们的 runtime 实现:

- [react runtime 执行钩子时机](https://github.com/Tencent/tmagic-editor/blob/master/packages/ui-react/src/useApp.ts)
- [vue runtime 执行钩子时机](https://github.com/Tencent/tmagic-editor/blob/master/packages/ui/src/useApp.ts)

## 函数编写
在编辑中，即写入一个执行函数，tmagic-editor会在对应组件的指定声明周期中执行该函数。同时**传入当前组件的 Node 实例对象**，作为执行参数。

传入的实例对象，可以根据各语言框架实现的 ui 提供的特性能力，来支持业务组件的能力实现。这个功能提供给开发者自由实现黑科技的机会。

<img src="https://image.video.qpic.cn/oa_2a552e-0_934618672_1636348294258073">

### 函数参数
在 Magic-Core 中，我们对执行钩子函数传入了对应的 [Node](https://github.com/Tencent/tmagic-editor/blob/master/packages/core/src/Node.ts) 实例对象。在 react 和 vue 中会稍有差异。差异在于 [Node](https://github.com/Tencent/tmagic-editor/blob/master/packages/core/src/Node.ts) 实例的 instance 属性。

- [Node 实例描述](https://github.com/Tencent/tmagic-editor/blob/master/packages/core/src/Node.ts)

### instance
Magic-Core 会在监听到对应事件时，将 payload 赋值给 Node 实例的 instace 属性。

其中 instance 属性的值，即我们在上面描述的，各个框架的钩子执行时机时发送的 payload 数据，各个框架发送的 instance 数据依据框架而定。instance 上会挂载一个 $el 对象，是各个框架 runtime 实现后，在组件 mounted 时候会得到的 dom 引用实例。

在示例中可以找到对应的触发事件和监听事件的形式如下：

```javascript
// runtime 中发送数据
app.emit('created', instance)

// class Node 
this.once('created', (instance: any) => {
  this.instance = instance;
});
```

- [Node 类监听声明周期](https://github.com/Tencent/tmagic-editor/blob/master/packages/core/src/Node.ts)
- [react runtime 执行钩子时机](https://github.com/Tencent/tmagic-editor/blob/master/packages/ui-react/src/useApp.ts)
- [vue runtime 执行钩子时机](https://github.com/Tencent/tmagic-editor/blob/master/packages/ui/src/useApp.ts)
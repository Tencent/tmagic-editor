# 布局原理
tmagic-editor的布局实现方式，**关键在于将布局配置指定在容器上，对容器内的所有子组件生效**，这是tmagic-editor页面可以支持各种布局方式混合使用的核心方法。

## 容器
前面概念介绍中有提到，tmagic-editor的容器是组件的基础。组件必属于某个容器，容器下可以放组件，也可以放容器。页面本身就是一个容器，是所有容器和组件的根，整个页面的容器和组件组成一个树状结构。在 DSL 配置中，表现为:

```javascript
[{
  id: 123456,
  type: 'page',
  items: [{
    id: 222222,
    type: 'comp-A',
  }, {
    id: 333333,
    type: 'comp-B',
  }]
}]
```

## 顺序/绝对定位
组件是绝对或者顺序定位，体现在组件的**直属父级容器**上，比如我们将 page 设置为绝对定位，则它的子组件，全都为绝对定位。在 DSL 配置中，表现为：

```javascript
[{
  id: 123456,
  type: 'page',
  layout: "absolute",
  items: [{
    id: 222222,
    type: 'comp-A',
    style: {
      position: 'absolute',
    },
  }, {
    id: 333333,
    type: 'comp-B',
    style: {
      position: 'absolute',
    },
  }]
}]
```
所以，我们对绝对/顺序排布的配置描述 layout，是存在于容器上的。

## 混合布局
因为tmagic-editor的布局配置，是指定在容器上的，所以tmagic-editor的设计方式，就可以支持在页面中实现各种混合布局的嵌套。

<img src="https://image.video.qpic.cn/oa_88b7d-37_1417201939_1636341538475155?imageView2/q/70">
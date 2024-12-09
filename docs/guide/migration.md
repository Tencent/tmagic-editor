# 升级到1.5.x

## ui npm包的变化

ui中包含的组件被移除，这些组件由单独的npm包提供。1.5.0以后ui包将变得不重要，只是为了兼容而保留，后续将变废弃。

建议将runtime中的tmagic.config中的packages配置的ui包改成：

```js
{
  packages: [
    { button: '@tmagic/vue-button',
    { container: '@tmagic/vue-container' },
    { img: '@tmagic/vue-img' },
    { 'iterator-container': '@tmagic/vue-iterator-container' },
    { page: '@tmagic/vue-page' },
    { 'page-fragment': '@tmagic/vue-page-fragment' },
    { 'page-fragment-container': '@tmagic/vue-page-fragment-container' },
    { text: '@tmagic/vue-text' },
    { overlay: '@tmagic/vue-overlay' },
    { qrcode: '@tmagic/vue-qrcode' },
  ],
}
```
:::tip
react的也是类似上面的修改
:::

:::tip
上述这些组件中只有container是最重要的，不可缺少的，其他都可以换成自己实现的版本。
iterator-container/page/page-fragment/page-fragment-container这几个组件编辑中是有做特殊识别的，所以如果希望有完整的功能，也尽量保留
:::

## 对编辑画布中组件的识别

1.5.0之前是通过识别dom中是否拥有id属性是判断该dom是不是组件的根节点，之后默认会变成识别是否拥有data-tmagic-id

:::tip
此变化是通过container组件来实现的，之前vue是`@tmagic/ui`或者`tmagic/ui-vue2`中的Component组件来实现，`tmagic/ui-react`则是各个组件自己实现，之后vue是由`@tmagic/vue-container`实现，react依然由各个组件自己实现。
:::

如果希望依然保留对id属性的识别，我们也提供方法

```ts
import { setDslDomRelateConfig } from '@tmagic/editor';

setDslDomRelateConfig('getIdFromEl', (el?: HTMLElement | SVGElement | null) => el?.id);
setDslDomRelateConfig(
  'getElById',
  (doc?: Document, id?: string | number) => doc?.querySelector(`[id="${id}"]`) as HTMLElement,
);
setDslDomRelateConfig('setIdToEl', (el: HTMLElement | SVGElement, id: string | number) => {
  el.id = `${id}`;
});
```

:::tip
与此相关的`m-editor`组件的[canSelect](/api/editor/props.html#canselect)/[isContainer](/api/editor/props.html#iscontainer)这里配置
:::

## 组件对迭代器容器的支持

迭代器容器是通过绑定一个数据源的数组字段，然后会去迭代这个数组来渲染容器中的内容，这个是同一个配置的组件将会被渲染多次，这个时候组件配置的事件或者代码块中将无法准确获取中组件，所以需要将迭代的信息提供出来。

已vue组件为例，需要添加iteratorIndex和iteratorContainerId两个prop

```ts
{
  props: {
    // other props
    iteratorIndex: Array as PropType<number[]>,
    iteratorContainerId: Array as PropType<Id[]>,
  }
}
```

然后传个useApp

```ts
useApp({
  // other args
  iteratorContainerId: props.iteratorContainerId,
  iteratorIndex: props.iteratorIndex,
})
```

:::tip
如果对迭代器容器没有需求的，可以不用
:::

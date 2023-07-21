# 编辑器扩展

编辑器布局组成部分名称如下图，后续将直接使用图中名称指代其部分

<img src="/layout.png" width="100%">

## UI扩展

### 一、顶部菜单栏定制

通常使用 `m-editor` 组件的 [menu](/api/editor/props.html#menu) `prop` 来对齐进行设置；

顶部菜单栏分为`左` `中` `右`三个部分组成，所以 [menu](/api/editor/props.html#menu) `prop`的数据格式如下：

```js
{ left: [], center: [], right: [] }
```

数组的内容可以有三种种形式：`内部定义好的字符串`、`其他字符串`、`MenuButton 或者 MenuComponent 对象`

#### 1. 内部定义好的字符串:
```ts
'/' | 'delete' | 'undo' | 'redo' | 'zoom' | 'zoom-in' | 'zoom-out' | 'guides' | 'rule' | 'scale-to-original' | 'scale-to-fit'
```

是组件内部定义的可直接使用的内置功能，具体含义可以查看 [menu](/api/editor/props.html#menu)

#### 2. 其他字符串

除去[内部定好的字符串](#内部定义好的字符串)的其他字符串，则会被当成普通文本直接显示


#### 3. `MenuButton` 或者 `MenuComponent` 对象

MenuButton 的[定义](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L168)

用于自定义一个按钮，例如定义一个返回按钮可以由如下配置实现

```js
{
  type: 'buuton',
  text: '返回',
  handler: () => window.history.back(),
}
```

如果需要更复杂的功能则可以使用 `MenuComponent`, 可以用于实现渲染任意一个Vue组件

 `MenuComponent` 的[定义](https://github.com/Tencent/tmagic-editor/blob/239b5d3efeae916a8cf3e3566d88063ecccc0553/packages/editor/src/type.ts#L197C18-L197C32)

:::tip
如果对内置的顶部菜单栏实现不满意还可以使用自定义的实现完全替换掉

```html
<m-editor>
  <template #nav>
    <your-nav></your-nav>
  </template>
</m-editor>
```
:::

### 二、左侧菜单栏


### 三、右侧属性配置栏

默认的属性配置栏会分为属性、样式、事件、高级4个tab分页，其中只有属性是在组件中的`formConfig`文件中定义，其他三个分页都是自动生成的，所有组件都是一样的。

默认的属性读取流程如下：

组件中定义`formConfig` -> 通过`tamgic-cli`构建成 `runtime` 中 `/config/index.umd.cjs` -> `m-editor`中加载然后配置到[propsConfig](/api/editor/props.html#propsconfigs) prop中 -> `m-editor`保存到`propsService`中 -> 选中组件时`editorService`会去`propsService`调用`getPropsConfig`中读取

`propsService.getPropsConfig`会调取`propsService.fillConfig`添加样式、事件、高级3个tab分页

#### 1. 定制属性配置栏中顶部的属性、样式、事件、高级 tab分页

可以通过干预`propsService.fillConfig`来实现自定义。例如：

实现去掉样式、事件、高级3个tab分页，直接显示组件内定义好的配置
```js
propsService.usePlugin({
  /**
   * result为生成好的默认配置
   * config为组件中定义好的配置
   */
  afterFillConfig(result, config) {
    return config
  }
});
```

#### 2. 定制属性配置栏中配置的来源

如果觉得上述属性读取流程不满足需要，可以通过干预`propsService.getPropsConfig`来实现自定义的流程

```js
propsService.usePlugin({
  /**
   * result为生成好的默认配置
   * config为组件中定义好的配置
   */
  afterGetPropsConfig(result, type) {
    // 返回配置DSL即可
    return []
  }
});
```
#### 3. 自定义属性配置栏

默认属性配置栏是是使用`@tmagic/form`来实现的，如果需要使用其他组件来实现可以使用`props-panel`slot来将其替换掉

```html
<m-editor>
  <template #props-panel>
    <your-props-panel></your-props-panel>
  </template>
</m-editor>
```

### 四、中间工作区域

## 行为扩展

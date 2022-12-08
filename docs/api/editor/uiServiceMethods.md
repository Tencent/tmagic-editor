# uiService方法

## zoom

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{number}` zoom 缩放倍数

- **返回：**

  - `{Promise<void>}`

- **详情：**

设置缩放倍数，最小为0.1

## calcZoom

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **返回：**

  - `{Promise<number>}`

- **详情：**

计算出缩放以适应的倍数

## use

使用中间件的方式扩展方法，上述方法中标记有`扩展支持： 是`的方法都支持使用use扩展

## usePlugin

- **详情：**

相对于[use](#use), usePlugin支持更加灵活更加细致的扩展， 上述方法中标记有`扩展支持： 是`的方法都支持使用usePlugin扩展

每个支持扩展的方法都支持定制before、after两个hook来干预原有方法的行为，before可以用于修改传入参数，after可以用于修改返回的值

## removeAllPlugins

- **详情：**

删掉当前设置的所有扩展


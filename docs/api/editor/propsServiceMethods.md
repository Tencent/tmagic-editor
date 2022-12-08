# propsService方法

## fillConfig

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - {[FormConfig](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/form/src/schema.ts#L706)} config

- **返回：**

  - {Promise<[FormConfig](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/form/src/schema.ts#L706)>}

- **详情：**

  扩展属性表单配置DSL，用于为所有表单配置添加公共配置

## setPropsConfigs

- **参数：**

  - {Record<string, [FormConfig](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/form/src/schema.ts#L706)>} configs 

- **返回：**

  - `{void}`

- **详情：**

  设置组件与属性表单配置DSL的对应关系

## setPropsConfig

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` type 组件类型
  - {[FormConfig](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/form/src/schema.ts#L706)} config 属性表单配置DSL

- **返回：**

  - `{Promise<void>}`

- **详情：**

  为指定类型组件设置组件属性表单配置

## getPropsConfig

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` type 组件类型

- **返回：**

  - {Promise<[FormConfig](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/form/src/schema.ts#L706)>}

- **详情：**

  获取指点类型的组件属性表单配置

## setPropsValues

- **参数：**

  - {Record<string, [MNode](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L99)>} values

- **返回：**

  - `{void}`

- **详情：**

  设置组件与属性表单默认值的对应关系

## setPropsValue

- **参数：**

  - `{string}` type 组件类型
  - {[MNode](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L99)} value 组件初始值


- **返回：**

  - `{Promise<void>}`

- **详情：**

  设置组件与属性表单默认值的对应关系


## getPropsValue

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` type 组件类型
  - {[MNode](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L99)} value 组件默认值，可选


- **返回：**

  - `{Promise<void>}`

- **详情：**

  获取指定类型的组件初始值

## createId

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - {string} type 组件列席

- **返回：**

  - `{Promise<string>}`

- **详情：**

  生成组件id
## setNewItemId

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - {[MNode](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L99)} config

- **返回：**

  - {Promise<[MNode](https://github.com/Tencent/tmagic-editor/blob/c143a5f7670ae61d80c1a2cfcc780cfb5259849d/packages/schema/src/index.ts#L99)>}

- **详情：**

  将组件与组件的子元素配置中的id都设置成一个新的ID

## getDefaultPropsValue

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - `{string}` type 组件类型

- **返回：**

  - `{Promise<void>}`

- **详情：**

  获取默认属性配置

## resetState

- **详情：**

情况所有组件的属性配置与初始值

## destroy

- **详情：**

  销毁propsService

## use

使用中间件的方式扩展方法，上述方法中标记有`扩展支持： 是`的方法都支持使用use扩展

## usePlugin

- **详情：**

相对于[use](#use), usePlugin支持更加灵活更加细致的扩展， 上述方法中标记有`扩展支持： 是`的方法都支持使用usePlugin扩展

每个支持扩展的方法都支持定制before、after两个hook来干预原有方法的行为，before可以用于修改传入参数，after可以用于修改返回的值

## removeAllPlugins

- **详情：**

删掉当前设置的所有扩展

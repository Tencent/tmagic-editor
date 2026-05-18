# propsService方法

## setDisabledDataSource

- **参数：**
  - `{boolean}` disabled 是否禁用数据源

- **返回：**
  - `{void}`

- **详情：**

  设置是否禁用数据源（内部状态），影响 [fillConfig](#fillconfig) 注入的公共配置

## setDisabledCodeBlock

- **参数：**
  - `{boolean}` disabled 是否禁用代码块

- **返回：**
  - `{void}`

- **详情：**

  设置是否禁用代码块（内部状态），影响 [fillConfig](#fillconfig) 注入的公共配置

## getDisabledDataSource

- **返回：**
  - `{boolean}` 是否禁用数据源

- **详情：**

  获取是否禁用数据源的内部状态

## getDisabledCodeBlock

- **返回：**
  - `{boolean}` 是否禁用代码块

- **详情：**

  获取是否禁用代码块的内部状态

## fillConfig

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`FormConfig`} config
  - `{string}` labelWidth 表单项 label 宽度，默认 `'80px'`

  ::: details 查看 FormConfig 及关联类型定义
  <<< @/../packages/form-schema/src/base.ts#FormConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#FormItemConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#ChildConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#DynamicTypeConfig{ts}

  <<< @/../packages/form-schema/src/base.ts#FormItem{ts}
  :::

- **返回：**
  - {Promise<`FormConfig`>}

- **详情：**

  扩展属性表单配置DSL，用于为所有表单配置添加公共配置

## setPropsConfigs

- **参数：**
  - {Record<string, `FormConfig` | `PropsFormConfigFunction`>} configs

  ::: details 查看 PropsFormConfigFunction 类型定义
  <<< @/../packages/editor/src/type.ts#PropsFormConfigFunction{ts}
  :::

- **返回：**
  - `{void}`

- **详情：**

  设置组件与属性表单配置DSL的对应关系

## setPropsConfig

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{string}` type 组件类型
  - {`FormConfig`} config 属性表单配置DSL

- **返回：**
  - `{Promise<void>}`

- **详情：**

  为指定类型组件设置组件属性表单配置

## getPropsConfig

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{string}` type 组件类型
  - `{Object}` data 可选参数
    - {`MNode` | null} node 当前节点

  ::: details 查看 MNode 及关联类型定义
  <<< @/../packages/schema/src/index.ts#MNode{ts}

  <<< @/../packages/schema/src/index.ts#MComponent{ts}

  <<< @/../packages/schema/src/index.ts#MContainer{ts}

  <<< @/../packages/schema/src/index.ts#MIteratorContainer{ts}

  <<< @/../packages/schema/src/index.ts#MPage{ts}

  <<< @/../packages/schema/src/index.ts#MApp{ts}

  <<< @/../packages/schema/src/index.ts#MPageFragment{ts}
  :::

- **返回：**
  - {Promise<`FormConfig`>}

- **详情：**

  获取指点类型的组件属性表单配置

## setPropsValues

- **参数：**
  - {Record<string, `MNode`>} values

- **返回：**
  - `{void}`

- **详情：**

  设置组件与属性表单默认值的对应关系

## setPropsValue

- **参数：**
  - `{string}` type 组件类型
  - {`MNode`} value 组件初始值

- **返回：**
  - `{Promise<void>}`

- **详情：**

  设置组件与属性表单默认值的对应关系

## getPropsValue

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{string}` type 组件类型
  - `{Object}` defaultValue 组件默认值，可选

- **返回：**
  - {Promise<`MNode`>} 合并默认配置后的节点对象

- **详情：**

  获取指定类型的组件初始值，会合并 [getDefaultPropsValue](#getdefaultpropsvalue) 与已注册的 propsValue，并自动生成 id

## createId

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{string | number}` type 组件类型

- **返回：**
  - `{string}` 生成的组件id（格式为 `type_guid`）

- **详情：**

  生成组件id

## setNewItemId

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - {`MNode`} config
  - `{boolean}` force 是否强制设置新ID，默认 `true`

- **返回：**
  - {`MNode`} 处理后的节点

- **详情：**

  将组件与组件的子元素配置中的id都设置成一个新的ID

## getDefaultPropsValue

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**
  - `{string}` type 组件类型

- **返回：**
  - `{Object}` 默认属性配置对象（包含 `type`、`style`、`name` 等基础字段，`page`/`container` 类型会额外包含 `layout`、`items`）

- **详情：**

  获取默认属性配置

## replaceRelateId

- **参数：**
  - {`MNode`[]} originConfigs 原始组件配置
  - {`MNode`[]} targetConfigs 待替换的组件配置
  - `{TargetOptions}` collectorOptions 依赖收集器配置

- **返回：**
  - `{void}`

- **详情：**

  根据 [setNewItemId](#setnewitemid) 收集到的新旧 id 映射，替换目标配置中关联引用的 id（用于复制粘贴时保持组件间的关联依赖）

## clearRelateId

- **返回：**
  - `{void}`

- **详情：**

  清除 [setNewItemId](#setnewitemid) 维护的新旧 id 映射关系

## resetState

- **详情：**

  清空所有组件的属性配置 (`propsConfigMap`) 与初始值 (`propsValueMap`)。

  ::: tip
  本方法**不会**重置 `disabledDataSource` / `disabledCodeBlock` 标记，也**不会**清空 `relateIdMap`；如需清理后两者，请分别调用 [setDisabledDataSource](#setdisableddatasource) / [setDisabledCodeBlock](#setdisabledcodeblock) 与 [clearRelateId](#clearrelateid)。
  :::

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


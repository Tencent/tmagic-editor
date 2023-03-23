# codeBlockService方法



## setCodeDsl

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getCodeDsl

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getCodeContentById

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## setCodeDslById

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getCodeDslByIds

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## setCodeEditorShowStatus

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getCodeEditorShowStatus

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## setCodeEditorContent

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getCurrentDsl

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getEditStatus

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

## setEditStatus

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## setId

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getId

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getMode

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## setMode

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## setCombineIds

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getCombineIds

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## refreshAllRelations

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getCombineInfo

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getUndeletableList

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## setUndeleteableList

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## setCodeDraft

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getCodeDraft

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## removeCodeDraft

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## deleteCodeDslByIds

- **[扩展支持](../../guide/editor-expand#行为扩展)：** 是

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## getUniqueId

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## deleteCompsInRelation

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## destroy

- **参数：**

  - 

- **返回：**

  - `{Promise<void>}`

- **详情：**

## use

使用中间件的方式扩展方法，上述方法中标记有`扩展支持： 是`的方法都支持使用use扩展

## usePlugin

- **详情：**

相对于[use](#use), usePlugin支持更加灵活更加细致的扩展， 上述方法中标记有`扩展支持： 是`的方法都支持使用usePlugin扩展

每个支持扩展的方法都支持定制before、after两个hook来干预原有方法的行为，before可以用于修改传入参数，after可以用于修改返回的值

## removeAllPlugins

- **详情：**

删掉当前设置的所有扩展


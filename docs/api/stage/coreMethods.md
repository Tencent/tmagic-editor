# stage方法

## select

- **类型**：`(id: Id, event?: MouseEvent) => Promise<void>`
- **参数**：
  - `id`：选中节点的 id
  - `event`：触发选中的鼠标事件（可选）
- **详情**：单选选中元素

## multiSelect

- **类型**：`(ids: Id[]) => Promise<void>`
- **参数**：
  - `ids`：选中元素的 id 列表
- **详情**：多选选中多个元素

## highlight

- **类型**：`(id: Id) => void`
- **参数**：
  - `id`：要高亮的节点 id
- **详情**：按 id 高亮节点

## clearHighlight

- **类型**：`() => void`
- **详情**：清除高亮

## update

- **类型**：`(data: UpdateData) => Promise<void>`
- **参数**：
  - `data`：更新组件所需的数据，包含 `config`、`parent`、`parentId`、`root` 等字段
- **详情**：更新组件

## add

- **类型**：`(data: UpdateData) => Promise<void>`
- **参数**：
  - `data`：组件信息数据，包含要新增组件的 `config`、`parent`、`parentId`、`root` 等字段
- **详情**：往画布增加一个组件

## remove

- **类型**：`(data: RemoveData) => Promise<void>`
- **参数**：
  - `data`：组件信息数据，包含要删除组件的 `id`、`parentId`、`root` 等字段
- **详情**：从画布删除一个组件

## setZoom

- **类型**：`(zoom?: number) => void`
- **参数**：
  - `zoom`：缩放比例，缺省时使用 `DEFAULT_ZOOM`
- **详情**：设置画布缩放比例

## mount

- **类型**：`(el: HTMLDivElement) => Promise<void>`
- **参数**：
  - `el`：将 stage 挂载到该 Dom 节点上
- **详情**：挂载 Dom 节点

## clearGuides

- **类型**：`() => void`
- **详情**：清空所有参考线

## delayedMarkContainer

- **类型**：`(event: MouseEvent, excludeElList?: Element[]) => NodeJS.Timeout | undefined`
- **参数**：
  - `event`：鼠标事件
  - `excludeElList`：计算鼠标所在容器时要排除的元素列表
- **详情**：

鼠标拖拽着元素，在容器上方悬停，延迟一段时间后，对容器进行标记，如果悬停时间够长将标记成功，悬停时间短，调用方通过返回的timeoutId取消标记

标记的作用：

1、高亮容器，给用户一个加入容器的交互感知；

2、释放鼠标后，通过标记的标志找到要加入的容器

## getAddContainerHighlightClassNameTimeout

- **类型**：`(event: MouseEvent, excludeElList?: Element[]) => NodeJS.Timeout | undefined`
- **参数**：
  - `event`：鼠标事件
  - `excludeElList`：计算鼠标所在容器时要排除的元素列表
- **详情**：@deprecated 废弃接口，建议用 [delayedMarkContainer](#delayedmarkcontainer) 代替

## getMoveableOption

- **类型**：`<K extends keyof MoveableOptions>(key: K) => MoveableOptions[K] | undefined`
- **参数**:
  - `key`：要获取的 moveable 配置项名称
- **详情**：获取 moveable 配置项的当前值

## getDragStatus

- **类型**：`() => StageDragStatus | undefined`
- **详情**：获取当前画布的拖拽状态

## disableMultiSelect

- **类型**：`() => void`
- **详情**：禁用多选能力

## enableMultiSelect

- **类型**：`() => void`
- **详情**：启用多选能力

## setAlwaysMultiSelect

- **类型**：`(value: boolean) => void`
- **参数**：
  - `value`：是否始终启用多选模式（无需按住 `Ctrl/Meta` 键）
- **详情**：设置是否始终启用多选模式。当多选被 `disableMultiSelect` 禁用时，本方法不会启用多选

## reloadIframe

- **类型**：`(url: string) => void`
- **参数**：
  - `url`：重新加载的 runtime 地址
- **详情**：重新加载 runtime iframe

## getElementImage

- **类型**：`(id: Id, type?: 'download' | 'raw' | 'svg' | 'canvas' | 'png' | 'jpeg' | 'webp' | 'blob', options?: SnapdomOptions) => Promise<any>`
- **参数**：
  - `id`：要截图的节点 id
  - `type`：导出类型，默认为 `'png'`
  - `options`：[snapdom](https://github.com/zumerlab/snapdom) 选项
- **详情**：将指定 id 的 dom 元素生成为图片

## destroy

- **类型**：`() => void`
- **详情**：销毁实例


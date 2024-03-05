# 画布功能介绍
画布是编辑器中最核心的功能，处理组件拖拽和所见即所得的展示。
## 画布整体功能示意图
![魔方编辑器](https://vfiles.gtimg.cn/vupload/20221113/78b8ab1668310500232.png)
如上图所示，中间粉色区域及其周边的标尺，是画布区域，就是这个模块代码要处理的内容。<br/><br/>
## 已选组件的组件树
![已选组件列表](https://vfiles.gtimg.cn/vupload/20221113/c3816e1668311041998.png)
已选组件列表，组件列表也可以单选、多选、高亮、删除、拖拽组件到容器内<br/><br/>

## 画布支持的功能
- 渲染runtime
- 从编辑器增加组件，可以在左侧组件列表中通过单击/拖拽往画布中加入组件
- 删除组件，在画布中右键单击组件，在弹出菜单中删除；或者在左侧已选组件的组件树中右键删除组件
- 单选拖拽组件，可以在画布中选中组件，也可以在左侧目录中
- 多选拖拽组件，通过按住ctrl健选中多个组件
- 拖拽改变组件大小
- 旋转组件
- 高亮组件，在画布中mousemove经过组件的时候，或者在组件树中mousemove经过组件的时候，高亮组件
- 配置组件，单选选中组件之后，右侧表单区域对组件进行配置，并更新组件的渲染
- 添加/删除/隐藏/显示参考线，通过在标尺中往画布中拖拽，给画布添加参考线，图中两条竖向和一天横向的红色线条就是参考线
- 辅助对齐，单选和多选都支持拖拽过程中会辅助对齐其它组件，并在靠近参考线时吸附到参考线
- 拖拽组件进入容器，支持通过在画布中单选，或者在组件树中单选，将组件拖拽进入容器
<br/><br/>
# 核心类介绍
## StageCore
- 负责统一对外接口，编辑器通过StageCore传入runtime、添加/删除组件、缩放画布、更新参考线和标尺等；同时StageCore也会对外抛出事件，比如组件选中、多选、高亮、更新，runtimeReady等。
- 管理三个核心类：StageRender、StageMask、ActionManager
<br/><br/>
## StageRender
基于iframe加载传入进来的runtimeUrl，并支持增删改查组件。还提供了一个核心API：getElementsFromPoint，该API负责获取指定坐标下所有dom节点。
<br/><br/>
## StageMask
mask是一个盖在画布区域的一个蒙层，主要作用是隔离鼠标事件，避免鼠标事件直接作用于runtime中的组件，从而避免触发组件本身的点击事件（比如链接组件会跳走）。mask在滚动画布时，需要保证同步大小。
<br/><br/>
## ActionManager
- 负责监听鼠标和键盘事件，基于这些事件，形成单选、多选、高亮行为。主要监听的是蒙层上的鼠标事件，通过StageRender.getElementsFromPoint计算获得鼠标下方的组件，实现事件监听和实际组件的解构。
- 向上负责跟StageCore双向通信，提供接口供core调用，并向core抛出事件
- 向下管理StageDragResize、StageMultiDragResize、StageHighlight这三个单选、多选、高亮类，让它们协同工作
<br/><br/>
## StageDragResize
负责单选相关逻辑，拖拽、改变大小、旋转等行为是依赖于开源库Moveable实现的，这些行为并不是直接作用于组件本身，而是在蒙层上创建了一个跟组件同等大小的边框div，实际拖拽的是边框div，在拖拽过程中同步更新组件。
这个类的主要工作包括：
- 初始化组件操作边框，初始化moveable参数
- 更新moveable参数，比如增加了参考线、缩放了大小、表单改变了组件，都需要更新
- 接收moveable的回调函数，同步去更新实际组件的渲染
<br/><br/>
## StageMultiDragResize
功能跟StageDragResize类似，只是这个类是负责多选操作的，通过ctrl健选中多个组件，多选状态下不支持通过表单配置组件。
<br/><br/>
## StageHighlight
在鼠标经过画布中的组件、或者鼠标经过组件目录树中的组件时，会触发组件高亮，高亮也是通过moveable实现的，这个类主要负责初始化moveable并管理高亮状态。
<br/><br/>
## MoveableOptionsManager
StageDragResize、StageMultiDragResize的父类，负责管理Moveable的配置
<br/><br/>
## TargetShadow
统一管理拖拽框和高亮框，包括创建、更新、销毁。
<br/><br/>
## DragResizeHelper
- 拖拽/改变大小等操作发生时，moveable会抛出各种状态事件，DragResizeHelper负责响应这些事件，对目标节点target和拖拽节点targetShadow进行修改；
- 其中目标节点是DragResizeHelper直接改的，targetShadow作为直接被操作的拖拽框，是调用moveableHelper改的；
- 有个特殊情况是流式布局下，moveableHelper不支持，targetShadow也是DragResizeHelper直接改的

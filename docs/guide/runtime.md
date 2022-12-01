# RUNTIME
本章详细介绍如何深入理解tmagic-editor的打包，以及如何根据需求定制，修改tmagic-editor的页面打包发布方案。页面发布、打包相关的定制化开发，需要使用tmagic-editor的业务方，搭建好基于开源tmagic-editor的管理平台、存储服务等配套设施。

## 实现一个 runtime
在 [@tmagic/ui](./advanced/tmagic-ui.html) 部分，我们已经说过，runtime 和 UI 是配套实现的。每个版本的 runtime 都需要一个对应的 UI 来作为渲染器，实现渲染 DSL 呈现页面的功能。

### UI
一个 UI 应该至少包含一个渲染器，来实现[页面渲染](./advanced/page.html)。同时可以提供一些基础组件。具体实现可以参考[@tmagic/ui](./advanced/tmagic-ui.html)。

### page
runtime 的 `page` 部分，就是真实项目页面的渲染环境。发布出去的项目页都需要基于该部分来实现渲染功能。而 `page` 的主要逻辑，就是需要加载 UI，同时实现业务方需要的业务逻辑，比如：
- 提供页面需要的全局 api
- 业务需要的特殊实现逻辑
- 加载第三方全局组件/插件等

具体的 page 实现示例，可以参考
- [vue3 runtime](https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue3/page)
- [vue2 runtime](https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue2/page)
- [react runtime](https://github.com/Tencent/tmagic-editor/blob/master/runtime/react/page)

### playground
runtime 的 `playground` 部分，和 `page` 做的事情几乎一致，业务方可以包含上述 `page` 所拥有的全部能力。但是，因为 playground 需要被编辑器加载，作为编辑器中页面模拟器的渲染容器，和编辑器通信，接受编辑器中组件的增删改查。所以，除了保持和 `page` 一样的渲染逻辑之外，`playground` 还要额外实现一套既定通信内容和 api，才能实现和编辑器的通信功能。

#### onRuntimeReady
**在 playground 页面渲染后**，需要调用接口通知编辑器完成加载。该调用需要传入一个参数 API，即挂载了增删改查功能的对象示例，提供给编辑器。
```javascript
window.magic?.onRuntimeReady(API)
```

#### onPageElUpdate
**playground 在每次更新了页面配置后**，调用一次 onPageElUpdate 并传入一个 DOM 节点，该方法作用是传入一个页面渲染组件的根节点，用来告知编辑器的模拟器遮罩如何作出反应。
```javascript
window.magic.onPageElUpdate(document.querySelector('.magic-ui-page'));
```

#### 提供 API
| API      | 说明    | 参数      | 
|---------- |-------- |---------- |
|updateRootConfig| 根节点更新 | `root: MApp`  |
|updatePageId| 更新当前页面 id | `id: string` |
|select| 选中组件 | `id: string`|
|add| 增加组件 | { `config` , `root` }: `UpdateData` |
|update| 更新组件 | { `config` , `root` }: `UpdateData`  |
|remove| 删除组件 | { `config` , `root` }: `UpdateData`  |
|sortNode| 组件在容器间排序 |{ `src` , `dist`, `root` }: `SortEventData`  |

runtime 的实现示例，可以参考tmagic-editor提供的：
- [vue3 runtime](https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue3)
- [vue2 runtime](https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue2)
- [react runtime](https://github.com/Tencent/tmagic-editor/blob/master/runtime/react)

### 页面发布
如介绍中提到的，tmagic-editor页面发布方案，是对构建产物 `page/index.html` 进行项目信息注入。项目信息就是搭建平台存储的页面配置。发布时，将注入项目信息的 `page/index.html` 发布出去即可。

## 版本管理
基于上一步提到的打包原理，每次构建后，得到的产物都可以进行归档编号，存为版本。涉及到的组件改动和新增修改，体现在各个版本中。

<img src="https://image.video.qpic.cn/oa_88b7d-32_1233288257_1633783105283986" width="40%" alt="版本选择">

版本管理具体如何实现，这取决于使用tmagic-editor的业务方。版本管理具有如下优点：
1. 对于已经配置好发布的项目，使用固定版本，不会被新版本的特性影响，保证项目线上稳定运行
2. 发布的新版本如果出现问题，可以及时回退选择使用旧版本

## 结合业务定制
tmagic-editor的静态资源构建，项目配置保存，页面发布，在tmagic-editor的提供的示例方案中，流程是：
1. 触发构建，执行流水线，基于 runtime 执行 build 
2. 将构建产物归档推送至 cdn，存为一个ui版本
3. 项目配保存后，项目发布时，将项目配置发布至 CDN 存储为 DSL.js，同时根据当前项目使用的ui版本，获取到 page/index.html，将 DSL.js 引用方式以 script 标签形式写入。
4. 将注入信息的 page/index.html 发布为项目静态资源 act.html
5. 线上可加载 act.html 访问项目

其中各个步骤的定制，可以交由业务方根据tmagic-editor提供的示例进行自定义修改。
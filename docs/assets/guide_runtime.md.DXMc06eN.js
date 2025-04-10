import{aw as t,y as a,z as i,b0 as r}from"./chunks/framework.BCBheFgR.js";const u=JSON.parse('{"title":"RUNTIME","description":"","frontmatter":{},"headers":[],"relativePath":"guide/runtime.md","filePath":"guide/runtime.md"}'),d={name:"guide/runtime.md"};function o(n,e,l,s,c,h){return i(),a("div",null,e[0]||(e[0]=[r('<h1 id="runtime" tabindex="-1">RUNTIME <a class="header-anchor" href="#runtime" aria-label="Permalink to &quot;RUNTIME&quot;">​</a></h1><p>本章详细介绍如何深入理解tmagic-editor的打包，以及如何根据需求定制，修改tmagic-editor的页面打包发布方案。页面发布、打包相关的定制化开发，需要使用tmagic-editor的业务方，搭建好基于开源tmagic-editor的管理平台、存储服务等配套设施。</p><h2 id="实现一个-runtime" tabindex="-1">实现一个 runtime <a class="header-anchor" href="#实现一个-runtime" aria-label="Permalink to &quot;实现一个 runtime&quot;">​</a></h2><p>在 <a href="./advanced/tmagic-ui.html">@tmagic/ui</a> 部分，我们已经说过，runtime 和 UI 是配套实现的。每个版本的 runtime 都需要一个对应的 UI 来作为渲染器，实现渲染 DSL 呈现页面的功能。</p><h3 id="ui" tabindex="-1">UI <a class="header-anchor" href="#ui" aria-label="Permalink to &quot;UI&quot;">​</a></h3><p>一个 UI 应该至少包含一个渲染器，来实现<a href="./advanced/page.html">页面渲染</a>。同时可以提供一些基础组件。具体实现可以参考<a href="./advanced/tmagic-ui.html">@tmagic/ui</a>。</p><h3 id="page" tabindex="-1">page <a class="header-anchor" href="#page" aria-label="Permalink to &quot;page&quot;">​</a></h3><p>runtime 的 <code>page</code> 部分，就是真实项目页面的渲染环境。发布出去的项目页都需要基于该部分来实现渲染功能。而 <code>page</code> 的主要逻辑，就是需要加载 UI，同时实现业务方需要的业务逻辑，比如：</p><ul><li>提供页面需要的全局 api</li><li>业务需要的特殊实现逻辑</li><li>加载第三方全局组件/插件等</li></ul><p>具体的 page 实现示例，可以参考</p><ul><li><a href="https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue3/page" target="_blank" rel="noreferrer">vue3 runtime</a></li><li><a href="https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue2/page" target="_blank" rel="noreferrer">vue2 runtime</a></li><li><a href="https://github.com/Tencent/tmagic-editor/blob/master/runtime/react/page" target="_blank" rel="noreferrer">react runtime</a></li></ul><h3 id="playground" tabindex="-1">playground <a class="header-anchor" href="#playground" aria-label="Permalink to &quot;playground&quot;">​</a></h3><p>runtime 的 <code>playground</code> 部分，和 <code>page</code> 做的事情几乎一致，业务方可以包含上述 <code>page</code> 所拥有的全部能力。但是，因为 playground 需要被编辑器加载，作为编辑器中页面模拟器的渲染容器，和编辑器通信，接受编辑器中组件的增删改查。所以，除了保持和 <code>page</code> 一样的渲染逻辑之外，<code>playground</code> 还要额外实现一套既定通信内容和 api，才能实现和编辑器的通信功能。</p><h4 id="onruntimeready" tabindex="-1">onRuntimeReady <a class="header-anchor" href="#onruntimeready" aria-label="Permalink to &quot;onRuntimeReady&quot;">​</a></h4><p><strong>在 playground 页面渲染后</strong>，需要调用接口通知编辑器完成加载。该调用需要传入一个参数 API，即挂载了增删改查功能的对象示例，提供给编辑器。</p><div class="language-javascript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">javascript</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">window.magic?.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">onRuntimeReady</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">API</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span></code></pre></div><h4 id="onpageelupdate" tabindex="-1">onPageElUpdate <a class="header-anchor" href="#onpageelupdate" aria-label="Permalink to &quot;onPageElUpdate&quot;">​</a></h4><p><strong>playground 在每次更新了页面配置后</strong>，调用一次 onPageElUpdate 并传入一个 DOM 节点，该方法作用是传入一个页面渲染组件的根节点，用来告知编辑器的模拟器遮罩如何作出反应。</p><div class="language-javascript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">javascript</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">window.magic.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">onPageElUpdate</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(document.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">querySelector</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;.magic-ui-page&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">));</span></span></code></pre></div><h4 id="提供-api" tabindex="-1">提供 API <a class="header-anchor" href="#提供-api" aria-label="Permalink to &quot;提供 API&quot;">​</a></h4><table tabindex="0"><thead><tr><th>API</th><th>说明</th><th>参数</th></tr></thead><tbody><tr><td>updateRootConfig</td><td>根节点更新</td><td><code>root: MApp</code></td></tr><tr><td>updatePageId</td><td>更新当前页面 id</td><td><code>id: string</code></td></tr><tr><td>select</td><td>选中组件</td><td><code>id: string</code></td></tr><tr><td>add</td><td>增加组件</td><td>{ <code>config</code> , <code>root</code> }: <code>UpdateData</code></td></tr><tr><td>update</td><td>更新组件</td><td>{ <code>config</code> , <code>root</code> }: <code>UpdateData</code></td></tr><tr><td>remove</td><td>删除组件</td><td>{ <code>config</code> , <code>root</code> }: <code>UpdateData</code></td></tr><tr><td>sortNode</td><td>组件在容器间排序</td><td>{ <code>src</code> , <code>dist</code>, <code>root</code> }: <code>SortEventData</code></td></tr></tbody></table><p>runtime 的实现示例，可以参考tmagic-editor提供的：</p><ul><li><a href="https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue3" target="_blank" rel="noreferrer">vue3 runtime</a></li><li><a href="https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue2" target="_blank" rel="noreferrer">vue2 runtime</a></li><li><a href="https://github.com/Tencent/tmagic-editor/blob/master/runtime/react" target="_blank" rel="noreferrer">react runtime</a></li></ul><h3 id="页面发布" tabindex="-1">页面发布 <a class="header-anchor" href="#页面发布" aria-label="Permalink to &quot;页面发布&quot;">​</a></h3><p>如介绍中提到的，tmagic-editor页面发布方案，是对构建产物 <code>page/index.html</code> 进行项目信息注入。项目信息就是搭建平台存储的页面配置。发布时，将注入项目信息的 <code>page/index.html</code> 发布出去即可。</p><h2 id="版本管理" tabindex="-1">版本管理 <a class="header-anchor" href="#版本管理" aria-label="Permalink to &quot;版本管理&quot;">​</a></h2><p>基于上一步提到的打包原理，每次构建后，得到的产物都可以进行归档编号，存为版本。涉及到的组件改动和新增修改，体现在各个版本中。</p><img src="https://image.video.qpic.cn/oa_88b7d-32_1233288257_1633783105283986" width="40%" alt="版本选择"><p>版本管理具体如何实现，这取决于使用tmagic-editor的业务方。版本管理具有如下优点：</p><ol><li>对于已经配置好发布的项目，使用固定版本，不会被新版本的特性影响，保证项目线上稳定运行</li><li>发布的新版本如果出现问题，可以及时回退选择使用旧版本</li></ol><h2 id="结合业务定制" tabindex="-1">结合业务定制 <a class="header-anchor" href="#结合业务定制" aria-label="Permalink to &quot;结合业务定制&quot;">​</a></h2><p>tmagic-editor的静态资源构建，项目配置保存，页面发布，在tmagic-editor的提供的示例方案中，流程是：</p><ol><li>触发构建，执行流水线，基于 runtime 执行 build</li><li>将构建产物归档推送至 cdn，存为一个ui版本</li><li>项目配保存后，项目发布时，将项目配置发布至 CDN 存储为 DSL.js，同时根据当前项目使用的ui版本，获取到 page/index.html，将 DSL.js 引用方式以 script 标签形式写入。</li><li>将注入信息的 page/index.html 发布为项目静态资源 act.html</li><li>线上可加载 act.html 访问项目</li></ol><p>其中各个步骤的定制，可以交由业务方根据tmagic-editor提供的示例进行自定义修改。</p>',34)]))}const g=t(d,[["render",o]]);export{u as __pageData,g as default};

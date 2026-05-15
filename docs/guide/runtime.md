# RUNTIME

本章详细介绍 tmagic-editor 中 runtime 的概念、目录结构与实现方式。所有内容均与开源仓库 [`runtime/vue/`](https://github.com/Tencent/tmagic-editor/tree/master/runtime/vue) 一一对应，可以对照阅读。

## runtime 是什么

**runtime 是用来解析 DSL 的执行环境**。编辑器只负责生成 DSL，最终把它**渲染成可见页面**的工作交给 runtime。

在一份完整的 tmagic-editor 项目中，runtime 同时承担两个角色：

| 角色 | 入口 | 用途 |
| --- | --- | --- |
| **page** | `runtime/vue/page/` | 线上发布产物，加载 `window.magicDSL` 渲染真实页面 |
| **playground** | `runtime/vue/playground/` | 编辑器中央 iframe 加载的画布，响应增删改并渲染所见即所得 |

两者共用同一份组件、插件、数据源代码，只在入口（`main.ts` / `App.vue`）上有差异。

::: tip
DSL、playground 与 editor 之间的通信原理可以前往[教程](/guide/tutorial/)继续了解。
:::

## 创建 runtime 项目

::: tip
推荐用 `npm create tmagic@latest` / `pnpm create tmagic` 快速生成 runtime 模板，按提示选择 `runtime` 即可。
:::

生成的项目结构如下（与 [`runtime/vue/`](https://github.com/Tencent/tmagic-editor/tree/master/runtime/vue) 完全一致）：

```bash
runtime/vue
├── page/                 # 线上 page 入口
│   ├── App.vue
│   ├── index.html
│   ├── main.ts
│   └── utils/
├── playground/           # 编辑器内 iframe 入口
│   ├── App.vue
│   ├── index.html
│   └── main.ts
├── public/
├── scripts/              # build 脚本（res / page / playground / all）
├── tmagic.config.ts      # @tmagic/cli 配置：声明组件、插件、数据源
├── tmagic.config.local.ts# 本地覆盖配置（可选）
└── vite.config.ts        # 多入口构建：page + playground
```

## tmagic.config.ts：声明组件 / 插件 / 数据源

`tmagic.config.ts` 是 [@tmagic/cli](./publish.md#tmagic-cli) 的入口，它会扫描 `packages` 列表，生成 `.tmagic/comp-entry.ts` 等 5 个入口文件，runtime 只需要从这些入口里 `import` 即可：

```ts
import { defineConfig } from '@tmagic/cli';

export default defineConfig({
  componentFileAffix: '.vue',
  // 是否使用 vite + 异步组件，详见 page/main.ts 中的 defineAsyncComponent
  dynamicImport: true,
  npmConfig: {
    client: 'pnpm',
    keepPackageJsonClean: true,
  },
  packages: [
    {
      // key 为组件 type，需要与编辑器中 componentGroupList 的 type 对应
      button: '@tmagic/vue-button',
      container: '@tmagic/vue-container',
      img: '@tmagic/vue-img',
      'iterator-container': '@tmagic/vue-iterator-container',
      overlay: '@tmagic/vue-overlay',
      page: '@tmagic/vue-page',
      'page-fragment': '@tmagic/vue-page-fragment',
      'page-fragment-container': '@tmagic/vue-page-fragment-container',
      qrcode: '@tmagic/vue-qrcode',
      text: '@tmagic/vue-text',
    },
  ],
});
```

`tmagic.config.local.ts` 用于本地覆盖（不会被提交），常见用法是把线上 npm 包临时替换为本地组件目录调试。

执行 `npm run tmagic`（即 `tmagic entry`）后，runtime 根目录下会生成：

```bash
.tmagic/
├── comp-entry.ts          # page 同步组件入口
├── async-comp-entry.ts    # page 异步组件入口（dynamicImport 时使用）
├── config-entry.ts        # 编辑器右侧表单配置
├── value-entry.ts         # 组件初始值
├── event-entry.ts         # 组件事件 / 方法列表
├── plugin-entry.ts        # 插件入口
├── datasource-entry.ts          # 同步数据源入口
└── async-datasource-entry.ts    # 异步数据源入口
```

> 详细产物说明见[页面发布 § @tmagic/cli](./publish.md#tmagic-cli)。

## playground runtime 实现

playground 是编辑器中央 iframe 加载的画布，最关键的逻辑就是把编辑器派发的 DSL 变更同步到本地 Vue 状态并触发重新渲染。

`@tmagic/vue-runtime-help` 提供的 `useEditorDsl` Hook 已经帮我们实现了与编辑器的通信（`onRuntimeReady` / `updateRootConfig` / `updatePageId` / `add` / `update` / `remove` 等）；只需要在入口里：

1. 创建 `TMagicApp` 实例，注册组件、数据源、插件；
2. 通过 `provide('app', app)` 把实例注入子组件；
3. 在 `App.vue` 里使用 `useEditorDsl()` + `useComponent('page')` 渲染页面。

完整的 [`runtime/vue/playground/main.ts`](https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue/playground/main.ts)：

```ts
import { createApp } from 'vue';
import TMagicApp, { DataSourceManager, DeepObservedData } from '@tmagic/core';

import App from './App.vue';

import '@tmagic/core/resetcss.css';

DataSourceManager.registerObservedData(DeepObservedData);

Promise.all([
  import('../.tmagic/comp-entry'),
  import('../.tmagic/plugin-entry'),
  import('../.tmagic/datasource-entry'),
]).then(([components, plugins, dataSources]) => {
  const vueApp = createApp(App);

  const app = new TMagicApp({
    ua: window.navigator.userAgent,
    platform: 'editor',
  });

  if (app.env.isWeb) {
    app.setDesignWidth(window.document.documentElement.getBoundingClientRect().width);
  }

  Object.entries(components.default).forEach(([type, component]: [string, any]) => {
    app.registerComponent(type, component);
  });

  Object.entries(dataSources.default).forEach(([type, ds]: [string, any]) => {
    DataSourceManager.register(type, ds);
  });

  Object.values(plugins.default).forEach((plugin: any) => {
    vueApp.use(plugin, { app });
  });

  window.appInstance = app;
  vueApp.config.globalProperties.app = app;
  vueApp.provide('app', app);

  vueApp.mount('#app');
});
```

[`playground/App.vue`](https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue/playground/App.vue) 出乎意料地短：

```vue
<template>
  <component v-if="pageConfig" :is="pageComponent" :key="pageConfig.id" :config="pageConfig"></component>
</template>

<script lang="ts" setup>
import { useComponent, useEditorDsl } from '@tmagic/vue-runtime-help';

const { pageConfig } = useEditorDsl();
const pageComponent = useComponent('page');
</script>
```

::: tip 关键点
- `platform: 'editor'` 告知 `@tmagic/core` 进入编辑模式；
- `useEditorDsl()` 内部已经调用 `window.magic?.onRuntimeReady({...})`，把 add/update/remove 等回调挂载到全局，编辑器通过 `iframe.contentWindow.magic` 触发；
- 当 DSL 变化时，`pageConfig` 自动更新；当页面 DOM 渲染完成，`useEditorDsl` 会调用 `magic.onPageElUpdate(...)` 把页面元素同步给编辑器，让选中框能够吸附。
:::

## page runtime 实现（线上发布）

[`runtime/vue/page/main.ts`](https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue/page/main.ts) 与 playground 的差别在于：

1. 不需要响应编辑器消息，直接读取 `window.magicDSL`（或 `localPreview` 模式下从 `localStorage` 读取）；
2. 使用 `defineAsyncComponent` + 异步入口，按需加载组件，**减小首屏体积**；
3. 数据源走 `registerDataSourceOnDemand`，只注册当前 DSL 用到的；
4. 注入 `request` 与 `userRender` 等业务侧 API 给组件复用。

```ts
import { createApp, defineAsyncComponent, resolveDirective, withDirectives } from 'vue';

import TMagicApp, { DataSourceManager, DeepObservedData, getUrlParam, registerDataSourceOnDemand } from '@tmagic/core';

import components from '../.tmagic/async-comp-entry';
import asyncDataSources from '../.tmagic/async-datasource-entry';
import plugins from '../.tmagic/plugin-entry';

import request, { service } from './utils/request';
import AppComponent from './App.vue';
import { getLocalConfig } from './utils';

import '@tmagic/core/resetcss.css';

DataSourceManager.registerObservedData(DeepObservedData);

const vueApp = createApp(AppComponent);
vueApp.use(request);

const dsl = ((getUrlParam('localPreview') ? getLocalConfig() : window.magicDSL) || [])[0] || {};

const app = new TMagicApp({
  ua: window.navigator.userAgent,
  config: dsl,
  request: service,
  curPage: getUrlParam('page'),
  useMock: Boolean(getUrlParam('useMock')),
});

app.setDesignWidth(app.env.isWeb ? window.document.documentElement.getBoundingClientRect().width : 375);

Object.entries(components).forEach(([type, component]: [string, any]) => {
  app.registerComponent(type, defineAsyncComponent(component));
});

Object.values(plugins).forEach((plugin: any) => {
  vueApp.use(plugin, { app });
});

registerDataSourceOnDemand(dsl, asyncDataSources).then((dataSources) => {
  Object.entries(dataSources).forEach(([type, ds]: [string, any]) => {
    DataSourceManager.register(type, ds);
  });

  vueApp.config.globalProperties.app = app;
  vueApp.provide('app', app);
  vueApp.mount('#app');
});
```

[`page/App.vue`](https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue/page/App.vue) 用 `useDsl()`（注意不是 `useEditorDsl`）：

```vue
<template>
  <component :is="pageComponent" :config="pageConfig as MPage"></component>
</template>

<script lang="ts" setup>
import type { MPage } from '@tmagic/core';
import { useComponent, useDsl } from '@tmagic/vue-runtime-help';

const { pageConfig, app } = useDsl();
const pageComponent = useComponent('page');
</script>
```

## vite 多入口构建

`runtime/vue` 通过单个 vite 工程构建出两份产物（[`vite.config.ts`](https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue/vite.config.ts)）：

```ts
build: {
  rolldownOptions: {
    input: {
      page: path.resolve(__dirname, './page/index.html'),
      playground: path.resolve(__dirname, './playground/index.html'),
    },
  },
}
```

加上 `package.json` 中提供的 build 脚本：

```json
{
  "scripts": {
    "tmagic": "tmagic entry",
    "dev": "vite --force",
    "build": "rimraf ./dist && node scripts/build.mjs --type=all",
    "build:libs": "node scripts/build.mjs --type=res",
    "build:page": "node scripts/build.mjs --type=page",
    "build:playground": "node scripts/build.mjs --type=playground"
  }
}
```

最常用的两个：

- `npm run build:libs`：构建 **编辑器侧**用到的 `config / value / event / ds-config / ds-value` 五份 UMD 资源（输出到 `dist/entry/`），编辑器通过 `asyncLoadJs` 异步加载（参考[快速开始 § propsConfigs / propsValues](./index.md#propsconfigs-propsvalues)）。
- `npm run build`：同时产出 `playground/index.html`、`page/index.html` 与 `entry/`，可以一份产物覆盖编辑器、预览、线上三种场景。

## @tmagic/vue-runtime-help 常用 Hook

| Hook | 作用 |
| --- | --- |
| `useEditorDsl()` | playground 入口使用，建立与编辑器通信、维护当前页面 `pageConfig` |
| `useDsl()` | page 入口使用，从 `window.magicDSL` 中读取并维护 `pageConfig` |
| `useComponent(type)` | 通过组件 type 解析出已注册的 Vue 组件（找不到时会回退到 `magic-ui-${type}`） |
| `useApp()` | 取出注入的 `TMagicApp` 实例 |
| `useComponentStatus()` | 获取组件在编辑器中的展示/禁用状态 |

::: tip
React runtime 的实现思路完全一致，对应包是 [`@tmagic/react-runtime-help`](https://github.com/Tencent/tmagic-editor/tree/master/runtime/react-runtime-help)，可以参照本节自行迁移。
:::

## 跨域

playground 是被编辑器以 iframe 形式加载的，开发期需要保证 runtime 服务允许跨域。仓库里的做法是用 Vite 的 proxy 把 runtime 反代到 playground 同域：

```ts
// playground/vite.config.ts
server: {
  port: 8098,
  proxy: {
    '^/tmagic-editor/playground/runtime': {
      target: 'http://127.0.0.1:8078',
      changeOrigin: true,
      prependPath: false,
    },
  },
}
```

如果编辑器和 runtime 跨域部署，需要在 runtime 服务侧返回 `Access-Control-Allow-Origin`，并保证 iframe 的 `postMessage` 同源策略允许双方通信。

## 进一步阅读

- [基础概念](./conception.md)：编辑器、模拟器、runtime 的关系
- [组件开发](./component.md)：组件四件套（component / form-config / init-value / event）
- [页面发布](./publish.md)：page.html 注入 DSL 的发布流程
- [教程](./tutorial/index.md)：从零实现一份 runtime，理解 magic API 与 DSL 解析

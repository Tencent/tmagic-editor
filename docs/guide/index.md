# 快速开始

tmagic-editor 的编辑器已经封装成 npm 包，可以直接安装使用。编辑器使用 Vue 3 开发（**仅支持 Vue 3**），但承载真实业务的 runtime 不限框架，可以使用 Vue 2、Vue 3、React 等开发业务组件。

整个项目结构由两部分组成：

- **admin-client**（编辑器 / 管理端）：基于 `@tmagic/editor`，加载 runtime iframe、提供拖拽/属性配置/发布等能力。
- **runtime**（运行时）：负责解析 DSL 并渲染页面，分为编辑器内嵌的 `playground` 和线上发布使用的 `page` 两个产物。

> 仓库 [`playground/`](https://github.com/Tencent/tmagic-editor/tree/master/playground) 与 [`runtime/vue/`](https://github.com/Tencent/tmagic-editor/tree/master/runtime/vue) 就是一份完整可运行的最小实践，本节内容均与之对齐，可以对照阅读源码。

## 使用脚手架创建（推荐）

::: code-group

```bash [npm]
$ npm create tmagic@latest
```

```bash [pnpm]
$ pnpm create tmagic
```

:::

按照交互式提示，可以创建以下 `6` 种项目：

| 类型           | 说明                           |
| -------------- | ------------------------------ |
| `runtime`      | 运行时（DSL 渲染）             |
| `admin-client` | 管理端（编辑器）               |
| `components`   | 组件库（组件 / 插件 / 数据源） |
| `component`    | 单个组件                       |
| `data-source`  | 单个数据源                     |
| `plugin`       | 单个插件                       |

最少需要一个 `runtime` 加一个 `admin-client`，就能跑起一个完整的可视化搭建流程。后续可以再陆续创建组件、插件、数据源；新建好后到 `runtime/tmagic.config.ts` 的 `packages` 中注册即可，参考[组件开发](./component.md) 与[页面发布 § @tmagic/cli](./publish.md#tmagic-cli)。

## 手动安装

::: tip 环境要求

- Node.js `^20.19.0 || >=22.12.0`
- 推荐使用 [Vite](https://cn.vitejs.dev/)；如果使用 [Vue CLI](https://cli.vuejs.org/zh/) 需要在 `vue.config.js` 中加上 `transpileDependencies: [/@tmagic/]`
  :::

### 1. 安装编辑器依赖

`@tmagic/editor` 把内部使用到的 UI 组件抽象到了 `@tmagic/design`，通过 **adapter** 的形式接入具体的 UI 组件库。我们提供了：

- [`@tmagic/element-plus-adapter`](https://github.com/Tencent/tmagic-editor/tree/master/packages/element-plus-adapter)：接入 [Element Plus](https://element-plus.org/)
- [`@tmagic/tdesign-vue-next-adapter`](https://github.com/Tencent/tmagic-editor/tree/master/packages/tdesign-vue-next-adapter)：接入 [TDesign Vue Next](https://tdesign.tencent.com/vue-next/overview)

任选其一即可，下面以 Element Plus 为例：

```bash
$ npm install @tmagic/editor @tmagic/core @tmagic/element-plus-adapter element-plus -S
```

`@tmagic/editor` 内部使用了 [monaco-editor](https://microsoft.github.io/monaco-editor/) 作为代码编辑器，需要额外安装并按照官方[配置指引](https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md)注入 worker：

```bash
$ npm install monaco-editor -S
```

### 2. 引入 @tmagic/editor

参考 [`playground/src/main.ts`](https://github.com/Tencent/tmagic-editor/blob/master/playground/src/main.ts)，在入口文件中按以下顺序完成 Monaco worker、UI 库样式、editor 样式与 adapter 的注入：

```ts
import { createApp } from "vue";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

import editorPlugin from "@tmagic/editor";
import MagicElementPlusAdapter from "@tmagic/element-plus-adapter";

import App from "./App.vue";

import "element-plus/dist/index.css";
import "@tmagic/editor/dist/style.css";

// @ts-ignore
globalThis.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "json") return new JsonWorker();
    if (["css", "scss", "less"].includes(label)) return new CssWorker();
    if (["html", "handlebars", "razor"].includes(label))
      return new HtmlWorker();
    if (["typescript", "javascript"].includes(label)) return new TsWorker();
    return new EditorWorker();
  },
};

createApp(App).use(editorPlugin, MagicElementPlusAdapter).mount("#app");
```

::: tip 切换 UI 适配器
playground 通过 `sessionStorage` 来切换 adapter，参考实现：

```ts
const adapter =
  sessionStorage.getItem("tmagic-playground-ui-adapter") || "element-plus";
const adapterModule =
  adapter === "tdesign-vue-next"
    ? import("@tmagic/tdesign-vue-next-adapter")
    : import("@tmagic/element-plus-adapter");
```

:::

::: tip 常见报错

1. `Preprocessor dependency "sass" not found.` —— 安装 sass：`npm i sass -D`
2. `Uncaught ReferenceError: global is not defined` —— Vite 项目需要在 `vite.config.ts` 中加上：

```ts
// vite 8以下版本
optimizeDeps: {
  esbuildOptions: {
    define: { global: 'globalThis' },
  },
}
```

```ts
// vite 8及以上
define: {
  global: 'globalThis',
},
```

:::

### 3. 渲染 m-editor

在 `App.vue` 中渲染 `<TMagicEditor />`（即 `m-editor` 组件），最少需要传入 `v-model`、`runtime-url`、`component-group-list`、`props-configs`、`props-values` 五个核心属性：

```vue
<template>
  <div class="editor-app">
    <TMagicEditor
      v-model="value"
      ref="editor"
      :menu="menu"
      :runtime-url="runtimeUrl"
      :props-configs="propsConfigs"
      :props-values="propsValues"
      :event-method-list="eventMethodList"
      :datasource-configs="datasourceConfigs"
      :datasource-values="datasourceValues"
      :datasource-event-method-list="datasourceEventMethodList"
      :component-group-list="componentGroupList"
      :default-selected="defaultSelected"
      :stage-rect="stageRect"
      :auto-scroll-into-view="true"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, shallowRef } from "vue";
import type { MApp } from "@tmagic/core";
import { TMagicEditor } from "@tmagic/editor";

import componentGroupList from "./configs/componentGroupList";
import dsl from "./configs/dsl";
import { useEditorRes } from "./composables/use-editor-res";

const editor = shallowRef<InstanceType<typeof TMagicEditor>>();
const value = ref<MApp>(dsl);
const defaultSelected = ref(dsl.items[0].id);
const stageRect = ref({ width: 375, height: 817 });

const { VITE_RUNTIME_PATH } = import.meta.env;
const runtimeUrl = `${VITE_RUNTIME_PATH}/playground/index.html`;

const {
  propsValues,
  propsConfigs,
  eventMethodList,
  datasourceConfigs,
  datasourceValues,
  datasourceEventMethodList,
} = useEditorRes();

const menu = {
  left: [{ type: "text", text: "魔方" }],
  center: ["delete", "undo", "redo", "guides", "rule", "zoom"],
  right: [
    {
      type: "button",
      text: "保存",
      handler: () =>
        localStorage.setItem("magicDSL", JSON.stringify(value.value)),
    },
  ],
};
</script>

<style lang="scss">
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
.editor-app {
  width: 100%;
  height: 100%;
}
.editor-app .m-editor {
  flex: 1;
  height: 100%;
}
</style>
```

完整的菜单/预览/键盘快捷键实现可以参考 [`playground/src/pages/Editor.vue`](https://github.com/Tencent/tmagic-editor/blob/master/playground/src/pages/Editor.vue)。

更多 prop 详见[编辑器 API](../api/editor/props.md)，下文重点介绍最关键的 4 个：`runtimeUrl`、`componentGroupList`、`propsConfigs/propsValues`、初始 DSL（`v-model`）。

## runtimeUrl

编辑器中央的模拟器画布是一个 `iframe`，`runtimeUrl` 就是这个 iframe 加载的地址，里面运行着一份 **playground runtime**，负责响应编辑器中组件的增删改查。

playground 中通过 Vite proxy 把 runtime 服务（默认端口 `8078`）代理到了同一个域：

```ts
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

实际项目中可以使用 `npm create tmagic` 快速生成一个 runtime 项目，详见[RUNTIME](./runtime.md)。

## componentGroupList

`componentGroupList` 决定左侧组件库展示哪些组件分组。每个 item 通过 `type` 与 runtime 中注册的组件类型一一对应，添加到画布时编辑器会基于 `type` 通知 runtime 渲染对应组件。

```ts
import {
  Files,
  FolderOpened,
  PictureFilled,
  SwitchButton,
  Tickets,
} from "@element-plus/icons-vue";
import type { ComponentGroup } from "@tmagic/editor";

export default [
  {
    title: "示例容器",
    items: [
      { icon: FolderOpened, text: "组", type: "container" },
      { icon: FolderOpened, text: "蒙层", type: "overlay" },
      { icon: Files, text: "迭代器容器", type: "iterator-container" },
    ],
  },
  {
    title: "示例组件",
    items: [
      { icon: Tickets, text: "文本", type: "text" },
      { icon: SwitchButton, text: "按钮", type: "button" },
      { icon: PictureFilled, text: "图片", type: "img" },
    ],
  },
  // 也可以提供完整 schema 作为「组合」，添加时直接落入完整子树
  {
    title: "组合",
    items: [
      {
        icon: Tickets,
        text: "弹窗",
        data: {
          type: "overlay",
          name: "弹窗",
          style: {
            position: "fixed",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
          },
          items: [
            /* ... */
          ],
        },
      },
    ],
  },
] as ComponentGroup[];
```

完整字段参考 [`componentGroupList`](../api/editor/props.md#componentgrouplist)。

## propsConfigs / propsValues

`propsConfigs` `propsValues` 与 `componentGroupList` 中声明的组件通过 `type` 一一对应：

- `propsConfigs[type]`：组件**右侧表单**的配置描述（在组件中 `formConfig` 字段提供）。
- `propsValues[type]`：组件被添加到画布时的**初始默认值**（在组件中 `initValue` 字段提供）。

这些内容会通过 `@tmagic/cli` 在 runtime 构建时打包出对应的 UMD 文件，编辑器异步加载即可。playground 中的真实做法（[`use-editor-res.ts`](https://github.com/Tencent/tmagic-editor/blob/master/playground/src/pages/composables/use-editor-res.ts)）：

```ts
import { ref } from "vue";
import { asyncLoadJs } from "@tmagic/editor";

const { VITE_ENTRY_PATH } = import.meta.env;

export const useEditorRes = () => {
  const propsValues = ref<Record<string, any>>({});
  const propsConfigs = ref<Record<string, any>>({});
  const eventMethodList = ref<Record<string, any>>({});
  const datasourceConfigs = ref<Record<string, any>>({});
  const datasourceValues = ref<Record<string, any>>({});
  const datasourceEventMethodList = ref<Record<string, any>>({
    base: { events: [], methods: [] },
  });

  asyncLoadJs(`${VITE_ENTRY_PATH}/config/index.umd.cjs`).then(() => {
    propsConfigs.value = (globalThis as any).magicPresetConfigs;
  });
  asyncLoadJs(`${VITE_ENTRY_PATH}/value/index.umd.cjs`).then(() => {
    propsValues.value = (globalThis as any).magicPresetValues;
  });
  asyncLoadJs(`${VITE_ENTRY_PATH}/event/index.umd.cjs`).then(() => {
    eventMethodList.value = (globalThis as any).magicPresetEvents;
  });
  asyncLoadJs(`${VITE_ENTRY_PATH}/ds-config/index.umd.cjs`).then(() => {
    datasourceConfigs.value = (globalThis as any).magicPresetDsConfigs;
  });
  asyncLoadJs(`${VITE_ENTRY_PATH}/ds-value/index.umd.cjs`).then(() => {
    datasourceValues.value = (globalThis as any).magicPresetDsValues;
  });

  return {
    propsValues,
    propsConfigs,
    eventMethodList,
    datasourceConfigs,
    datasourceValues,
    datasourceEventMethodList,
  };
};
```

::: tip 怎样得到这些 UMD 文件？
在 runtime 项目中执行 `npm run build:libs`（参考 [`runtime/vue/package.json`](https://github.com/Tencent/tmagic-editor/blob/master/runtime/vue/package.json)），会在 `dist/entry/` 下生成 `config/value/event/ds-config/ds-value` 五个目录的 UMD 文件，全局变量分别为 `magicPresetConfigs` `magicPresetValues` `magicPresetEvents` `magicPresetDsConfigs` `magicPresetDsValues`。
:::

如果是在调试期，也可以直接 hardcode 一份 `propsConfigs` / `propsValues`，比如：

```ts
const propsConfigs = ref({
  text: [{ name: "text", text: "文案" }],
  button: [{ name: "text", text: "按钮文案" }],
});

const propsValues = ref({
  text: { text: "一段文字" },
  button: { text: "按钮" },
});
```

## v-model：DSL 初始值

`v-model` 绑定的是整个页面的 [DSL](./advanced/js-schema.md)，最简的初始 DSL 长这样：

```ts
import { type MApp, NodeType } from "@tmagic/core";

const dsl: MApp = {
  id: "1",
  name: "demo",
  type: NodeType.ROOT,
  items: [
    {
      type: NodeType.PAGE,
      id: "page_1",
      name: "index",
      layout: "absolute",
      style: { position: "relative", width: "100%", height: "100%" },
      items: [],
    },
  ],
};
```

完整含数据源、代码块、事件联动的 DSL 示例见 [`playground/src/configs/dsl.ts`](https://github.com/Tencent/tmagic-editor/blob/master/playground/src/configs/dsl.ts)。

::: tip 持久化与历史记录
playground 用 `localStorage` + `serialize-javascript` 做了一个本地持久化方案，并在保存后调用 `editor.editorService.resetModifiedNodeId()` 重置修改状态，可以直接复用。
:::

## 进阶：编辑器服务与插件

`@tmagic/editor` 提供了多组 **service**（`editorService` / `propsService` / `historyService` / `uiService` …）和 **插件机制**，可以非侵入式扩展行为。例如 playground 中：

```ts
import { editorService, propsService } from "@tmagic/editor";

editorService.usePlugin({
  beforeDoAdd: (config, parent) => {
    if (config.type === "overlay") {
      // 蒙层始终插入到当前 page 下，并钉到 (0, 0)
      config.style = { ...config.style, left: 0, top: 0 };
      return [config, editorService.get("page")];
    }
    return [config, parent];
  },
});

propsService.usePlugin({
  beforeFillConfig: (config) => [config, "100px"],
});
```

更多扩展能力见[编辑器扩展](./editor-expand.md)与各 service 的 [API 文档](../api/editor/props.md)。

## 下一步

- [基础概念](./conception.md)：编辑器 / 模拟器 / runtime / DSL 的关系
- [RUNTIME](./runtime.md)：实现并打包一个 runtime
- [组件开发](./component.md)：自定义业务组件
- [页面发布](./publish.md)：基于 `@tmagic/cli` 的产物结构与发布流程
- [Playground 源码](https://github.com/Tencent/tmagic-editor/tree/master/playground)：与本节示例完全对应

通过 `pnpm bootstrap && pnpm pg` 即可在仓库本地启动这份 playground，自由调试。

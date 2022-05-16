import { A as App$1 } from "./resetcss.e39ac995.js";
import { a as getNodePath, _ as _export_sfc } from "./plugin-vue_export-helper.adee6e2f.js";
var playground_html_htmlProxy_index_0 = "";
const scriptRel = "modulepreload";
const seen = {};
const base = "/tmagic-editor/playground/runtime/vue3/";
const __vitePreload = function preload(baseModule, deps) {
  if (!deps || deps.length === 0) {
    return baseModule();
  }
  return Promise.all(deps.map((dep) => {
    dep = `${base}${dep}`;
    if (dep in seen)
      return;
    seen[dep] = true;
    const isCss = dep.endsWith(".css");
    const cssSelector = isCss ? '[rel="stylesheet"]' : "";
    if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
      return;
    }
    const link = document.createElement("link");
    link.rel = isCss ? "stylesheet" : scriptRel;
    if (!isCss) {
      link.as = "script";
      link.crossOrigin = "";
    }
    link.href = dep;
    document.head.appendChild(link);
    if (isCss) {
      return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(new Error(`Unable to preload CSS for ${dep}`)));
      });
    }
  })).then(() => baseModule());
};
var App_vue_vue_type_style_index_0_lang = "";
const _sfc_main = Vue.defineComponent({
  setup() {
    const root = Vue.ref();
    const curPageId = Vue.ref();
    const selectedId = Vue.ref();
    const pageConfig = Vue.computed(() => {
      var _a, _b, _c, _d;
      return ((_b = (_a = root.value) == null ? void 0 : _a.items) == null ? void 0 : _b.find((item) => item.id === curPageId.value)) || ((_d = (_c = root.value) == null ? void 0 : _c.items) == null ? void 0 : _d[0]);
    });
    const app = new App$1({
      config: root.value,
      platform: "editor"
    });
    Vue.provide("app", app);
    Vue.watch(pageConfig, async () => {
      await Vue.nextTick();
      const page = document.querySelector(".magic-ui-page");
      page && window.magic.onPageElUpdate(page);
    });
    Vue.onMounted(() => {
      var _a;
      (_a = window.magic) == null ? void 0 : _a.onRuntimeReady({
        updateRootConfig(config) {
          console.log("update config", config);
          root.value = config;
          app == null ? void 0 : app.setConfig(config, curPageId.value);
        },
        updatePageId(id) {
          console.log("update page id", id);
          curPageId.value = id;
          app == null ? void 0 : app.setPage(id);
        },
        getSnapElements() {
          return Array.from(document.querySelectorAll("[class*=magic-ui][id]"));
        },
        select(id) {
          console.log("select config", id);
          selectedId.value = id;
          const el = document.getElementById(`${id}`);
          if (el)
            return el;
          return Vue.nextTick().then(() => document.getElementById(`${id}`));
        },
        add({ config }) {
          var _a2;
          console.log("add config", config);
          if (!root.value)
            throw new Error("error");
          if (!selectedId.value)
            throw new Error("error");
          const path = getNodePath(selectedId.value, [root.value]);
          const node = path.pop();
          const parent = (node == null ? void 0 : node.items) ? node : path.pop();
          if (!parent)
            throw new Error("\u672A\u627E\u5230\u7236\u8282\u70B9");
          (_a2 = parent.items) == null ? void 0 : _a2.push(config);
        },
        update({ config }) {
          var _a2;
          console.log("update config", config);
          if (!root.value)
            throw new Error("error");
          const path = getNodePath(config.id, [root.value]);
          const node = path.pop();
          const parent = path.pop();
          if (!node)
            throw new Error("\u672A\u627E\u5230\u76EE\u6807\u8282\u70B9");
          if (!parent)
            throw new Error("\u672A\u627E\u5230\u7236\u8282\u70B9");
          const index = (_a2 = parent.items) == null ? void 0 : _a2.findIndex((child) => child.id === node.id);
          parent.items.splice(index, 1, Vue.reactive(config));
        },
        remove({ id }) {
          var _a2;
          if (!root.value)
            throw new Error("error");
          const path = getNodePath(id, [root.value]);
          const node = path.pop();
          if (!node)
            throw new Error("\u672A\u627E\u5230\u76EE\u6807\u5143\u7D20");
          const parent = path.pop();
          if (!parent)
            throw new Error("\u672A\u627E\u5230\u7236\u5143\u7D20");
          const index = (_a2 = parent.items) == null ? void 0 : _a2.findIndex((child) => child.id === node.id);
          parent.items.splice(index, 1);
        }
      });
    });
    return {
      pageConfig
    };
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_magic_ui_page = Vue.resolveComponent("magic-ui-page");
  return _ctx.pageConfig ? (Vue.openBlock(), Vue.createBlock(_component_magic_ui_page, {
    key: 0,
    config: _ctx.pageConfig
  }, null, 8, ["config"])) : Vue.createCommentVNode("", true);
}
var App = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
const componentUrl = "/tmagic-editor/playground/runtime/vue3/assets/components.js";
__vitePreload(() => import(componentUrl), true ? [] : void 0).then(() => {
  const magicApp = Vue.createApp(App);
  const { components, plugins } = window.magicPresetComponents;
  Object.values(components).forEach((component) => {
    magicApp.component(component.name, component);
  });
  Object.values(plugins).forEach((plugin) => {
    magicApp.use(plugin);
  });
  magicApp.mount("#app");
});
//# sourceMappingURL=playground.js.map

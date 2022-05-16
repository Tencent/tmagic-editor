var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
import { _ as _export_sfc, t as toLine } from "./plugin-vue_export-helper.adee6e2f.js";
var useApp = (props) => {
  var _a, _b;
  const app = Vue.inject("app");
  const node = (_a = app == null ? void 0 : app.page) == null ? void 0 : _a.getNode(props.config.id);
  const vm = (_b = Vue.getCurrentInstance()) == null ? void 0 : _b.proxy;
  node == null ? void 0 : node.emit("created", vm);
  Vue.onMounted(() => {
    node == null ? void 0 : node.emit("mounted", vm);
  });
  Vue.onUnmounted(() => {
    node == null ? void 0 : node.emit("destroy", vm);
  });
  return app;
};
const _sfc_main$4 = Vue.defineComponent({
  name: "magic-ui-page",
  props: {
    config: {
      type: Object,
      defautl: () => ({})
    }
  },
  setup(props) {
    if (props.config) {
      useApp(props);
    }
  }
});
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_magic_ui_container = Vue.resolveComponent("magic-ui-container");
  return Vue.openBlock(), Vue.createBlock(_component_magic_ui_container, {
    class: "magic-ui-page",
    config: _ctx.config
  }, {
    default: Vue.withCtx(() => [
      Vue.renderSlot(_ctx.$slots, "default")
    ]),
    _: 3
  }, 8, ["config"]);
}
var page = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3]]);
var useCommonMethod = (props) => ({
  show: () => {
    props.config.style.display = "initial";
  },
  hide: () => {
    props.config.style.display = "none";
  }
});
const _sfc_main$3 = Vue.defineComponent({
  name: "magic-ui-component",
  props: {
    config: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    var _a;
    const vm = (_a = Vue.getCurrentInstance()) == null ? void 0 : _a.proxy;
    const app = useApp(props);
    Vue.provide("hoc", vm);
    return __spreadValues({
      tagName: Vue.computed(() => `magic-ui-${toLine(props.config.type)}`),
      style: Vue.computed(() => app == null ? void 0 : app.transformStyle(props.config.style)),
      display: () => {
        var _a2;
        const displayCfg = (_a2 = props.config) == null ? void 0 : _a2.display;
        if (typeof displayCfg === "function") {
          return displayCfg(app);
        }
        return displayCfg !== false;
      }
    }, useCommonMethod(props));
  }
});
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
  return _ctx.display() ? (Vue.openBlock(), Vue.createBlock(Vue.resolveDynamicComponent(_ctx.tagName), {
    key: 0,
    id: _ctx.config.id,
    class: Vue.normalizeClass(`magic-ui-component${_ctx.config.className ? ` ${_ctx.config.className}` : ""}`),
    style: Vue.normalizeStyle(_ctx.style),
    config: _ctx.config
  }, null, 8, ["id", "class", "style", "config"])) : Vue.createCommentVNode("", true);
}
var Component = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2]]);
const _sfc_main$2 = Vue.defineComponent({
  name: "magic-ui-container",
  components: {
    "magic-ui-component": Component
  },
  props: {
    config: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const app = useApp(props);
    return __spreadValues({
      style: Vue.computed(() => app == null ? void 0 : app.transformStyle(props.config.style || {})),
      display: () => {
        var _a;
        const displayCfg = (_a = props.config) == null ? void 0 : _a.display;
        if (typeof displayCfg === "function") {
          return displayCfg(app);
        }
        return displayCfg !== false;
      }
    }, useCommonMethod(props));
  }
});
const _hoisted_1 = ["id"];
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_magic_ui_component = Vue.resolveComponent("magic-ui-component");
  return _ctx.display() ? (Vue.openBlock(), Vue.createElementBlock("div", {
    key: 0,
    id: _ctx.config.id,
    class: Vue.normalizeClass(`magic-ui-container${_ctx.config.className ? ` ${_ctx.config.className}` : ""}`),
    style: Vue.normalizeStyle(_ctx.style)
  }, [
    Vue.renderSlot(_ctx.$slots, "default"),
    (Vue.openBlock(true), Vue.createElementBlock(Vue.Fragment, null, Vue.renderList(_ctx.config.items, (item) => {
      return Vue.openBlock(), Vue.createBlock(_component_magic_ui_component, {
        key: item.id,
        config: item
      }, null, 8, ["config"]);
    }), 128))
  ], 14, _hoisted_1)) : Vue.createCommentVNode("", true);
}
var container = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1]]);
const _sfc_main$1 = Vue.defineComponent({
  name: "magic-ui-button",
  props: {
    config: {
      type: Object,
      default: () => ({})
    },
    model: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    var _a;
    const vm = (_a = Vue.getCurrentInstance()) == null ? void 0 : _a.proxy;
    const actions = Vue.reactive([]);
    const actualActions = Vue.computed(() => [
      typeof props.config.preAction === "function" ? props.config.preAction : () => true,
      ...actions,
      typeof props.config.postAction === "function" ? props.config.postAction : () => true
    ]);
    function pushAction(action) {
      actions.push(action);
    }
    async function clickHandler() {
      for (const fn of actualActions.value) {
        if (typeof fn === "function") {
          const ret = await fn(vm, { model: props.model });
          if (ret === false) {
            break;
          }
        }
      }
    }
    const textConfig = Vue.computed(() => {
      var _a2, _b, _c;
      return {
        type: "text",
        text: ((_a2 = props.config) == null ? void 0 : _a2.text) || "",
        disabledText: ((_b = props.config) == null ? void 0 : _b.disabledText) || "",
        html: ((_c = props.config) == null ? void 0 : _c.html) || ""
      };
    });
    return {
      pushAction,
      clickHandler,
      textConfig
    };
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_magic_ui_text = Vue.resolveComponent("magic-ui-text");
  return Vue.openBlock(), Vue.createElementBlock("button", {
    class: "magic-ui-button",
    onClick: _cache[0] || (_cache[0] = (...args) => _ctx.clickHandler && _ctx.clickHandler(...args))
  }, [
    Vue.renderSlot(_ctx.$slots, "default", {}, () => [
      Vue.createVNode(_component_magic_ui_text, { config: _ctx.textConfig }, null, 8, ["config"])
    ])
  ]);
}
var button = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render]]);
const _sfc_main = Vue.defineComponent({
  name: "magic-ui-text",
  props: {
    config: {
      type: Object,
      default: () => ({})
    },
    model: {
      type: Object,
      default: () => ({})
    },
    vars: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    var _a;
    const vm = (_a = Vue.getCurrentInstance()) == null ? void 0 : _a.proxy;
    const hoc = Vue.inject("hoc");
    const displayText = Vue.computed(() => {
      var _a2, _b;
      let text = ((_a2 = props.config) == null ? void 0 : _a2.text) || "";
      const { vars } = props;
      if ((hoc == null ? void 0 : hoc.disabled) && ((_b = props.config) == null ? void 0 : _b.disabledText)) {
        text = props.config.disabledText;
      }
      if (typeof text === "function") {
        return text.bind(vm)(vm, { model: props.model });
      }
      if (Object.prototype.toString.call(vars) === "[object Object]") {
        let tmp = text;
        Object.entries(vars).forEach(([key, value]) => {
          tmp = tmp.replace(new RegExp(`{{${key}}}`, "g"), value);
        });
        return tmp;
      }
      return text || "";
    });
    return {
      displayText
    };
  },
  render() {
    var _a, _b, _c, _d;
    const className = ((_a = this.config) == null ? void 0 : _a.multiple) ? "magic-ui-text" : "magic-ui-text magic-ui-text--single-line";
    if (typeof ((_b = this.$slots) == null ? void 0 : _b.default) === "function") {
      return Vue.h("span", { class: className }, [((_d = (_c = this.$slots) == null ? void 0 : _c.default) == null ? void 0 : _d.call(_c)) || ""]);
    }
    return Vue.h("span", __spreadValues({
      class: className
    }, this.displayText ? { innerHTML: this.displayText } : {}));
  }
});
const components = {
  "page": page,
  "container": container,
  "button": button,
  "text": _sfc_main
};
const plugins = {};
const entry = {
  components,
  plugins
};
window.magicPresetComponents = entry;
export { entry as e };
//# sourceMappingURL=components.js.map

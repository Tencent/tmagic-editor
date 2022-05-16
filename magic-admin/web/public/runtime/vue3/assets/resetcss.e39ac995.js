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
const p = function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(script) {
    const fetchOpts = {};
    if (script.integrity)
      fetchOpts.integrity = script.integrity;
    if (script.referrerpolicy)
      fetchOpts.referrerPolicy = script.referrerpolicy;
    if (script.crossorigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (script.crossorigin === "anonymous")
      fetchOpts.credentials = "omit";
    else
      fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
};
p();
var events = { exports: {} };
var R = typeof Reflect === "object" ? Reflect : null;
var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
  return Function.prototype.apply.call(target, receiver, args);
};
var ReflectOwnKeys;
if (R && typeof R.ownKeys === "function") {
  ReflectOwnKeys = R.ownKeys;
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys2(target) {
    return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys2(target) {
    return Object.getOwnPropertyNames(target);
  };
}
function ProcessEmitWarning(warning) {
  if (console && console.warn)
    console.warn(warning);
}
var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
  return value !== value;
};
function EventEmitter() {
  EventEmitter.init.call(this);
}
events.exports = EventEmitter;
events.exports.once = once2;
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.prototype._events = void 0;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = void 0;
var defaultMaxListeners = 10;
function checkListener(listener) {
  if (typeof listener !== "function") {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}
Object.defineProperty(EventEmitter, "defaultMaxListeners", {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
    }
    defaultMaxListeners = arg;
  }
});
EventEmitter.init = function() {
  if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
    this._events = /* @__PURE__ */ Object.create(null);
    this._eventsCount = 0;
  }
  this._maxListeners = this._maxListeners || void 0;
};
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + ".");
  }
  this._maxListeners = n;
  return this;
};
function _getMaxListeners(that) {
  if (that._maxListeners === void 0)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}
EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};
EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++)
    args.push(arguments[i]);
  var doError = type === "error";
  var events2 = this._events;
  if (events2 !== void 0)
    doError = doError && events2.error === void 0;
  else if (!doError)
    return false;
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      throw er;
    }
    var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
    err.context = er;
    throw err;
  }
  var handler = events2[type];
  if (handler === void 0)
    return false;
  if (typeof handler === "function") {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners2 = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners2[i], this, args);
  }
  return true;
};
function _addListener(target, type, listener, prepend) {
  var m;
  var events2;
  var existing;
  checkListener(listener);
  events2 = target._events;
  if (events2 === void 0) {
    events2 = target._events = /* @__PURE__ */ Object.create(null);
    target._eventsCount = 0;
  } else {
    if (events2.newListener !== void 0) {
      target.emit("newListener", type, listener.listener ? listener.listener : listener);
      events2 = target._events;
    }
    existing = events2[type];
  }
  if (existing === void 0) {
    existing = events2[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === "function") {
      existing = events2[type] = prepend ? [listener, existing] : [existing, listener];
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
      w.name = "MaxListenersExceededWarning";
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }
  return target;
}
EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};
EventEmitter.prototype.on = EventEmitter.prototype.addListener;
EventEmitter.prototype.prependListener = function prependListener(type, listener) {
  return _addListener(this, type, listener, true);
};
function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}
function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: void 0, target, type, listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}
EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};
EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
  checkListener(listener);
  this.prependListener(type, _onceWrap(this, type, listener));
  return this;
};
EventEmitter.prototype.removeListener = function removeListener(type, listener) {
  var list, events2, position, i, originalListener;
  checkListener(listener);
  events2 = this._events;
  if (events2 === void 0)
    return this;
  list = events2[type];
  if (list === void 0)
    return this;
  if (list === listener || list.listener === listener) {
    if (--this._eventsCount === 0)
      this._events = /* @__PURE__ */ Object.create(null);
    else {
      delete events2[type];
      if (events2.removeListener)
        this.emit("removeListener", type, list.listener || listener);
    }
  } else if (typeof list !== "function") {
    position = -1;
    for (i = list.length - 1; i >= 0; i--) {
      if (list[i] === listener || list[i].listener === listener) {
        originalListener = list[i].listener;
        position = i;
        break;
      }
    }
    if (position < 0)
      return this;
    if (position === 0)
      list.shift();
    else {
      spliceOne(list, position);
    }
    if (list.length === 1)
      events2[type] = list[0];
    if (events2.removeListener !== void 0)
      this.emit("removeListener", type, originalListener || listener);
  }
  return this;
};
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
  var listeners2, events2, i;
  events2 = this._events;
  if (events2 === void 0)
    return this;
  if (events2.removeListener === void 0) {
    if (arguments.length === 0) {
      this._events = /* @__PURE__ */ Object.create(null);
      this._eventsCount = 0;
    } else if (events2[type] !== void 0) {
      if (--this._eventsCount === 0)
        this._events = /* @__PURE__ */ Object.create(null);
      else
        delete events2[type];
    }
    return this;
  }
  if (arguments.length === 0) {
    var keys = Object.keys(events2);
    var key;
    for (i = 0; i < keys.length; ++i) {
      key = keys[i];
      if (key === "removeListener")
        continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners("removeListener");
    this._events = /* @__PURE__ */ Object.create(null);
    this._eventsCount = 0;
    return this;
  }
  listeners2 = events2[type];
  if (typeof listeners2 === "function") {
    this.removeListener(type, listeners2);
  } else if (listeners2 !== void 0) {
    for (i = listeners2.length - 1; i >= 0; i--) {
      this.removeListener(type, listeners2[i]);
    }
  }
  return this;
};
function _listeners(target, type, unwrap) {
  var events2 = target._events;
  if (events2 === void 0)
    return [];
  var evlistener = events2[type];
  if (evlistener === void 0)
    return [];
  if (typeof evlistener === "function")
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];
  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}
EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};
EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};
EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === "function") {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};
EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events2 = this._events;
  if (events2 !== void 0) {
    var evlistener = events2[type];
    if (typeof evlistener === "function") {
      return 1;
    } else if (evlistener !== void 0) {
      return evlistener.length;
    }
  }
  return 0;
}
EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};
function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}
function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}
function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}
function once2(emitter, name) {
  return new Promise(function(resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }
    function resolver() {
      if (typeof emitter.removeListener === "function") {
        emitter.removeListener("error", errorListener);
      }
      resolve([].slice.call(arguments));
    }
    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== "error") {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}
function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === "function") {
    eventTargetAgnosticAddListener(emitter, "error", handler, flags);
  }
}
function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === "function") {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === "function") {
    emitter.addEventListener(name, function wrapListener(arg) {
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}
class Env {
  constructor(ua = globalThis.navigator.userAgent, options = {}) {
    this.isIos = false;
    this.isIphone = false;
    this.isIpad = false;
    this.isAndroid = false;
    this.isAnroidPad = false;
    this.isMac = false;
    this.isWin = false;
    this.isMqq = false;
    this.isWechat = false;
    this.isWeb = false;
    this.isIphone = ua.indexOf("iPhone") >= 0;
    this.isIpad = /(iPad).*OS\s([\d_]+)/.test(ua);
    this.isIos = this.isIphone || this.isIpad;
    this.isAndroid = ua.indexOf("Android") >= 0;
    this.isAnroidPad = this.isAndroid && ua.indexOf("Mobile") < 0;
    this.isMac = ua.indexOf("Macintosh") >= 0;
    this.isWin = ua.indexOf("Windows") >= 0;
    this.isMqq = /QQ\/([\d.]+)/.test(ua);
    this.isWechat = ua.indexOf("MicroMessenger") >= 0 && ua.indexOf("wxwork") < 0;
    this.isWeb = !this.isIos && !this.isAndroid && !/(WebOS|BlackBerry)/.test(ua);
    Object.entries(options).forEach(([key, value]) => {
      this[key] = value;
    });
  }
}
const COMMON_EVENT_PREFIX = "magic:common:events:";
const COMMON_METHOD_PREFIX = "magic:common:actions:";
const CommonMethod = {
  SHOW: "show",
  HIDE: "hide",
  SCROLL_TO_VIEW: "scrollIntoView",
  SCROLL_TO_TOP: "scrollToTop"
};
const DEFAULT_EVENTS = [{ label: "\u70B9\u51FB", value: `${COMMON_EVENT_PREFIX}click` }];
const getCommonEventName = (commonEventName, nodeId) => {
  const returnName = `${commonEventName}:${nodeId}`;
  if (commonEventName.startsWith(COMMON_EVENT_PREFIX))
    return returnName;
  return `${COMMON_EVENT_PREFIX}${returnName}`;
};
const isCommonMethod = (methodName) => methodName.startsWith(COMMON_METHOD_PREFIX);
const getDirectComponent = (element, app) => {
  var _a;
  if (!element) {
    return false;
  }
  if (!element.id) {
    return getDirectComponent(element.parentElement, app);
  }
  const node = (_a = app.page) == null ? void 0 : _a.getNode(element.id);
  if (!node) {
    return false;
  }
  return node;
};
const commonClickEventHandler = (app, eventName, e) => {
  const node = getDirectComponent(e.target, app);
  if (node) {
    const { instance, data } = node;
    app.emit(getCommonEventName(eventName, data.id), instance);
  }
};
const bindCommonEventListener = (app) => {
  window.document.body.addEventListener("click", (e) => {
    commonClickEventHandler(app, "click", e);
  });
  window.document.body.addEventListener("click", (e) => {
    commonClickEventHandler(app, "click:capture", e);
  }, true);
};
const triggerCommonMethod = (methodName, node) => {
  const { instance } = node;
  switch (methodName.replace(COMMON_METHOD_PREFIX, "")) {
    case CommonMethod.SHOW:
      instance.show();
      break;
    case CommonMethod.HIDE:
      instance.hide();
      break;
    case CommonMethod.SCROLL_TO_VIEW:
      instance.$el.scrollIntoView({ behavior: "smooth" });
      break;
    case CommonMethod.SCROLL_TO_TOP:
      window.scrollTo({ top: 0, behavior: "smooth" });
      break;
  }
};
class Node extends events.exports.EventEmitter {
  constructor(config) {
    super();
    const { events: events2 } = config;
    this.data = config;
    this.events = events2;
    this.listenLifeSafe();
    this.once("destroy", () => {
      this.instance = null;
      if (typeof this.data.destroy === "function") {
        this.data.destroy(this);
      }
      this.listenLifeSafe();
    });
  }
  listenLifeSafe() {
    this.once("created", (instance) => {
      this.instance = instance;
      if (typeof this.data.created === "function") {
        this.data.created(this);
      }
    });
    this.once("mounted", (instance) => {
      this.instance = instance;
      if (typeof this.data.mounted === "function") {
        this.data.mounted(this);
      }
    });
  }
}
class Page extends Node {
  constructor(options) {
    super(options.config);
    this.nodes = /* @__PURE__ */ new Map();
    this.setNode(options.config.id, this);
    this.initNode(options.config);
  }
  initNode(config) {
    var _a;
    this.setNode(config.id, new Node(config));
    (_a = config.items) == null ? void 0 : _a.forEach((element) => {
      this.initNode(element);
    });
  }
  getNode(id) {
    return this.nodes.get(id);
  }
  setNode(id, node) {
    this.nodes.set(id, node);
  }
  deleteNode(id) {
    this.nodes.delete(id);
  }
}
const style2Obj = (style) => {
  if (typeof style !== "string") {
    return style;
  }
  const obj = {};
  style.split(";").forEach((element) => {
    if (!element) {
      return;
    }
    const items = element.split(":");
    let key = items.shift();
    let value = items.join(":");
    if (!key)
      return;
    key = key.replace(/^\s*/, "").replace(/\s*$/, "");
    value = value.replace(/^\s*/, "").replace(/\s*$/, "");
    key = key.split("-").map((v, i) => i > 0 ? `${v[0].toUpperCase()}${v.substr(1)}` : v).join("");
    obj[key] = value;
  });
  return obj;
};
const fillBackgroundImage = (value) => {
  if (value && !/^url/.test(value) && !/^linear-gradient/.test(value)) {
    return `url(${value})`;
  }
  return value;
};
class App extends events.exports.EventEmitter {
  constructor(options) {
    super();
    this.pages = /* @__PURE__ */ new Map();
    this.platform = "mobile";
    this.jsEngine = "browser";
    this.components = /* @__PURE__ */ new Map();
    this.env = new Env(options.ua);
    options.platform && (this.platform = options.platform);
    options.jsEngine && (this.jsEngine = options.jsEngine);
    if (this.platform === "mobile" || this.platform === "editor") {
      const calcFontsize = () => {
        let { width } = document.documentElement.getBoundingClientRect();
        width = Math.min(800, width);
        const fontSize = width / 3.75;
        document.documentElement.style.fontSize = `${fontSize}px`;
      };
      calcFontsize();
      document.body.style.fontSize = "14px";
      globalThis.addEventListener("resize", calcFontsize);
    }
    if (options.transformStyle) {
      this.transformStyle = options.transformStyle;
    }
    options.config && this.setConfig(options.config, options.curPage);
    bindCommonEventListener(this);
  }
  transformStyle(style) {
    if (!style) {
      return {};
    }
    let styleObj = {};
    const results = {};
    if (typeof style === "string") {
      styleObj = style2Obj(style);
    } else {
      styleObj = __spreadValues({}, style);
    }
    const whiteList = ["zIndex", "opacity", "fontWeight"];
    Object.entries(styleObj).forEach(([key, value]) => {
      if (key === "backgroundImage") {
        value && (results[key] = fillBackgroundImage(value));
      } else if (!whiteList.includes(key) && value && /^[-]?[0-9]*[.]?[0-9]*$/.test(value)) {
        results[key] = `${value / 100}rem`;
      } else {
        results[key] = value;
      }
    });
    return results;
  }
  setConfig(config, curPage) {
    var _a, _b, _c;
    this.pages = /* @__PURE__ */ new Map();
    (_a = config.items) == null ? void 0 : _a.forEach((page) => {
      this.pages.set(page.id, new Page({
        config: page
      }));
    });
    this.setPage(curPage || ((_c = (_b = this.page) == null ? void 0 : _b.data) == null ? void 0 : _c.id));
  }
  setPage(id) {
    let page;
    if (id) {
      page = this.pages.get(id);
    }
    if (!page) {
      page = this.pages.get(this.pages.keys().next().value);
    }
    this.page = page;
    if (this.platform !== "magic") {
      this.bindEvents();
    }
  }
  registerComponent(type, Component) {
    this.components.set(type, Component);
  }
  unregisterComponent(type) {
    this.components.delete(type);
  }
  resolveComponent(type) {
    return this.components.get(type);
  }
  bindEvents() {
    var _a;
    if (!this.page)
      return;
    this.removeAllListeners();
    for (const [, value] of this.page.nodes) {
      (_a = value.events) == null ? void 0 : _a.forEach((event) => {
        let { name: eventName } = event;
        if (DEFAULT_EVENTS.findIndex((defaultEvent) => defaultEvent.value === eventName) > -1) {
          eventName = getCommonEventName(eventName, `${value.data.id}`);
        }
        this.on(eventName, (fromCpt, ...args) => {
          var _a2;
          if (!this.page)
            throw new Error("\u5F53\u524D\u6CA1\u6709\u9875\u9762");
          const toNode = this.page.getNode(event.to);
          if (!toNode)
            throw `ID\u4E3A${event.to}\u7684\u7EC4\u4EF6\u4E0D\u5B58\u5728`;
          const { method: methodName } = event;
          if (isCommonMethod(methodName)) {
            return triggerCommonMethod(methodName, toNode);
          }
          if (typeof ((_a2 = toNode.instance) == null ? void 0 : _a2[methodName]) === "function") {
            toNode.instance[methodName](fromCpt, ...args);
          }
        });
      });
    }
  }
  destroy() {
    this.removeAllListeners();
    this.pages.clear();
  }
}
var resetcss = "";
export { App as A };
//# sourceMappingURL=resetcss.e39ac995.js.map

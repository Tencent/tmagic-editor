(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.magicPresetConfigs = factory());
})(this, (function () { 'use strict';

  const defineFormConfig = (config) => config;

  const button = defineFormConfig([
    {
      name: "className",
      type: "data-source-input",
      text: "class"
    },
    {
      text: "文本",
      name: "text",
      type: "data-source-input"
    }
  ]);

  var events = {exports: {}};

  var hasRequiredEvents;

  function requireEvents () {
  	if (hasRequiredEvents) return events.exports;
  	hasRequiredEvents = 1;

  	var R = typeof Reflect === 'object' ? Reflect : null;
  	var ReflectApply = R && typeof R.apply === 'function'
  	  ? R.apply
  	  : function ReflectApply(target, receiver, args) {
  	    return Function.prototype.apply.call(target, receiver, args);
  	  };

  	var ReflectOwnKeys;
  	if (R && typeof R.ownKeys === 'function') {
  	  ReflectOwnKeys = R.ownKeys;
  	} else if (Object.getOwnPropertySymbols) {
  	  ReflectOwnKeys = function ReflectOwnKeys(target) {
  	    return Object.getOwnPropertyNames(target)
  	      .concat(Object.getOwnPropertySymbols(target));
  	  };
  	} else {
  	  ReflectOwnKeys = function ReflectOwnKeys(target) {
  	    return Object.getOwnPropertyNames(target);
  	  };
  	}

  	function ProcessEmitWarning(warning) {
  	  if (console && console.warn) console.warn(warning);
  	}

  	var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  	  return value !== value;
  	};

  	function EventEmitter() {
  	  EventEmitter.init.call(this);
  	}
  	events.exports = EventEmitter;
  	events.exports.once = once;

  	// Backwards-compat with node 0.10.x
  	EventEmitter.EventEmitter = EventEmitter;

  	EventEmitter.prototype._events = undefined;
  	EventEmitter.prototype._eventsCount = 0;
  	EventEmitter.prototype._maxListeners = undefined;

  	// By default EventEmitters will print a warning if more than 10 listeners are
  	// added to it. This is a useful default which helps finding memory leaks.
  	var defaultMaxListeners = 10;

  	function checkListener(listener) {
  	  if (typeof listener !== 'function') {
  	    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  	  }
  	}

  	Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  	  enumerable: true,
  	  get: function() {
  	    return defaultMaxListeners;
  	  },
  	  set: function(arg) {
  	    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
  	      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
  	    }
  	    defaultMaxListeners = arg;
  	  }
  	});

  	EventEmitter.init = function() {

  	  if (this._events === undefined ||
  	      this._events === Object.getPrototypeOf(this)._events) {
  	    this._events = Object.create(null);
  	    this._eventsCount = 0;
  	  }

  	  this._maxListeners = this._maxListeners || undefined;
  	};

  	// Obviously not all Emitters should be limited to 10. This function allows
  	// that to be increased. Set to zero for unlimited.
  	EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  	  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
  	    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  	  }
  	  this._maxListeners = n;
  	  return this;
  	};

  	function _getMaxListeners(that) {
  	  if (that._maxListeners === undefined)
  	    return EventEmitter.defaultMaxListeners;
  	  return that._maxListeners;
  	}

  	EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  	  return _getMaxListeners(this);
  	};

  	EventEmitter.prototype.emit = function emit(type) {
  	  var args = [];
  	  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  	  var doError = (type === 'error');

  	  var events = this._events;
  	  if (events !== undefined)
  	    doError = (doError && events.error === undefined);
  	  else if (!doError)
  	    return false;

  	  // If there is no 'error' event listener then throw.
  	  if (doError) {
  	    var er;
  	    if (args.length > 0)
  	      er = args[0];
  	    if (er instanceof Error) {
  	      // Note: The comments on the `throw` lines are intentional, they show
  	      // up in Node's output if this results in an unhandled exception.
  	      throw er; // Unhandled 'error' event
  	    }
  	    // At least give some kind of context to the user
  	    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
  	    err.context = er;
  	    throw err; // Unhandled 'error' event
  	  }

  	  var handler = events[type];

  	  if (handler === undefined)
  	    return false;

  	  if (typeof handler === 'function') {
  	    ReflectApply(handler, this, args);
  	  } else {
  	    var len = handler.length;
  	    var listeners = arrayClone(handler, len);
  	    for (var i = 0; i < len; ++i)
  	      ReflectApply(listeners[i], this, args);
  	  }

  	  return true;
  	};

  	function _addListener(target, type, listener, prepend) {
  	  var m;
  	  var events;
  	  var existing;

  	  checkListener(listener);

  	  events = target._events;
  	  if (events === undefined) {
  	    events = target._events = Object.create(null);
  	    target._eventsCount = 0;
  	  } else {
  	    // To avoid recursion in the case that type === "newListener"! Before
  	    // adding it to the listeners, first emit "newListener".
  	    if (events.newListener !== undefined) {
  	      target.emit('newListener', type,
  	                  listener.listener ? listener.listener : listener);

  	      // Re-assign `events` because a newListener handler could have caused the
  	      // this._events to be assigned to a new object
  	      events = target._events;
  	    }
  	    existing = events[type];
  	  }

  	  if (existing === undefined) {
  	    // Optimize the case of one listener. Don't need the extra array object.
  	    existing = events[type] = listener;
  	    ++target._eventsCount;
  	  } else {
  	    if (typeof existing === 'function') {
  	      // Adding the second element, need to change to array.
  	      existing = events[type] =
  	        prepend ? [listener, existing] : [existing, listener];
  	      // If we've already got an array, just append.
  	    } else if (prepend) {
  	      existing.unshift(listener);
  	    } else {
  	      existing.push(listener);
  	    }

  	    // Check for listener leak
  	    m = _getMaxListeners(target);
  	    if (m > 0 && existing.length > m && !existing.warned) {
  	      existing.warned = true;
  	      // No error code for this since it is a Warning
  	      // eslint-disable-next-line no-restricted-syntax
  	      var w = new Error('Possible EventEmitter memory leak detected. ' +
  	                          existing.length + ' ' + String(type) + ' listeners ' +
  	                          'added. Use emitter.setMaxListeners() to ' +
  	                          'increase limit');
  	      w.name = 'MaxListenersExceededWarning';
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

  	EventEmitter.prototype.prependListener =
  	    function prependListener(type, listener) {
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
  	  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
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

  	EventEmitter.prototype.prependOnceListener =
  	    function prependOnceListener(type, listener) {
  	      checkListener(listener);
  	      this.prependListener(type, _onceWrap(this, type, listener));
  	      return this;
  	    };

  	// Emits a 'removeListener' event if and only if the listener was removed.
  	EventEmitter.prototype.removeListener =
  	    function removeListener(type, listener) {
  	      var list, events, position, i, originalListener;

  	      checkListener(listener);

  	      events = this._events;
  	      if (events === undefined)
  	        return this;

  	      list = events[type];
  	      if (list === undefined)
  	        return this;

  	      if (list === listener || list.listener === listener) {
  	        if (--this._eventsCount === 0)
  	          this._events = Object.create(null);
  	        else {
  	          delete events[type];
  	          if (events.removeListener)
  	            this.emit('removeListener', type, list.listener || listener);
  	        }
  	      } else if (typeof list !== 'function') {
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
  	          events[type] = list[0];

  	        if (events.removeListener !== undefined)
  	          this.emit('removeListener', type, originalListener || listener);
  	      }

  	      return this;
  	    };

  	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

  	EventEmitter.prototype.removeAllListeners =
  	    function removeAllListeners(type) {
  	      var listeners, events, i;

  	      events = this._events;
  	      if (events === undefined)
  	        return this;

  	      // not listening for removeListener, no need to emit
  	      if (events.removeListener === undefined) {
  	        if (arguments.length === 0) {
  	          this._events = Object.create(null);
  	          this._eventsCount = 0;
  	        } else if (events[type] !== undefined) {
  	          if (--this._eventsCount === 0)
  	            this._events = Object.create(null);
  	          else
  	            delete events[type];
  	        }
  	        return this;
  	      }

  	      // emit removeListener for all listeners on all events
  	      if (arguments.length === 0) {
  	        var keys = Object.keys(events);
  	        var key;
  	        for (i = 0; i < keys.length; ++i) {
  	          key = keys[i];
  	          if (key === 'removeListener') continue;
  	          this.removeAllListeners(key);
  	        }
  	        this.removeAllListeners('removeListener');
  	        this._events = Object.create(null);
  	        this._eventsCount = 0;
  	        return this;
  	      }

  	      listeners = events[type];

  	      if (typeof listeners === 'function') {
  	        this.removeListener(type, listeners);
  	      } else if (listeners !== undefined) {
  	        // LIFO order
  	        for (i = listeners.length - 1; i >= 0; i--) {
  	          this.removeListener(type, listeners[i]);
  	        }
  	      }

  	      return this;
  	    };

  	function _listeners(target, type, unwrap) {
  	  var events = target._events;

  	  if (events === undefined)
  	    return [];

  	  var evlistener = events[type];
  	  if (evlistener === undefined)
  	    return [];

  	  if (typeof evlistener === 'function')
  	    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  	  return unwrap ?
  	    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
  	}

  	EventEmitter.prototype.listeners = function listeners(type) {
  	  return _listeners(this, type, true);
  	};

  	EventEmitter.prototype.rawListeners = function rawListeners(type) {
  	  return _listeners(this, type, false);
  	};

  	EventEmitter.listenerCount = function(emitter, type) {
  	  if (typeof emitter.listenerCount === 'function') {
  	    return emitter.listenerCount(type);
  	  } else {
  	    return listenerCount.call(emitter, type);
  	  }
  	};

  	EventEmitter.prototype.listenerCount = listenerCount;
  	function listenerCount(type) {
  	  var events = this._events;

  	  if (events !== undefined) {
  	    var evlistener = events[type];

  	    if (typeof evlistener === 'function') {
  	      return 1;
  	    } else if (evlistener !== undefined) {
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

  	function once(emitter, name) {
  	  return new Promise(function (resolve, reject) {
  	    function errorListener(err) {
  	      emitter.removeListener(name, resolver);
  	      reject(err);
  	    }

  	    function resolver() {
  	      if (typeof emitter.removeListener === 'function') {
  	        emitter.removeListener('error', errorListener);
  	      }
  	      resolve([].slice.call(arguments));
  	    }
  	    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
  	    if (name !== 'error') {
  	      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
  	    }
  	  });
  	}

  	function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  	  if (typeof emitter.on === 'function') {
  	    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  	  }
  	}

  	function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  	  if (typeof emitter.on === 'function') {
  	    if (flags.once) {
  	      emitter.once(name, listener);
  	    } else {
  	      emitter.on(name, listener);
  	    }
  	  } else if (typeof emitter.addEventListener === 'function') {
  	    // EventTarget does not have `error` event semantics like Node
  	    // EventEmitters, we do not listen for `error` events here.
  	    emitter.addEventListener(name, function wrapListener(arg) {
  	      // IE does not have builtin `{ once: true }` support so we
  	      // have to do it manually.
  	      if (flags.once) {
  	        emitter.removeEventListener(name, wrapListener);
  	      }
  	      listener(arg);
  	    });
  	  } else {
  	    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  	  }
  	}
  	return events.exports;
  }

  requireEvents();

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */


  let cachedTextEncoder = new TextEncoder("utf-8");

  typeof cachedTextEncoder.encodeInto === "function"
      ? function (arg, view) {
          return cachedTextEncoder.encodeInto(arg, view);
        }
      : function (arg, view) {
          const buf = cachedTextEncoder.encode(arg);
          view.set(buf);
          return {
            read: arg.length,
            written: buf.length,
          };
        };

  const NODE_CONDS_KEY = "displayConds";

  const dslDomRelateConfig = {
    getElById: (doc, id) => doc?.querySelector(`[data-tmagic-id="${id}"]`)};
  const getElById = () => dslDomRelateConfig.getElById;
  const DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX = "ds-field::";

  const container = defineFormConfig([
    {
      name: "className",
      type: "data-source-input",
      text: "class"
    },
    {
      name: "layout",
      text: "容器布局",
      type: "select",
      defaultValue: "absolute",
      options: [
        { value: "absolute", text: "绝对定位" },
        { value: "relative", text: "流式布局" }
      ],
      onChange: (formState, v, { model, setModel }) => {
        if (!model.style) return v;
        if (v === "relative") {
          setModel("style.height", "auto");
        } else {
          const el = getElById()(formState.stage?.renderer?.contentWindow.document, model.id);
          if (el) {
            setModel("style.height", el.getBoundingClientRect().height);
          }
        }
      }
    }
  ]);

  const img = defineFormConfig([
    {
      name: "className",
      type: "data-source-input",
      text: "class"
    },
    {
      type: "data-source-field-select",
      name: "src",
      text: "图片",
      checkStrictly: false,
      dataSourceFieldType: ["string"],
      fieldConfig: {
        type: "img-upload"
      }
    },
    {
      text: "链接",
      name: "url",
      type: "data-source-input"
    }
  ]);

  const iteratorContainer = defineFormConfig([
    {
      name: "className",
      type: "data-source-input",
      text: "class"
    },
    {
      name: "iteratorData",
      text: "数据源数据",
      value: "value",
      dataSourceFieldType: ["array"],
      checkStrictly: true,
      type: "data-source-field-select",
      onChange: (_vm, v = [], { setModel }) => {
        if (Array.isArray(v) && v.length > 1) {
          const [dsId, ...keys] = v;
          setModel("dsField", [dsId.replace(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX, ""), ...keys]);
        } else {
          setModel("dsField", []);
        }
      }
    },
    {
      name: "dsField",
      type: "hidden"
    },
    {
      type: "panel",
      title: "子项配置",
      name: "itemConfig",
      items: [
        {
          type: "display-conds",
          name: NODE_CONDS_KEY,
          titlePrefix: "条件组",
          defaultValue: []
        },
        {
          name: "layout",
          text: "容器布局",
          type: "select",
          defaultValue: "absolute",
          options: [
            { value: "absolute", text: "绝对定位" },
            { value: "relative", text: "流式布局", disabled: true }
          ]
        },
        {
          type: "fieldset",
          legend: "样式",
          name: "style",
          items: [
            {
              name: "width",
              text: "宽度"
            },
            {
              name: "height",
              text: "高度"
            },
            {
              text: "overflow",
              name: "overflow",
              type: "select",
              options: [
                { text: "visible", value: "visible" },
                { text: "hidden", value: "hidden" },
                { text: "clip", value: "clip" },
                { text: "scroll", value: "scroll" },
                { text: "auto", value: "auto" },
                { text: "overlay", value: "overlay" }
              ]
            },
            {
              name: "backgroundImage",
              text: "背景图"
            },
            {
              name: "backgroundColor",
              text: "背景颜色",
              type: "colorPicker"
            },
            {
              name: "backgroundRepeat",
              text: "背景图重复",
              type: "select",
              defaultValue: "no-repeat",
              options: [
                { text: "repeat", value: "repeat" },
                { text: "repeat-x", value: "repeat-x" },
                { text: "repeat-y", value: "repeat-y" },
                { text: "no-repeat", value: "no-repeat" },
                { text: "inherit", value: "inherit" }
              ]
            },
            {
              name: "backgroundSize",
              text: "背景图大小",
              defaultValue: "100% 100%"
            }
          ]
        }
      ]
    }
  ]);

  const overlay = defineFormConfig([]);

  const page = defineFormConfig([
    {
      text: "页面标识",
      name: "name",
      disabled: true,
      extra: "在多页面的情况下用来指定要打开的页面"
    },
    {
      text: "页面标题",
      name: "title"
    },
    {
      name: "layout",
      text: "容器布局",
      type: "select",
      defaultValue: "absolute",
      options: [
        { value: "absolute", text: "绝对定位" },
        { value: "relative", text: "流式布局" }
      ],
      onChange: (formState, v, { model, setModel }) => {
        if (!model.style) return v;
        if (v === "relative") {
          setModel("style.height", "auto");
        } else {
          const el = getElById()(formState.stage?.renderer?.contentWindow.document, model.id);
          if (el) {
            setModel("style.height", el.getBoundingClientRect().height);
          }
        }
      }
    },
    {
      name: "jsFiles",
      text: "js",
      type: "table",
      items: [
        {
          name: "url",
          label: "链接"
        }
      ]
    },
    {
      name: "cssFiles",
      text: "css",
      type: "table",
      items: [
        {
          name: "url",
          label: "链接"
        }
      ]
    },
    {
      text: "css",
      name: "css",
      type: "vs-code",
      language: "css",
      height: "500px"
    }
  ]);

  const pageFragment = defineFormConfig([
    {
      text: "页面片标识",
      name: "name",
      disabled: true
    },
    {
      text: "页面片标题",
      name: "title"
    },
    {
      name: "layout",
      text: "容器布局",
      type: "select",
      defaultValue: "absolute",
      options: [
        { value: "absolute", text: "绝对定位" },
        { value: "relative", text: "流式布局" }
      ],
      onChange: (formState, v, { model, setModel }) => {
        if (!model.style) return v;
        if (v === "relative") {
          setModel("style.height", "auto");
        } else {
          const el = getElById()(formState.stage?.renderer?.contentWindow.document, model.id);
          if (el) {
            setModel("style.height", el.getBoundingClientRect().height);
          }
        }
      }
    }
  ]);

  const pageFragmentContainer = defineFormConfig([
    {
      name: "className",
      type: "data-source-input",
      text: "class"
    },
    {
      name: "pageFragmentId",
      text: "页面片ID",
      type: "page-fragment-select"
    }
  ]);

  const qrcode = defineFormConfig([
    {
      name: "className",
      type: "data-source-input",
      text: "class"
    },
    {
      text: "链接",
      name: "url",
      type: "data-source-input"
    }
  ]);

  const text = defineFormConfig([
    {
      name: "className",
      type: "data-source-input",
      text: "class"
    },
    {
      name: "text",
      text: "文本",
      type: "data-source-input"
    },
    {
      name: "multiple",
      text: "多行文本",
      type: "switch"
    }
  ]);

  const configs = {
    "button": button,
    "container": container,
    "img": img,
    "iterator-container": iteratorContainer,
    "overlay": overlay,
    "page": page,
    "page-fragment": pageFragment,
    "page-fragment-container": pageFragmentContainer,
    "qrcode": qrcode,
    "text": text
  };

  return configs;

}));
//# sourceMappingURL=index.umd.cjs.map

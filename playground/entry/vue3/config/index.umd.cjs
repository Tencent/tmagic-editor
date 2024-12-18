(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.magicPresetConfigs = factory());
})(this, (function () { 'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

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

	var eventsExports = requireEvents();
	const EventEmitter$1 = /*@__PURE__*/getDefaultExportFromCjs(eventsExports);

	/** Detect free variable `global` from Node.js. */
	var freeGlobal$1 = typeof global == 'object' && global && global.Object === Object && global;

	/** Detect free variable `self`. */
	var freeSelf$1 = typeof self == 'object' && self && self.Object === Object && self;

	/** Used as a reference to the global object. */
	var root$1 = freeGlobal$1 || freeSelf$1 || Function('return this')();

	/** Built-in value references. */
	var Symbol$2 = root$1.Symbol;

	/** Used for built-in method references. */
	var objectProto$o = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$i = objectProto$o.hasOwnProperty;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString$3 = objectProto$o.toString;

	/** Built-in value references. */
	var symToStringTag$3 = Symbol$2 ? Symbol$2.toStringTag : undefined;

	/**
	 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the raw `toStringTag`.
	 */
	function getRawTag$1(value) {
	  var isOwn = hasOwnProperty$i.call(value, symToStringTag$3),
	      tag = value[symToStringTag$3];

	  try {
	    value[symToStringTag$3] = undefined;
	    var unmasked = true;
	  } catch (e) {}

	  var result = nativeObjectToString$3.call(value);
	  if (unmasked) {
	    if (isOwn) {
	      value[symToStringTag$3] = tag;
	    } else {
	      delete value[symToStringTag$3];
	    }
	  }
	  return result;
	}

	/** Used for built-in method references. */
	var objectProto$n = Object.prototype;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString$2 = objectProto$n.toString;

	/**
	 * Converts `value` to a string using `Object.prototype.toString`.
	 *
	 * @private
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 */
	function objectToString$1(value) {
	  return nativeObjectToString$2.call(value);
	}

	/** `Object#toString` result references. */
	var nullTag$1 = '[object Null]',
	    undefinedTag$1 = '[object Undefined]';

	/** Built-in value references. */
	var symToStringTag$2 = Symbol$2 ? Symbol$2.toStringTag : undefined;

	/**
	 * The base implementation of `getTag` without fallbacks for buggy environments.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag$1(value) {
	  if (value == null) {
	    return value === undefined ? undefinedTag$1 : nullTag$1;
	  }
	  return (symToStringTag$2 && symToStringTag$2 in Object(value))
	    ? getRawTag$1(value)
	    : objectToString$1(value);
	}

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike$1(value) {
	  return value != null && typeof value == 'object';
	}

	/** `Object#toString` result references. */
	var symbolTag$4 = '[object Symbol]';

	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */
	function isSymbol(value) {
	  return typeof value == 'symbol' ||
	    (isObjectLike$1(value) && baseGetTag$1(value) == symbolTag$4);
	}

	/**
	 * A specialized version of `_.map` for arrays without support for iteratee
	 * shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function arrayMap(array, iteratee) {
	  var index = -1,
	      length = array == null ? 0 : array.length,
	      result = Array(length);

	  while (++index < length) {
	    result[index] = iteratee(array[index], index, array);
	  }
	  return result;
	}

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray$1 = Array.isArray;

	/** Used as references for various `Number` constants. */
	var INFINITY$2 = 1 / 0;

	/** Used to convert symbols to primitives and strings. */
	var symbolProto$2 = Symbol$2 ? Symbol$2.prototype : undefined,
	    symbolToString = symbolProto$2 ? symbolProto$2.toString : undefined;

	/**
	 * The base implementation of `_.toString` which doesn't convert nullish
	 * values to empty strings.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
	  // Exit early for strings to avoid a performance hit in some environments.
	  if (typeof value == 'string') {
	    return value;
	  }
	  if (isArray$1(value)) {
	    // Recursively convert values (susceptible to call stack limits).
	    return arrayMap(value, baseToString) + '';
	  }
	  if (isSymbol(value)) {
	    return symbolToString ? symbolToString.call(value) : '';
	  }
	  var result = (value + '');
	  return (result == '0' && (1 / value) == -INFINITY$2) ? '-0' : result;
	}

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject$2(value) {
	  var type = typeof value;
	  return value != null && (type == 'object' || type == 'function');
	}

	/** `Object#toString` result references. */
	var asyncTag$1 = '[object AsyncFunction]',
	    funcTag$5 = '[object Function]',
	    genTag$3 = '[object GeneratorFunction]',
	    proxyTag$1 = '[object Proxy]';

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction$1(value) {
	  if (!isObject$2(value)) {
	    return false;
	  }
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 9 which returns 'object' for typed arrays and other constructors.
	  var tag = baseGetTag$1(value);
	  return tag == funcTag$5 || tag == genTag$3 || tag == asyncTag$1 || tag == proxyTag$1;
	}

	/** Used to detect overreaching core-js shims. */
	var coreJsData$1 = root$1['__core-js_shared__'];

	/** Used to detect methods masquerading as native. */
	var maskSrcKey$1 = (function() {
	  var uid = /[^.]+$/.exec(coreJsData$1 && coreJsData$1.keys && coreJsData$1.keys.IE_PROTO || '');
	  return uid ? ('Symbol(src)_1.' + uid) : '';
	}());

	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked$1(func) {
	  return !!maskSrcKey$1 && (maskSrcKey$1 in func);
	}

	/** Used for built-in method references. */
	var funcProto$3 = Function.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString$3 = funcProto$3.toString;

	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to convert.
	 * @returns {string} Returns the source code.
	 */
	function toSource$1(func) {
	  if (func != null) {
	    try {
	      return funcToString$3.call(func);
	    } catch (e) {}
	    try {
	      return (func + '');
	    } catch (e) {}
	  }
	  return '';
	}

	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar$1 = /[\\^$.*+?()[\]{}|]/g;

	/** Used to detect host constructors (Safari). */
	var reIsHostCtor$1 = /^\[object .+?Constructor\]$/;

	/** Used for built-in method references. */
	var funcProto$2 = Function.prototype,
	    objectProto$m = Object.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString$2 = funcProto$2.toString;

	/** Used to check objects for own properties. */
	var hasOwnProperty$h = objectProto$m.hasOwnProperty;

	/** Used to detect if a method is native. */
	var reIsNative$1 = RegExp('^' +
	  funcToString$2.call(hasOwnProperty$h).replace(reRegExpChar$1, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);

	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative$1(value) {
	  if (!isObject$2(value) || isMasked$1(value)) {
	    return false;
	  }
	  var pattern = isFunction$1(value) ? reIsNative$1 : reIsHostCtor$1;
	  return pattern.test(toSource$1(value));
	}

	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue$1(object, key) {
	  return object == null ? undefined : object[key];
	}

	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative$1(object, key) {
	  var value = getValue$1(object, key);
	  return baseIsNative$1(value) ? value : undefined;
	}

	/* Built-in method references that are verified to be native. */
	var WeakMap$1 = getNative$1(root$1, 'WeakMap');

	/** Built-in value references. */
	var objectCreate$1 = Object.create;

	/**
	 * The base implementation of `_.create` without support for assigning
	 * properties to the created object.
	 *
	 * @private
	 * @param {Object} proto The object to inherit from.
	 * @returns {Object} Returns the new object.
	 */
	var baseCreate$1 = (function() {
	  function object() {}
	  return function(proto) {
	    if (!isObject$2(proto)) {
	      return {};
	    }
	    if (objectCreate$1) {
	      return objectCreate$1(proto);
	    }
	    object.prototype = proto;
	    var result = new object;
	    object.prototype = undefined;
	    return result;
	  };
	}());

	/**
	 * Copies the values of `source` to `array`.
	 *
	 * @private
	 * @param {Array} source The array to copy values from.
	 * @param {Array} [array=[]] The array to copy values to.
	 * @returns {Array} Returns `array`.
	 */
	function copyArray(source, array) {
	  var index = -1,
	      length = source.length;

	  array || (array = Array(length));
	  while (++index < length) {
	    array[index] = source[index];
	  }
	  return array;
	}

	var defineProperty$1 = (function() {
	  try {
	    var func = getNative$1(Object, 'defineProperty');
	    func({}, '', {});
	    return func;
	  } catch (e) {}
	}());

	/**
	 * A specialized version of `_.forEach` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns `array`.
	 */
	function arrayEach$1(array, iteratee) {
	  var index = -1,
	      length = array == null ? 0 : array.length;

	  while (++index < length) {
	    if (iteratee(array[index], index, array) === false) {
	      break;
	    }
	  }
	  return array;
	}

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER$3 = 9007199254740991;

	/** Used to detect unsigned integer values. */
	var reIsUint$1 = /^(?:0|[1-9]\d*)$/;

	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex$1(value, length) {
	  var type = typeof value;
	  length = length == null ? MAX_SAFE_INTEGER$3 : length;

	  return !!length &&
	    (type == 'number' ||
	      (type != 'symbol' && reIsUint$1.test(value))) &&
	        (value > -1 && value % 1 == 0 && value < length);
	}

	/**
	 * The base implementation of `assignValue` and `assignMergeValue` without
	 * value checks.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function baseAssignValue$1(object, key, value) {
	  if (key == '__proto__' && defineProperty$1) {
	    defineProperty$1(object, key, {
	      'configurable': true,
	      'enumerable': true,
	      'value': value,
	      'writable': true
	    });
	  } else {
	    object[key] = value;
	  }
	}

	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq$1(value, other) {
	  return value === other || (value !== value && other !== other);
	}

	/** Used for built-in method references. */
	var objectProto$l = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$g = objectProto$l.hasOwnProperty;

	/**
	 * Assigns `value` to `key` of `object` if the existing value is not equivalent
	 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * for equality comparisons.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function assignValue$1(object, key, value) {
	  var objValue = object[key];
	  if (!(hasOwnProperty$g.call(object, key) && eq$1(objValue, value)) ||
	      (value === undefined && !(key in object))) {
	    baseAssignValue$1(object, key, value);
	  }
	}

	/**
	 * Copies properties of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy properties from.
	 * @param {Array} props The property identifiers to copy.
	 * @param {Object} [object={}] The object to copy properties to.
	 * @param {Function} [customizer] The function to customize copied values.
	 * @returns {Object} Returns `object`.
	 */
	function copyObject(source, props, object, customizer) {
	  var isNew = !object;
	  object || (object = {});

	  var index = -1,
	      length = props.length;

	  while (++index < length) {
	    var key = props[index];

	    var newValue = undefined;

	    if (newValue === undefined) {
	      newValue = source[key];
	    }
	    if (isNew) {
	      baseAssignValue$1(object, key, newValue);
	    } else {
	      assignValue$1(object, key, newValue);
	    }
	  }
	  return object;
	}

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER$2 = 9007199254740991;

	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength$1(value) {
	  return typeof value == 'number' &&
	    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$2;
	}

	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike$1(value) {
	  return value != null && isLength$1(value.length) && !isFunction$1(value);
	}

	/** Used for built-in method references. */
	var objectProto$k = Object.prototype;

	/**
	 * Checks if `value` is likely a prototype object.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	 */
	function isPrototype$1(value) {
	  var Ctor = value && value.constructor,
	      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$k;

	  return value === proto;
	}

	/**
	 * The base implementation of `_.times` without support for iteratee shorthands
	 * or max array length checks.
	 *
	 * @private
	 * @param {number} n The number of times to invoke `iteratee`.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the array of results.
	 */
	function baseTimes$1(n, iteratee) {
	  var index = -1,
	      result = Array(n);

	  while (++index < n) {
	    result[index] = iteratee(index);
	  }
	  return result;
	}

	/** `Object#toString` result references. */
	var argsTag$5 = '[object Arguments]';

	/**
	 * The base implementation of `_.isArguments`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 */
	function baseIsArguments$1(value) {
	  return isObjectLike$1(value) && baseGetTag$1(value) == argsTag$5;
	}

	/** Used for built-in method references. */
	var objectProto$j = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$f = objectProto$j.hasOwnProperty;

	/** Built-in value references. */
	var propertyIsEnumerable$3 = objectProto$j.propertyIsEnumerable;

	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	var isArguments$1 = baseIsArguments$1(function() { return arguments; }()) ? baseIsArguments$1 : function(value) {
	  return isObjectLike$1(value) && hasOwnProperty$f.call(value, 'callee') &&
	    !propertyIsEnumerable$3.call(value, 'callee');
	};

	/**
	 * This method returns `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {boolean} Returns `false`.
	 * @example
	 *
	 * _.times(2, _.stubFalse);
	 * // => [false, false]
	 */
	function stubFalse$1() {
	  return false;
	}

	/** Detect free variable `exports`. */
	var freeExports$5 = typeof exports == 'object' && exports && !exports.nodeType && exports;

	/** Detect free variable `module`. */
	var freeModule$5 = freeExports$5 && typeof module == 'object' && module && !module.nodeType && module;

	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports$5 = freeModule$5 && freeModule$5.exports === freeExports$5;

	/** Built-in value references. */
	var Buffer$3 = moduleExports$5 ? root$1.Buffer : undefined;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeIsBuffer$1 = Buffer$3 ? Buffer$3.isBuffer : undefined;

	/**
	 * Checks if `value` is a buffer.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
	 * @example
	 *
	 * _.isBuffer(new Buffer(2));
	 * // => true
	 *
	 * _.isBuffer(new Uint8Array(2));
	 * // => false
	 */
	var isBuffer$1 = nativeIsBuffer$1 || stubFalse$1;

	/** `Object#toString` result references. */
	var argsTag$4 = '[object Arguments]',
	    arrayTag$3 = '[object Array]',
	    boolTag$5 = '[object Boolean]',
	    dateTag$5 = '[object Date]',
	    errorTag$3 = '[object Error]',
	    funcTag$4 = '[object Function]',
	    mapTag$9 = '[object Map]',
	    numberTag$5 = '[object Number]',
	    objectTag$5 = '[object Object]',
	    regexpTag$5 = '[object RegExp]',
	    setTag$9 = '[object Set]',
	    stringTag$5 = '[object String]',
	    weakMapTag$5 = '[object WeakMap]';

	var arrayBufferTag$5 = '[object ArrayBuffer]',
	    dataViewTag$7 = '[object DataView]',
	    float32Tag$5 = '[object Float32Array]',
	    float64Tag$5 = '[object Float64Array]',
	    int8Tag$5 = '[object Int8Array]',
	    int16Tag$5 = '[object Int16Array]',
	    int32Tag$5 = '[object Int32Array]',
	    uint8Tag$5 = '[object Uint8Array]',
	    uint8ClampedTag$5 = '[object Uint8ClampedArray]',
	    uint16Tag$5 = '[object Uint16Array]',
	    uint32Tag$5 = '[object Uint32Array]';

	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags$1 = {};
	typedArrayTags$1[float32Tag$5] = typedArrayTags$1[float64Tag$5] =
	typedArrayTags$1[int8Tag$5] = typedArrayTags$1[int16Tag$5] =
	typedArrayTags$1[int32Tag$5] = typedArrayTags$1[uint8Tag$5] =
	typedArrayTags$1[uint8ClampedTag$5] = typedArrayTags$1[uint16Tag$5] =
	typedArrayTags$1[uint32Tag$5] = true;
	typedArrayTags$1[argsTag$4] = typedArrayTags$1[arrayTag$3] =
	typedArrayTags$1[arrayBufferTag$5] = typedArrayTags$1[boolTag$5] =
	typedArrayTags$1[dataViewTag$7] = typedArrayTags$1[dateTag$5] =
	typedArrayTags$1[errorTag$3] = typedArrayTags$1[funcTag$4] =
	typedArrayTags$1[mapTag$9] = typedArrayTags$1[numberTag$5] =
	typedArrayTags$1[objectTag$5] = typedArrayTags$1[regexpTag$5] =
	typedArrayTags$1[setTag$9] = typedArrayTags$1[stringTag$5] =
	typedArrayTags$1[weakMapTag$5] = false;

	/**
	 * The base implementation of `_.isTypedArray` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 */
	function baseIsTypedArray$1(value) {
	  return isObjectLike$1(value) &&
	    isLength$1(value.length) && !!typedArrayTags$1[baseGetTag$1(value)];
	}

	/**
	 * The base implementation of `_.unary` without support for storing metadata.
	 *
	 * @private
	 * @param {Function} func The function to cap arguments for.
	 * @returns {Function} Returns the new capped function.
	 */
	function baseUnary$1(func) {
	  return function(value) {
	    return func(value);
	  };
	}

	/** Detect free variable `exports`. */
	var freeExports$4 = typeof exports == 'object' && exports && !exports.nodeType && exports;

	/** Detect free variable `module`. */
	var freeModule$4 = freeExports$4 && typeof module == 'object' && module && !module.nodeType && module;

	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports$4 = freeModule$4 && freeModule$4.exports === freeExports$4;

	/** Detect free variable `process` from Node.js. */
	var freeProcess$1 = moduleExports$4 && freeGlobal$1.process;

	/** Used to access faster Node.js helpers. */
	var nodeUtil$1 = (function() {
	  try {
	    // Use `util.types` for Node.js 10+.
	    var types = freeModule$4 && freeModule$4.require && freeModule$4.require('util').types;

	    if (types) {
	      return types;
	    }

	    // Legacy `process.binding('util')` for Node.js < 10.
	    return freeProcess$1 && freeProcess$1.binding && freeProcess$1.binding('util');
	  } catch (e) {}
	}());

	/* Node.js helper references. */
	var nodeIsTypedArray$1 = nodeUtil$1 && nodeUtil$1.isTypedArray;

	/**
	 * Checks if `value` is classified as a typed array.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 * @example
	 *
	 * _.isTypedArray(new Uint8Array);
	 * // => true
	 *
	 * _.isTypedArray([]);
	 * // => false
	 */
	var isTypedArray$1 = nodeIsTypedArray$1 ? baseUnary$1(nodeIsTypedArray$1) : baseIsTypedArray$1;

	/** Used for built-in method references. */
	var objectProto$i = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$e = objectProto$i.hasOwnProperty;

	/**
	 * Creates an array of the enumerable property names of the array-like `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @param {boolean} inherited Specify returning inherited property names.
	 * @returns {Array} Returns the array of property names.
	 */
	function arrayLikeKeys$1(value, inherited) {
	  var isArr = isArray$1(value),
	      isArg = !isArr && isArguments$1(value),
	      isBuff = !isArr && !isArg && isBuffer$1(value),
	      isType = !isArr && !isArg && !isBuff && isTypedArray$1(value),
	      skipIndexes = isArr || isArg || isBuff || isType,
	      result = skipIndexes ? baseTimes$1(value.length, String) : [],
	      length = result.length;

	  for (var key in value) {
	    if ((inherited || hasOwnProperty$e.call(value, key)) &&
	        !(skipIndexes && (
	           // Safari 9 has enumerable `arguments.length` in strict mode.
	           key == 'length' ||
	           // Node.js 0.10 has enumerable non-index properties on buffers.
	           (isBuff && (key == 'offset' || key == 'parent')) ||
	           // PhantomJS 2 has enumerable non-index properties on typed arrays.
	           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
	           // Skip index properties.
	           isIndex$1(key, length)
	        ))) {
	      result.push(key);
	    }
	  }
	  return result;
	}

	/**
	 * Creates a unary function that invokes `func` with its argument transformed.
	 *
	 * @private
	 * @param {Function} func The function to wrap.
	 * @param {Function} transform The argument transform.
	 * @returns {Function} Returns the new function.
	 */
	function overArg$1(func, transform) {
	  return function(arg) {
	    return func(transform(arg));
	  };
	}

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeKeys$1 = overArg$1(Object.keys, Object);

	/** Used for built-in method references. */
	var objectProto$h = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$d = objectProto$h.hasOwnProperty;

	/**
	 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeys$1(object) {
	  if (!isPrototype$1(object)) {
	    return nativeKeys$1(object);
	  }
	  var result = [];
	  for (var key in Object(object)) {
	    if (hasOwnProperty$d.call(object, key) && key != 'constructor') {
	      result.push(key);
	    }
	  }
	  return result;
	}

	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keys(new Foo);
	 * // => ['a', 'b'] (iteration order is not guaranteed)
	 *
	 * _.keys('hi');
	 * // => ['0', '1']
	 */
	function keys$1(object) {
	  return isArrayLike$1(object) ? arrayLikeKeys$1(object) : baseKeys$1(object);
	}

	/**
	 * This function is like
	 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * except that it includes inherited enumerable properties.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function nativeKeysIn(object) {
	  var result = [];
	  if (object != null) {
	    for (var key in Object(object)) {
	      result.push(key);
	    }
	  }
	  return result;
	}

	/** Used for built-in method references. */
	var objectProto$g = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$c = objectProto$g.hasOwnProperty;

	/**
	 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeysIn(object) {
	  if (!isObject$2(object)) {
	    return nativeKeysIn(object);
	  }
	  var isProto = isPrototype$1(object),
	      result = [];

	  for (var key in object) {
	    if (!(key == 'constructor' && (isProto || !hasOwnProperty$c.call(object, key)))) {
	      result.push(key);
	    }
	  }
	  return result;
	}

	/**
	 * Creates an array of the own and inherited enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keysIn(new Foo);
	 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
	 */
	function keysIn(object) {
	  return isArrayLike$1(object) ? arrayLikeKeys$1(object, true) : baseKeysIn(object);
	}

	/** Used to match property names within property paths. */
	var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
	    reIsPlainProp = /^\w*$/;

	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */
	function isKey(value, object) {
	  if (isArray$1(value)) {
	    return false;
	  }
	  var type = typeof value;
	  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
	      value == null || isSymbol(value)) {
	    return true;
	  }
	  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
	    (object != null && value in Object(object));
	}

	/* Built-in method references that are verified to be native. */
	var nativeCreate$1 = getNative$1(Object, 'create');

	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear$1() {
	  this.__data__ = nativeCreate$1 ? nativeCreate$1(null) : {};
	  this.size = 0;
	}

	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete$1(key) {
	  var result = this.has(key) && delete this.__data__[key];
	  this.size -= result ? 1 : 0;
	  return result;
	}

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED$4 = '__lodash_hash_undefined__';

	/** Used for built-in method references. */
	var objectProto$f = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$b = objectProto$f.hasOwnProperty;

	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet$1(key) {
	  var data = this.__data__;
	  if (nativeCreate$1) {
	    var result = data[key];
	    return result === HASH_UNDEFINED$4 ? undefined : result;
	  }
	  return hasOwnProperty$b.call(data, key) ? data[key] : undefined;
	}

	/** Used for built-in method references. */
	var objectProto$e = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$a = objectProto$e.hasOwnProperty;

	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas$1(key) {
	  var data = this.__data__;
	  return nativeCreate$1 ? (data[key] !== undefined) : hasOwnProperty$a.call(data, key);
	}

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED$3 = '__lodash_hash_undefined__';

	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet$1(key, value) {
	  var data = this.__data__;
	  this.size += this.has(key) ? 0 : 1;
	  data[key] = (nativeCreate$1 && value === undefined) ? HASH_UNDEFINED$3 : value;
	  return this;
	}

	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash$1(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `Hash`.
	Hash$1.prototype.clear = hashClear$1;
	Hash$1.prototype['delete'] = hashDelete$1;
	Hash$1.prototype.get = hashGet$1;
	Hash$1.prototype.has = hashHas$1;
	Hash$1.prototype.set = hashSet$1;

	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear$1() {
	  this.__data__ = [];
	  this.size = 0;
	}

	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf$1(array, key) {
	  var length = array.length;
	  while (length--) {
	    if (eq$1(array[length][0], key)) {
	      return length;
	    }
	  }
	  return -1;
	}

	/** Used for built-in method references. */
	var arrayProto$1 = Array.prototype;

	/** Built-in value references. */
	var splice$1 = arrayProto$1.splice;

	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete$1(key) {
	  var data = this.__data__,
	      index = assocIndexOf$1(data, key);

	  if (index < 0) {
	    return false;
	  }
	  var lastIndex = data.length - 1;
	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice$1.call(data, index, 1);
	  }
	  --this.size;
	  return true;
	}

	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet$1(key) {
	  var data = this.__data__,
	      index = assocIndexOf$1(data, key);

	  return index < 0 ? undefined : data[index][1];
	}

	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas$1(key) {
	  return assocIndexOf$1(this.__data__, key) > -1;
	}

	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet$1(key, value) {
	  var data = this.__data__,
	      index = assocIndexOf$1(data, key);

	  if (index < 0) {
	    ++this.size;
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }
	  return this;
	}

	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache$1(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `ListCache`.
	ListCache$1.prototype.clear = listCacheClear$1;
	ListCache$1.prototype['delete'] = listCacheDelete$1;
	ListCache$1.prototype.get = listCacheGet$1;
	ListCache$1.prototype.has = listCacheHas$1;
	ListCache$1.prototype.set = listCacheSet$1;

	/* Built-in method references that are verified to be native. */
	var Map$2 = getNative$1(root$1, 'Map');

	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear$1() {
	  this.size = 0;
	  this.__data__ = {
	    'hash': new Hash$1,
	    'map': new (Map$2 || ListCache$1),
	    'string': new Hash$1
	  };
	}

	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable$1(value) {
	  var type = typeof value;
	  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
	    ? (value !== '__proto__')
	    : (value === null);
	}

	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData$1(map, key) {
	  var data = map.__data__;
	  return isKeyable$1(key)
	    ? data[typeof key == 'string' ? 'string' : 'hash']
	    : data.map;
	}

	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete$1(key) {
	  var result = getMapData$1(this, key)['delete'](key);
	  this.size -= result ? 1 : 0;
	  return result;
	}

	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet$1(key) {
	  return getMapData$1(this, key).get(key);
	}

	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas$1(key) {
	  return getMapData$1(this, key).has(key);
	}

	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet$1(key, value) {
	  var data = getMapData$1(this, key),
	      size = data.size;

	  data.set(key, value);
	  this.size += data.size == size ? 0 : 1;
	  return this;
	}

	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache$1(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `MapCache`.
	MapCache$1.prototype.clear = mapCacheClear$1;
	MapCache$1.prototype['delete'] = mapCacheDelete$1;
	MapCache$1.prototype.get = mapCacheGet$1;
	MapCache$1.prototype.has = mapCacheHas$1;
	MapCache$1.prototype.set = mapCacheSet$1;

	/** Error message constants. */
	var FUNC_ERROR_TEXT = 'Expected a function';

	/**
	 * Creates a function that memoizes the result of `func`. If `resolver` is
	 * provided, it determines the cache key for storing the result based on the
	 * arguments provided to the memoized function. By default, the first argument
	 * provided to the memoized function is used as the map cache key. The `func`
	 * is invoked with the `this` binding of the memoized function.
	 *
	 * **Note:** The cache is exposed as the `cache` property on the memoized
	 * function. Its creation may be customized by replacing the `_.memoize.Cache`
	 * constructor with one whose instances implement the
	 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
	 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to have its output memoized.
	 * @param {Function} [resolver] The function to resolve the cache key.
	 * @returns {Function} Returns the new memoized function.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 * var other = { 'c': 3, 'd': 4 };
	 *
	 * var values = _.memoize(_.values);
	 * values(object);
	 * // => [1, 2]
	 *
	 * values(other);
	 * // => [3, 4]
	 *
	 * object.a = 2;
	 * values(object);
	 * // => [1, 2]
	 *
	 * // Modify the result cache.
	 * values.cache.set(object, ['a', 'b']);
	 * values(object);
	 * // => ['a', 'b']
	 *
	 * // Replace `_.memoize.Cache`.
	 * _.memoize.Cache = WeakMap;
	 */
	function memoize(func, resolver) {
	  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
	    throw new TypeError(FUNC_ERROR_TEXT);
	  }
	  var memoized = function() {
	    var args = arguments,
	        key = resolver ? resolver.apply(this, args) : args[0],
	        cache = memoized.cache;

	    if (cache.has(key)) {
	      return cache.get(key);
	    }
	    var result = func.apply(this, args);
	    memoized.cache = cache.set(key, result) || cache;
	    return result;
	  };
	  memoized.cache = new (memoize.Cache || MapCache$1);
	  return memoized;
	}

	// Expose `MapCache`.
	memoize.Cache = MapCache$1;

	/** Used as the maximum memoize cache size. */
	var MAX_MEMOIZE_SIZE = 500;

	/**
	 * A specialized version of `_.memoize` which clears the memoized function's
	 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
	 *
	 * @private
	 * @param {Function} func The function to have its output memoized.
	 * @returns {Function} Returns the new memoized function.
	 */
	function memoizeCapped(func) {
	  var result = memoize(func, function(key) {
	    if (cache.size === MAX_MEMOIZE_SIZE) {
	      cache.clear();
	    }
	    return key;
	  });

	  var cache = result.cache;
	  return result;
	}

	/** Used to match property names within property paths. */
	var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

	/** Used to match backslashes in property paths. */
	var reEscapeChar = /\\(\\)?/g;

	/**
	 * Converts `string` to a property path array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the property path array.
	 */
	var stringToPath = memoizeCapped(function(string) {
	  var result = [];
	  if (string.charCodeAt(0) === 46 /* . */) {
	    result.push('');
	  }
	  string.replace(rePropName, function(match, number, quote, subString) {
	    result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
	  });
	  return result;
	});

	/**
	 * Converts `value` to a string. An empty string is returned for `null`
	 * and `undefined` values. The sign of `-0` is preserved.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 * @example
	 *
	 * _.toString(null);
	 * // => ''
	 *
	 * _.toString(-0);
	 * // => '-0'
	 *
	 * _.toString([1, 2, 3]);
	 * // => '1,2,3'
	 */
	function toString(value) {
	  return value == null ? '' : baseToString(value);
	}

	/**
	 * Casts `value` to a path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {Array} Returns the cast property path array.
	 */
	function castPath(value, object) {
	  if (isArray$1(value)) {
	    return value;
	  }
	  return isKey(value, object) ? [value] : stringToPath(toString(value));
	}

	/** Used as references for various `Number` constants. */
	var INFINITY$1 = 1 / 0;

	/**
	 * Converts `value` to a string key if it's not a string or symbol.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {string|symbol} Returns the key.
	 */
	function toKey(value) {
	  if (typeof value == 'string' || isSymbol(value)) {
	    return value;
	  }
	  var result = (value + '');
	  return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
	}

	/**
	 * Appends the elements of `values` to `array`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {Array} values The values to append.
	 * @returns {Array} Returns `array`.
	 */
	function arrayPush$1(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;

	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}

	/** Built-in value references. */
	var getPrototype$1 = overArg$1(Object.getPrototypeOf, Object);

	/**
	 * Removes all key-value entries from the stack.
	 *
	 * @private
	 * @name clear
	 * @memberOf Stack
	 */
	function stackClear$1() {
	  this.__data__ = new ListCache$1;
	  this.size = 0;
	}

	/**
	 * Removes `key` and its value from the stack.
	 *
	 * @private
	 * @name delete
	 * @memberOf Stack
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function stackDelete$1(key) {
	  var data = this.__data__,
	      result = data['delete'](key);

	  this.size = data.size;
	  return result;
	}

	/**
	 * Gets the stack value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Stack
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function stackGet$1(key) {
	  return this.__data__.get(key);
	}

	/**
	 * Checks if a stack value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Stack
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function stackHas$1(key) {
	  return this.__data__.has(key);
	}

	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE$2 = 200;

	/**
	 * Sets the stack `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Stack
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the stack cache instance.
	 */
	function stackSet$1(key, value) {
	  var data = this.__data__;
	  if (data instanceof ListCache$1) {
	    var pairs = data.__data__;
	    if (!Map$2 || (pairs.length < LARGE_ARRAY_SIZE$2 - 1)) {
	      pairs.push([key, value]);
	      this.size = ++data.size;
	      return this;
	    }
	    data = this.__data__ = new MapCache$1(pairs);
	  }
	  data.set(key, value);
	  this.size = data.size;
	  return this;
	}

	/**
	 * Creates a stack cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Stack$1(entries) {
	  var data = this.__data__ = new ListCache$1(entries);
	  this.size = data.size;
	}

	// Add methods to `Stack`.
	Stack$1.prototype.clear = stackClear$1;
	Stack$1.prototype['delete'] = stackDelete$1;
	Stack$1.prototype.get = stackGet$1;
	Stack$1.prototype.has = stackHas$1;
	Stack$1.prototype.set = stackSet$1;

	/**
	 * The base implementation of `_.assign` without support for multiple sources
	 * or `customizer` functions.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @returns {Object} Returns `object`.
	 */
	function baseAssign(object, source) {
	  return object && copyObject(source, keys$1(source), object);
	}

	/**
	 * The base implementation of `_.assignIn` without support for multiple sources
	 * or `customizer` functions.
	 *
	 * @private
	 * @param {Object} object The destination object.
	 * @param {Object} source The source object.
	 * @returns {Object} Returns `object`.
	 */
	function baseAssignIn(object, source) {
	  return object && copyObject(source, keysIn(source), object);
	}

	/** Detect free variable `exports`. */
	var freeExports$3 = typeof exports == 'object' && exports && !exports.nodeType && exports;

	/** Detect free variable `module`. */
	var freeModule$3 = freeExports$3 && typeof module == 'object' && module && !module.nodeType && module;

	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports$3 = freeModule$3 && freeModule$3.exports === freeExports$3;

	/** Built-in value references. */
	var Buffer$2 = moduleExports$3 ? root$1.Buffer : undefined,
	    allocUnsafe = Buffer$2 ? Buffer$2.allocUnsafe : undefined;

	/**
	 * Creates a clone of  `buffer`.
	 *
	 * @private
	 * @param {Buffer} buffer The buffer to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Buffer} Returns the cloned buffer.
	 */
	function cloneBuffer$1(buffer, isDeep) {
	  if (isDeep) {
	    return buffer.slice();
	  }
	  var length = buffer.length,
	      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

	  buffer.copy(result);
	  return result;
	}

	/**
	 * A specialized version of `_.filter` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {Array} Returns the new filtered array.
	 */
	function arrayFilter$1(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length,
	      resIndex = 0,
	      result = [];

	  while (++index < length) {
	    var value = array[index];
	    if (predicate(value, index, array)) {
	      result[resIndex++] = value;
	    }
	  }
	  return result;
	}

	/**
	 * This method returns a new empty array.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {Array} Returns the new empty array.
	 * @example
	 *
	 * var arrays = _.times(2, _.stubArray);
	 *
	 * console.log(arrays);
	 * // => [[], []]
	 *
	 * console.log(arrays[0] === arrays[1]);
	 * // => false
	 */
	function stubArray$1() {
	  return [];
	}

	/** Used for built-in method references. */
	var objectProto$d = Object.prototype;

	/** Built-in value references. */
	var propertyIsEnumerable$2 = objectProto$d.propertyIsEnumerable;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeGetSymbols$2 = Object.getOwnPropertySymbols;

	/**
	 * Creates an array of the own enumerable symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of symbols.
	 */
	var getSymbols$1 = !nativeGetSymbols$2 ? stubArray$1 : function(object) {
	  if (object == null) {
	    return [];
	  }
	  object = Object(object);
	  return arrayFilter$1(nativeGetSymbols$2(object), function(symbol) {
	    return propertyIsEnumerable$2.call(object, symbol);
	  });
	};

	/**
	 * Copies own symbols of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy symbols from.
	 * @param {Object} [object={}] The object to copy symbols to.
	 * @returns {Object} Returns `object`.
	 */
	function copySymbols(source, object) {
	  return copyObject(source, getSymbols$1(source), object);
	}

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeGetSymbols = Object.getOwnPropertySymbols;

	/**
	 * Creates an array of the own and inherited enumerable symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of symbols.
	 */
	var getSymbolsIn = !nativeGetSymbols ? stubArray$1 : function(object) {
	  var result = [];
	  while (object) {
	    arrayPush$1(result, getSymbols$1(object));
	    object = getPrototype$1(object);
	  }
	  return result;
	};

	/**
	 * Copies own and inherited symbols of `source` to `object`.
	 *
	 * @private
	 * @param {Object} source The object to copy symbols from.
	 * @param {Object} [object={}] The object to copy symbols to.
	 * @returns {Object} Returns `object`.
	 */
	function copySymbolsIn(source, object) {
	  return copyObject(source, getSymbolsIn(source), object);
	}

	/**
	 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
	 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
	 * symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @param {Function} symbolsFunc The function to get the symbols of `object`.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function baseGetAllKeys$1(object, keysFunc, symbolsFunc) {
	  var result = keysFunc(object);
	  return isArray$1(object) ? result : arrayPush$1(result, symbolsFunc(object));
	}

	/**
	 * Creates an array of own enumerable property names and symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function getAllKeys$1(object) {
	  return baseGetAllKeys$1(object, keys$1, getSymbols$1);
	}

	/**
	 * Creates an array of own and inherited enumerable property names and
	 * symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function getAllKeysIn(object) {
	  return baseGetAllKeys$1(object, keysIn, getSymbolsIn);
	}

	/* Built-in method references that are verified to be native. */
	var DataView$1 = getNative$1(root$1, 'DataView');

	/* Built-in method references that are verified to be native. */
	var Promise$2 = getNative$1(root$1, 'Promise');

	/* Built-in method references that are verified to be native. */
	var Set$2 = getNative$1(root$1, 'Set');

	/** `Object#toString` result references. */
	var mapTag$8 = '[object Map]',
	    objectTag$4 = '[object Object]',
	    promiseTag$1 = '[object Promise]',
	    setTag$8 = '[object Set]',
	    weakMapTag$4 = '[object WeakMap]';

	var dataViewTag$6 = '[object DataView]';

	/** Used to detect maps, sets, and weakmaps. */
	var dataViewCtorString$1 = toSource$1(DataView$1),
	    mapCtorString$1 = toSource$1(Map$2),
	    promiseCtorString$1 = toSource$1(Promise$2),
	    setCtorString$1 = toSource$1(Set$2),
	    weakMapCtorString$1 = toSource$1(WeakMap$1);

	/**
	 * Gets the `toStringTag` of `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	var getTag$1 = baseGetTag$1;

	// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
	if ((DataView$1 && getTag$1(new DataView$1(new ArrayBuffer(1))) != dataViewTag$6) ||
	    (Map$2 && getTag$1(new Map$2) != mapTag$8) ||
	    (Promise$2 && getTag$1(Promise$2.resolve()) != promiseTag$1) ||
	    (Set$2 && getTag$1(new Set$2) != setTag$8) ||
	    (WeakMap$1 && getTag$1(new WeakMap$1) != weakMapTag$4)) {
	  getTag$1 = function(value) {
	    var result = baseGetTag$1(value),
	        Ctor = result == objectTag$4 ? value.constructor : undefined,
	        ctorString = Ctor ? toSource$1(Ctor) : '';

	    if (ctorString) {
	      switch (ctorString) {
	        case dataViewCtorString$1: return dataViewTag$6;
	        case mapCtorString$1: return mapTag$8;
	        case promiseCtorString$1: return promiseTag$1;
	        case setCtorString$1: return setTag$8;
	        case weakMapCtorString$1: return weakMapTag$4;
	      }
	    }
	    return result;
	  };
	}

	/** Used for built-in method references. */
	var objectProto$4 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

	/**
	 * Initializes an array clone.
	 *
	 * @private
	 * @param {Array} array The array to clone.
	 * @returns {Array} Returns the initialized clone.
	 */
	function initCloneArray$1(array) {
	  var length = array.length,
	      result = new array.constructor(length);

	  // Add properties assigned by `RegExp#exec`.
	  if (length && typeof array[0] == 'string' && hasOwnProperty$3.call(array, 'index')) {
	    result.index = array.index;
	    result.input = array.input;
	  }
	  return result;
	}

	/** Built-in value references. */
	var Uint8Array$1 = root$1.Uint8Array;

	/**
	 * Creates a clone of `arrayBuffer`.
	 *
	 * @private
	 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
	 * @returns {ArrayBuffer} Returns the cloned array buffer.
	 */
	function cloneArrayBuffer$1(arrayBuffer) {
	  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
	  new Uint8Array$1(result).set(new Uint8Array$1(arrayBuffer));
	  return result;
	}

	/**
	 * Creates a clone of `dataView`.
	 *
	 * @private
	 * @param {Object} dataView The data view to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned data view.
	 */
	function cloneDataView$1(dataView, isDeep) {
	  var buffer = isDeep ? cloneArrayBuffer$1(dataView.buffer) : dataView.buffer;
	  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
	}

	/** Used to match `RegExp` flags from their coerced string values. */
	var reFlags$1 = /\w*$/;

	/**
	 * Creates a clone of `regexp`.
	 *
	 * @private
	 * @param {Object} regexp The regexp to clone.
	 * @returns {Object} Returns the cloned regexp.
	 */
	function cloneRegExp$1(regexp) {
	  var result = new regexp.constructor(regexp.source, reFlags$1.exec(regexp));
	  result.lastIndex = regexp.lastIndex;
	  return result;
	}

	/** Used to convert symbols to primitives and strings. */
	var symbolProto$1 = Symbol$2 ? Symbol$2.prototype : undefined,
	    symbolValueOf$1 = symbolProto$1 ? symbolProto$1.valueOf : undefined;

	/**
	 * Creates a clone of the `symbol` object.
	 *
	 * @private
	 * @param {Object} symbol The symbol object to clone.
	 * @returns {Object} Returns the cloned symbol object.
	 */
	function cloneSymbol$1(symbol) {
	  return symbolValueOf$1 ? Object(symbolValueOf$1.call(symbol)) : {};
	}

	/**
	 * Creates a clone of `typedArray`.
	 *
	 * @private
	 * @param {Object} typedArray The typed array to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned typed array.
	 */
	function cloneTypedArray$1(typedArray, isDeep) {
	  var buffer = isDeep ? cloneArrayBuffer$1(typedArray.buffer) : typedArray.buffer;
	  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
	}

	/** `Object#toString` result references. */
	var boolTag$4 = '[object Boolean]',
	    dateTag$4 = '[object Date]',
	    mapTag$7 = '[object Map]',
	    numberTag$4 = '[object Number]',
	    regexpTag$4 = '[object RegExp]',
	    setTag$7 = '[object Set]',
	    stringTag$4 = '[object String]',
	    symbolTag$3 = '[object Symbol]';

	var arrayBufferTag$4 = '[object ArrayBuffer]',
	    dataViewTag$5 = '[object DataView]',
	    float32Tag$4 = '[object Float32Array]',
	    float64Tag$4 = '[object Float64Array]',
	    int8Tag$4 = '[object Int8Array]',
	    int16Tag$4 = '[object Int16Array]',
	    int32Tag$4 = '[object Int32Array]',
	    uint8Tag$4 = '[object Uint8Array]',
	    uint8ClampedTag$4 = '[object Uint8ClampedArray]',
	    uint16Tag$4 = '[object Uint16Array]',
	    uint32Tag$4 = '[object Uint32Array]';

	/**
	 * Initializes an object clone based on its `toStringTag`.
	 *
	 * **Note:** This function only supports cloning values with tags of
	 * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @param {string} tag The `toStringTag` of the object to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneByTag$1(object, tag, isDeep) {
	  var Ctor = object.constructor;
	  switch (tag) {
	    case arrayBufferTag$4:
	      return cloneArrayBuffer$1(object);

	    case boolTag$4:
	    case dateTag$4:
	      return new Ctor(+object);

	    case dataViewTag$5:
	      return cloneDataView$1(object, isDeep);

	    case float32Tag$4: case float64Tag$4:
	    case int8Tag$4: case int16Tag$4: case int32Tag$4:
	    case uint8Tag$4: case uint8ClampedTag$4: case uint16Tag$4: case uint32Tag$4:
	      return cloneTypedArray$1(object, isDeep);

	    case mapTag$7:
	      return new Ctor;

	    case numberTag$4:
	    case stringTag$4:
	      return new Ctor(object);

	    case regexpTag$4:
	      return cloneRegExp$1(object);

	    case setTag$7:
	      return new Ctor;

	    case symbolTag$3:
	      return cloneSymbol$1(object);
	  }
	}

	/**
	 * Initializes an object clone.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneObject$1(object) {
	  return (typeof object.constructor == 'function' && !isPrototype$1(object))
	    ? baseCreate$1(getPrototype$1(object))
	    : {};
	}

	/** `Object#toString` result references. */
	var mapTag$6 = '[object Map]';

	/**
	 * The base implementation of `_.isMap` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
	 */
	function baseIsMap$1(value) {
	  return isObjectLike$1(value) && getTag$1(value) == mapTag$6;
	}

	/* Node.js helper references. */
	var nodeIsMap$1 = nodeUtil$1 && nodeUtil$1.isMap;

	/**
	 * Checks if `value` is classified as a `Map` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
	 * @example
	 *
	 * _.isMap(new Map);
	 * // => true
	 *
	 * _.isMap(new WeakMap);
	 * // => false
	 */
	var isMap$1 = nodeIsMap$1 ? baseUnary$1(nodeIsMap$1) : baseIsMap$1;

	/** `Object#toString` result references. */
	var setTag$6 = '[object Set]';

	/**
	 * The base implementation of `_.isSet` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
	 */
	function baseIsSet$1(value) {
	  return isObjectLike$1(value) && getTag$1(value) == setTag$6;
	}

	/* Node.js helper references. */
	var nodeIsSet$1 = nodeUtil$1 && nodeUtil$1.isSet;

	/**
	 * Checks if `value` is classified as a `Set` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
	 * @example
	 *
	 * _.isSet(new Set);
	 * // => true
	 *
	 * _.isSet(new WeakSet);
	 * // => false
	 */
	var isSet$1 = nodeIsSet$1 ? baseUnary$1(nodeIsSet$1) : baseIsSet$1;

	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG$2 = 1,
	    CLONE_FLAT_FLAG = 2,
	    CLONE_SYMBOLS_FLAG$2 = 4;

	/** `Object#toString` result references. */
	var argsTag$3 = '[object Arguments]',
	    arrayTag$2 = '[object Array]',
	    boolTag$3 = '[object Boolean]',
	    dateTag$3 = '[object Date]',
	    errorTag$2 = '[object Error]',
	    funcTag$3 = '[object Function]',
	    genTag$2 = '[object GeneratorFunction]',
	    mapTag$5 = '[object Map]',
	    numberTag$3 = '[object Number]',
	    objectTag$3 = '[object Object]',
	    regexpTag$3 = '[object RegExp]',
	    setTag$5 = '[object Set]',
	    stringTag$3 = '[object String]',
	    symbolTag$2 = '[object Symbol]',
	    weakMapTag$3 = '[object WeakMap]';

	var arrayBufferTag$3 = '[object ArrayBuffer]',
	    dataViewTag$4 = '[object DataView]',
	    float32Tag$3 = '[object Float32Array]',
	    float64Tag$3 = '[object Float64Array]',
	    int8Tag$3 = '[object Int8Array]',
	    int16Tag$3 = '[object Int16Array]',
	    int32Tag$3 = '[object Int32Array]',
	    uint8Tag$3 = '[object Uint8Array]',
	    uint8ClampedTag$3 = '[object Uint8ClampedArray]',
	    uint16Tag$3 = '[object Uint16Array]',
	    uint32Tag$3 = '[object Uint32Array]';

	/** Used to identify `toStringTag` values supported by `_.clone`. */
	var cloneableTags$1 = {};
	cloneableTags$1[argsTag$3] = cloneableTags$1[arrayTag$2] =
	cloneableTags$1[arrayBufferTag$3] = cloneableTags$1[dataViewTag$4] =
	cloneableTags$1[boolTag$3] = cloneableTags$1[dateTag$3] =
	cloneableTags$1[float32Tag$3] = cloneableTags$1[float64Tag$3] =
	cloneableTags$1[int8Tag$3] = cloneableTags$1[int16Tag$3] =
	cloneableTags$1[int32Tag$3] = cloneableTags$1[mapTag$5] =
	cloneableTags$1[numberTag$3] = cloneableTags$1[objectTag$3] =
	cloneableTags$1[regexpTag$3] = cloneableTags$1[setTag$5] =
	cloneableTags$1[stringTag$3] = cloneableTags$1[symbolTag$2] =
	cloneableTags$1[uint8Tag$3] = cloneableTags$1[uint8ClampedTag$3] =
	cloneableTags$1[uint16Tag$3] = cloneableTags$1[uint32Tag$3] = true;
	cloneableTags$1[errorTag$2] = cloneableTags$1[funcTag$3] =
	cloneableTags$1[weakMapTag$3] = false;

	/**
	 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
	 * traversed objects.
	 *
	 * @private
	 * @param {*} value The value to clone.
	 * @param {boolean} bitmask The bitmask flags.
	 *  1 - Deep clone
	 *  2 - Flatten inherited properties
	 *  4 - Clone symbols
	 * @param {Function} [customizer] The function to customize cloning.
	 * @param {string} [key] The key of `value`.
	 * @param {Object} [object] The parent object of `value`.
	 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
	 * @returns {*} Returns the cloned value.
	 */
	function baseClone$1(value, bitmask, customizer, key, object, stack) {
	  var result,
	      isDeep = bitmask & CLONE_DEEP_FLAG$2,
	      isFlat = bitmask & CLONE_FLAT_FLAG,
	      isFull = bitmask & CLONE_SYMBOLS_FLAG$2;
	  if (result !== undefined) {
	    return result;
	  }
	  if (!isObject$2(value)) {
	    return value;
	  }
	  var isArr = isArray$1(value);
	  if (isArr) {
	    result = initCloneArray$1(value);
	    if (!isDeep) {
	      return copyArray(value, result);
	    }
	  } else {
	    var tag = getTag$1(value),
	        isFunc = tag == funcTag$3 || tag == genTag$2;

	    if (isBuffer$1(value)) {
	      return cloneBuffer$1(value, isDeep);
	    }
	    if (tag == objectTag$3 || tag == argsTag$3 || (isFunc && !object)) {
	      result = (isFlat || isFunc) ? {} : initCloneObject$1(value);
	      if (!isDeep) {
	        return isFlat
	          ? copySymbolsIn(value, baseAssignIn(result, value))
	          : copySymbols(value, baseAssign(result, value));
	      }
	    } else {
	      if (!cloneableTags$1[tag]) {
	        return object ? value : {};
	      }
	      result = initCloneByTag$1(value, tag, isDeep);
	    }
	  }
	  // Check for circular references and return its corresponding clone.
	  stack || (stack = new Stack$1);
	  var stacked = stack.get(value);
	  if (stacked) {
	    return stacked;
	  }
	  stack.set(value, result);

	  if (isSet$1(value)) {
	    value.forEach(function(subValue) {
	      result.add(baseClone$1(subValue, bitmask, customizer, subValue, value, stack));
	    });
	  } else if (isMap$1(value)) {
	    value.forEach(function(subValue, key) {
	      result.set(key, baseClone$1(subValue, bitmask, customizer, key, value, stack));
	    });
	  }

	  var keysFunc = isFull
	    ? (isFlat ? getAllKeysIn : getAllKeys$1)
	    : (isFlat ? keysIn : keys$1);

	  var props = isArr ? undefined : keysFunc(value);
	  arrayEach$1(props || value, function(subValue, key) {
	    if (props) {
	      key = subValue;
	      subValue = value[key];
	    }
	    // Recursively populate clone (susceptible to call stack limits).
	    assignValue$1(result, key, baseClone$1(subValue, bitmask, customizer, key, value, stack));
	  });
	  return result;
	}

	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG$1 = 1,
	    CLONE_SYMBOLS_FLAG$1 = 4;

	/**
	 * This method is like `_.clone` except that it recursively clones `value`.
	 *
	 * @static
	 * @memberOf _
	 * @since 1.0.0
	 * @category Lang
	 * @param {*} value The value to recursively clone.
	 * @returns {*} Returns the deep cloned value.
	 * @see _.clone
	 * @example
	 *
	 * var objects = [{ 'a': 1 }, { 'b': 2 }];
	 *
	 * var deep = _.cloneDeep(objects);
	 * console.log(deep[0] === objects[0]);
	 * // => false
	 */
	function cloneDeep$1(value) {
	  return baseClone$1(value, CLONE_DEEP_FLAG$1 | CLONE_SYMBOLS_FLAG$1);
	}

	/**
	 * The base implementation of `_.set`.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @param {Function} [customizer] The function to customize path creation.
	 * @returns {Object} Returns `object`.
	 */
	function baseSet(object, path, value, customizer) {
	  if (!isObject$2(object)) {
	    return object;
	  }
	  path = castPath(path, object);

	  var index = -1,
	      length = path.length,
	      lastIndex = length - 1,
	      nested = object;

	  while (nested != null && ++index < length) {
	    var key = toKey(path[index]),
	        newValue = value;

	    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
	      return object;
	    }

	    if (index != lastIndex) {
	      var objValue = nested[key];
	      newValue = undefined;
	      if (newValue === undefined) {
	        newValue = isObject$2(objValue)
	          ? objValue
	          : (isIndex$1(path[index + 1]) ? [] : {});
	      }
	    }
	    assignValue$1(nested, key, newValue);
	    nested = nested[key];
	  }
	  return object;
	}

	/**
	 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
	 * it's created. Arrays are created for missing index properties while objects
	 * are created for all other missing properties. Use `_.setWith` to customize
	 * `path` creation.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.set(object, 'a[0].b.c', 4);
	 * console.log(object.a[0].b.c);
	 * // => 4
	 *
	 * _.set(object, ['x', '0', 'y', 'z'], 5);
	 * console.log(object.x[0].y.z);
	 * // => 5
	 */
	function set(object, path, value) {
	  return object == null ? object : baseSet(object, path, value);
	}

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

	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();

	/** Built-in value references. */
	var Symbol$1 = root.Symbol;

	/** Used for built-in method references. */
	var objectProto$c = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$9 = objectProto$c.hasOwnProperty;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString$1 = objectProto$c.toString;

	/** Built-in value references. */
	var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;

	/**
	 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the raw `toStringTag`.
	 */
	function getRawTag(value) {
	  var isOwn = hasOwnProperty$9.call(value, symToStringTag$1),
	      tag = value[symToStringTag$1];

	  try {
	    value[symToStringTag$1] = undefined;
	    var unmasked = true;
	  } catch (e) {}

	  var result = nativeObjectToString$1.call(value);
	  if (unmasked) {
	    if (isOwn) {
	      value[symToStringTag$1] = tag;
	    } else {
	      delete value[symToStringTag$1];
	    }
	  }
	  return result;
	}

	/** Used for built-in method references. */
	var objectProto$b = Object.prototype;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto$b.toString;

	/**
	 * Converts `value` to a string using `Object.prototype.toString`.
	 *
	 * @private
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 */
	function objectToString(value) {
	  return nativeObjectToString.call(value);
	}

	/** `Object#toString` result references. */
	var nullTag = '[object Null]',
	    undefinedTag = '[object Undefined]';

	/** Built-in value references. */
	var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;

	/**
	 * The base implementation of `getTag` without fallbacks for buggy environments.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag(value) {
	  if (value == null) {
	    return value === undefined ? undefinedTag : nullTag;
	  }
	  return (symToStringTag && symToStringTag in Object(value))
	    ? getRawTag(value)
	    : objectToString(value);
	}

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return value != null && typeof value == 'object';
	}

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject$1(value) {
	  var type = typeof value;
	  return value != null && (type == 'object' || type == 'function');
	}

	/**
	 * This method returns the first argument it receives.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Util
	 * @param {*} value Any value.
	 * @returns {*} Returns `value`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 *
	 * console.log(_.identity(object) === object);
	 * // => true
	 */
	function identity(value) {
	  return value;
	}

	/** `Object#toString` result references. */
	var asyncTag = '[object AsyncFunction]',
	    funcTag$2 = '[object Function]',
	    genTag$1 = '[object GeneratorFunction]',
	    proxyTag = '[object Proxy]';

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  if (!isObject$1(value)) {
	    return false;
	  }
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 9 which returns 'object' for typed arrays and other constructors.
	  var tag = baseGetTag(value);
	  return tag == funcTag$2 || tag == genTag$1 || tag == asyncTag || tag == proxyTag;
	}

	/** Used to detect overreaching core-js shims. */
	var coreJsData = root['__core-js_shared__'];

	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function() {
	  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
	  return uid ? ('Symbol(src)_1.' + uid) : '';
	}());

	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
	  return !!maskSrcKey && (maskSrcKey in func);
	}

	/** Used for built-in method references. */
	var funcProto$1 = Function.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString$1 = funcProto$1.toString;

	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to convert.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
	  if (func != null) {
	    try {
	      return funcToString$1.call(func);
	    } catch (e) {}
	    try {
	      return (func + '');
	    } catch (e) {}
	  }
	  return '';
	}

	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;

	/** Used for built-in method references. */
	var funcProto = Function.prototype,
	    objectProto$a = Object.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;

	/** Used to check objects for own properties. */
	var hasOwnProperty$8 = objectProto$a.hasOwnProperty;

	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  funcToString.call(hasOwnProperty$8).replace(reRegExpChar, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);

	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
	  if (!isObject$1(value) || isMasked(value)) {
	    return false;
	  }
	  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
	  return pattern.test(toSource(value));
	}

	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue(object, key) {
	  return object == null ? undefined : object[key];
	}

	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = getValue(object, key);
	  return baseIsNative(value) ? value : undefined;
	}

	/* Built-in method references that are verified to be native. */
	var WeakMap = getNative(root, 'WeakMap');

	/** Built-in value references. */
	var objectCreate = Object.create;

	/**
	 * The base implementation of `_.create` without support for assigning
	 * properties to the created object.
	 *
	 * @private
	 * @param {Object} proto The object to inherit from.
	 * @returns {Object} Returns the new object.
	 */
	var baseCreate = (function() {
	  function object() {}
	  return function(proto) {
	    if (!isObject$1(proto)) {
	      return {};
	    }
	    if (objectCreate) {
	      return objectCreate(proto);
	    }
	    object.prototype = proto;
	    var result = new object;
	    object.prototype = undefined;
	    return result;
	  };
	}());

	/**
	 * A faster alternative to `Function#apply`, this function invokes `func`
	 * with the `this` binding of `thisArg` and the arguments of `args`.
	 *
	 * @private
	 * @param {Function} func The function to invoke.
	 * @param {*} thisArg The `this` binding of `func`.
	 * @param {Array} args The arguments to invoke `func` with.
	 * @returns {*} Returns the result of `func`.
	 */
	function apply(func, thisArg, args) {
	  switch (args.length) {
	    case 0: return func.call(thisArg);
	    case 1: return func.call(thisArg, args[0]);
	    case 2: return func.call(thisArg, args[0], args[1]);
	    case 3: return func.call(thisArg, args[0], args[1], args[2]);
	  }
	  return func.apply(thisArg, args);
	}

	/**
	 * This method returns `undefined`.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.3.0
	 * @category Util
	 * @example
	 *
	 * _.times(2, _.noop);
	 * // => [undefined, undefined]
	 */
	function noop() {
	  // No operation performed.
	}

	/** Used to detect hot functions by number of calls within a span of milliseconds. */
	var HOT_COUNT = 800,
	    HOT_SPAN = 16;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeNow = Date.now;

	/**
	 * Creates a function that'll short out and invoke `identity` instead
	 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
	 * milliseconds.
	 *
	 * @private
	 * @param {Function} func The function to restrict.
	 * @returns {Function} Returns the new shortable function.
	 */
	function shortOut(func) {
	  var count = 0,
	      lastCalled = 0;

	  return function() {
	    var stamp = nativeNow(),
	        remaining = HOT_SPAN - (stamp - lastCalled);

	    lastCalled = stamp;
	    if (remaining > 0) {
	      if (++count >= HOT_COUNT) {
	        return arguments[0];
	      }
	    } else {
	      count = 0;
	    }
	    return func.apply(undefined, arguments);
	  };
	}

	/**
	 * Creates a function that returns `value`.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.4.0
	 * @category Util
	 * @param {*} value The value to return from the new function.
	 * @returns {Function} Returns the new constant function.
	 * @example
	 *
	 * var objects = _.times(2, _.constant({ 'a': 1 }));
	 *
	 * console.log(objects);
	 * // => [{ 'a': 1 }, { 'a': 1 }]
	 *
	 * console.log(objects[0] === objects[1]);
	 * // => true
	 */
	function constant(value) {
	  return function() {
	    return value;
	  };
	}

	var defineProperty = (function() {
	  try {
	    var func = getNative(Object, 'defineProperty');
	    func({}, '', {});
	    return func;
	  } catch (e) {}
	}());

	/**
	 * The base implementation of `setToString` without support for hot loop shorting.
	 *
	 * @private
	 * @param {Function} func The function to modify.
	 * @param {Function} string The `toString` result.
	 * @returns {Function} Returns `func`.
	 */
	var baseSetToString = !defineProperty ? identity : function(func, string) {
	  return defineProperty(func, 'toString', {
	    'configurable': true,
	    'enumerable': false,
	    'value': constant(string),
	    'writable': true
	  });
	};

	/**
	 * Sets the `toString` method of `func` to return `string`.
	 *
	 * @private
	 * @param {Function} func The function to modify.
	 * @param {Function} string The `toString` result.
	 * @returns {Function} Returns `func`.
	 */
	var setToString = shortOut(baseSetToString);

	/**
	 * A specialized version of `_.forEach` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns `array`.
	 */
	function arrayEach(array, iteratee) {
	  var index = -1,
	      length = array == null ? 0 : array.length;

	  while (++index < length) {
	    if (iteratee(array[index], index, array) === false) {
	      break;
	    }
	  }
	  return array;
	}

	/**
	 * The base implementation of `_.findIndex` and `_.findLastIndex` without
	 * support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {Function} predicate The function invoked per iteration.
	 * @param {number} fromIndex The index to search from.
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseFindIndex(array, predicate, fromIndex, fromRight) {
	  var length = array.length,
	      index = fromIndex + (-1);

	  while ((++index < length)) {
	    if (predicate(array[index], index, array)) {
	      return index;
	    }
	  }
	  return -1;
	}

	/**
	 * The base implementation of `_.isNaN` without support for number objects.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
	 */
	function baseIsNaN(value) {
	  return value !== value;
	}

	/**
	 * A specialized version of `_.indexOf` which performs strict equality
	 * comparisons of values, i.e. `===`.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function strictIndexOf(array, value, fromIndex) {
	  var index = fromIndex - 1,
	      length = array.length;

	  while (++index < length) {
	    if (array[index] === value) {
	      return index;
	    }
	  }
	  return -1;
	}

	/**
	 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseIndexOf(array, value, fromIndex) {
	  return value === value
	    ? strictIndexOf(array, value, fromIndex)
	    : baseFindIndex(array, baseIsNaN, fromIndex);
	}

	/**
	 * A specialized version of `_.includes` for arrays without support for
	 * specifying an index to search from.
	 *
	 * @private
	 * @param {Array} [array] The array to inspect.
	 * @param {*} target The value to search for.
	 * @returns {boolean} Returns `true` if `target` is found, else `false`.
	 */
	function arrayIncludes(array, value) {
	  var length = array == null ? 0 : array.length;
	  return !!length && baseIndexOf(array, value, 0) > -1;
	}

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER$1 = 9007199254740991;

	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;

	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  var type = typeof value;
	  length = length == null ? MAX_SAFE_INTEGER$1 : length;

	  return !!length &&
	    (type == 'number' ||
	      (type != 'symbol' && reIsUint.test(value))) &&
	        (value > -1 && value % 1 == 0 && value < length);
	}

	/**
	 * The base implementation of `assignValue` and `assignMergeValue` without
	 * value checks.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function baseAssignValue(object, key, value) {
	  if (key == '__proto__' && defineProperty) {
	    defineProperty(object, key, {
	      'configurable': true,
	      'enumerable': true,
	      'value': value,
	      'writable': true
	    });
	  } else {
	    object[key] = value;
	  }
	}

	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
	  return value === other || (value !== value && other !== other);
	}

	/** Used for built-in method references. */
	var objectProto$9 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$7 = objectProto$9.hasOwnProperty;

	/**
	 * Assigns `value` to `key` of `object` if the existing value is not equivalent
	 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * for equality comparisons.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function assignValue(object, key, value) {
	  var objValue = object[key];
	  if (!(hasOwnProperty$7.call(object, key) && eq(objValue, value)) ||
	      (value === undefined && !(key in object))) {
	    baseAssignValue(object, key, value);
	  }
	}

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeMax = Math.max;

	/**
	 * A specialized version of `baseRest` which transforms the rest array.
	 *
	 * @private
	 * @param {Function} func The function to apply a rest parameter to.
	 * @param {number} [start=func.length-1] The start position of the rest parameter.
	 * @param {Function} transform The rest array transform.
	 * @returns {Function} Returns the new function.
	 */
	function overRest(func, start, transform) {
	  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
	  return function() {
	    var args = arguments,
	        index = -1,
	        length = nativeMax(args.length - start, 0),
	        array = Array(length);

	    while (++index < length) {
	      array[index] = args[start + index];
	    }
	    index = -1;
	    var otherArgs = Array(start + 1);
	    while (++index < start) {
	      otherArgs[index] = args[index];
	    }
	    otherArgs[start] = transform(array);
	    return apply(func, this, otherArgs);
	  };
	}

	/**
	 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
	 *
	 * @private
	 * @param {Function} func The function to apply a rest parameter to.
	 * @param {number} [start=func.length-1] The start position of the rest parameter.
	 * @returns {Function} Returns the new function.
	 */
	function baseRest(func, start) {
	  return setToString(overRest(func, start, identity), func + '');
	}

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;

	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' &&
	    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}

	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null && isLength(value.length) && !isFunction(value);
	}

	/** Used for built-in method references. */
	var objectProto$8 = Object.prototype;

	/**
	 * Checks if `value` is likely a prototype object.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	 */
	function isPrototype(value) {
	  var Ctor = value && value.constructor,
	      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$8;

	  return value === proto;
	}

	/**
	 * The base implementation of `_.times` without support for iteratee shorthands
	 * or max array length checks.
	 *
	 * @private
	 * @param {number} n The number of times to invoke `iteratee`.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the array of results.
	 */
	function baseTimes(n, iteratee) {
	  var index = -1,
	      result = Array(n);

	  while (++index < n) {
	    result[index] = iteratee(index);
	  }
	  return result;
	}

	/** `Object#toString` result references. */
	var argsTag$2 = '[object Arguments]';

	/**
	 * The base implementation of `_.isArguments`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 */
	function baseIsArguments(value) {
	  return isObjectLike(value) && baseGetTag(value) == argsTag$2;
	}

	/** Used for built-in method references. */
	var objectProto$7 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$6 = objectProto$7.hasOwnProperty;

	/** Built-in value references. */
	var propertyIsEnumerable$1 = objectProto$7.propertyIsEnumerable;

	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
	  return isObjectLike(value) && hasOwnProperty$6.call(value, 'callee') &&
	    !propertyIsEnumerable$1.call(value, 'callee');
	};

	/**
	 * This method returns `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {boolean} Returns `false`.
	 * @example
	 *
	 * _.times(2, _.stubFalse);
	 * // => [false, false]
	 */
	function stubFalse() {
	  return false;
	}

	/** Detect free variable `exports`. */
	var freeExports$2 = typeof exports == 'object' && exports && !exports.nodeType && exports;

	/** Detect free variable `module`. */
	var freeModule$2 = freeExports$2 && typeof module == 'object' && module && !module.nodeType && module;

	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2;

	/** Built-in value references. */
	var Buffer$1 = moduleExports$2 ? root.Buffer : undefined;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeIsBuffer = Buffer$1 ? Buffer$1.isBuffer : undefined;

	/**
	 * Checks if `value` is a buffer.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
	 * @example
	 *
	 * _.isBuffer(new Buffer(2));
	 * // => true
	 *
	 * _.isBuffer(new Uint8Array(2));
	 * // => false
	 */
	var isBuffer = nativeIsBuffer || stubFalse;

	/** `Object#toString` result references. */
	var argsTag$1 = '[object Arguments]',
	    arrayTag$1 = '[object Array]',
	    boolTag$2 = '[object Boolean]',
	    dateTag$2 = '[object Date]',
	    errorTag$1 = '[object Error]',
	    funcTag$1 = '[object Function]',
	    mapTag$4 = '[object Map]',
	    numberTag$2 = '[object Number]',
	    objectTag$2 = '[object Object]',
	    regexpTag$2 = '[object RegExp]',
	    setTag$4 = '[object Set]',
	    stringTag$2 = '[object String]',
	    weakMapTag$2 = '[object WeakMap]';

	var arrayBufferTag$2 = '[object ArrayBuffer]',
	    dataViewTag$3 = '[object DataView]',
	    float32Tag$2 = '[object Float32Array]',
	    float64Tag$2 = '[object Float64Array]',
	    int8Tag$2 = '[object Int8Array]',
	    int16Tag$2 = '[object Int16Array]',
	    int32Tag$2 = '[object Int32Array]',
	    uint8Tag$2 = '[object Uint8Array]',
	    uint8ClampedTag$2 = '[object Uint8ClampedArray]',
	    uint16Tag$2 = '[object Uint16Array]',
	    uint32Tag$2 = '[object Uint32Array]';

	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag$2] = typedArrayTags[float64Tag$2] =
	typedArrayTags[int8Tag$2] = typedArrayTags[int16Tag$2] =
	typedArrayTags[int32Tag$2] = typedArrayTags[uint8Tag$2] =
	typedArrayTags[uint8ClampedTag$2] = typedArrayTags[uint16Tag$2] =
	typedArrayTags[uint32Tag$2] = true;
	typedArrayTags[argsTag$1] = typedArrayTags[arrayTag$1] =
	typedArrayTags[arrayBufferTag$2] = typedArrayTags[boolTag$2] =
	typedArrayTags[dataViewTag$3] = typedArrayTags[dateTag$2] =
	typedArrayTags[errorTag$1] = typedArrayTags[funcTag$1] =
	typedArrayTags[mapTag$4] = typedArrayTags[numberTag$2] =
	typedArrayTags[objectTag$2] = typedArrayTags[regexpTag$2] =
	typedArrayTags[setTag$4] = typedArrayTags[stringTag$2] =
	typedArrayTags[weakMapTag$2] = false;

	/**
	 * The base implementation of `_.isTypedArray` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 */
	function baseIsTypedArray(value) {
	  return isObjectLike(value) &&
	    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
	}

	/**
	 * The base implementation of `_.unary` without support for storing metadata.
	 *
	 * @private
	 * @param {Function} func The function to cap arguments for.
	 * @returns {Function} Returns the new capped function.
	 */
	function baseUnary(func) {
	  return function(value) {
	    return func(value);
	  };
	}

	/** Detect free variable `exports`. */
	var freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;

	/** Detect free variable `module`. */
	var freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;

	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

	/** Detect free variable `process` from Node.js. */
	var freeProcess = moduleExports$1 && freeGlobal.process;

	/** Used to access faster Node.js helpers. */
	var nodeUtil = (function() {
	  try {
	    // Use `util.types` for Node.js 10+.
	    var types = freeModule$1 && freeModule$1.require && freeModule$1.require('util').types;

	    if (types) {
	      return types;
	    }

	    // Legacy `process.binding('util')` for Node.js < 10.
	    return freeProcess && freeProcess.binding && freeProcess.binding('util');
	  } catch (e) {}
	}());

	/* Node.js helper references. */
	var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

	/**
	 * Checks if `value` is classified as a typed array.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 * @example
	 *
	 * _.isTypedArray(new Uint8Array);
	 * // => true
	 *
	 * _.isTypedArray([]);
	 * // => false
	 */
	var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

	/** Used for built-in method references. */
	var objectProto$6 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$5 = objectProto$6.hasOwnProperty;

	/**
	 * Creates an array of the enumerable property names of the array-like `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @param {boolean} inherited Specify returning inherited property names.
	 * @returns {Array} Returns the array of property names.
	 */
	function arrayLikeKeys(value, inherited) {
	  var isArr = isArray(value),
	      isArg = !isArr && isArguments(value),
	      isBuff = !isArr && !isArg && isBuffer(value),
	      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
	      skipIndexes = isArr || isArg || isBuff || isType,
	      result = skipIndexes ? baseTimes(value.length, String) : [],
	      length = result.length;

	  for (var key in value) {
	    if ((hasOwnProperty$5.call(value, key)) &&
	        !(skipIndexes && (
	           // Safari 9 has enumerable `arguments.length` in strict mode.
	           key == 'length' ||
	           // Node.js 0.10 has enumerable non-index properties on buffers.
	           (isBuff && (key == 'offset' || key == 'parent')) ||
	           // PhantomJS 2 has enumerable non-index properties on typed arrays.
	           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
	           // Skip index properties.
	           isIndex(key, length)
	        ))) {
	      result.push(key);
	    }
	  }
	  return result;
	}

	/**
	 * Creates a unary function that invokes `func` with its argument transformed.
	 *
	 * @private
	 * @param {Function} func The function to wrap.
	 * @param {Function} transform The argument transform.
	 * @returns {Function} Returns the new function.
	 */
	function overArg(func, transform) {
	  return function(arg) {
	    return func(transform(arg));
	  };
	}

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeKeys = overArg(Object.keys, Object);

	/** Used for built-in method references. */
	var objectProto$5 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

	/**
	 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeys(object) {
	  if (!isPrototype(object)) {
	    return nativeKeys(object);
	  }
	  var result = [];
	  for (var key in Object(object)) {
	    if (hasOwnProperty$4.call(object, key) && key != 'constructor') {
	      result.push(key);
	    }
	  }
	  return result;
	}

	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keys(new Foo);
	 * // => ['a', 'b'] (iteration order is not guaranteed)
	 *
	 * _.keys('hi');
	 * // => ['0', '1']
	 */
	function keys(object) {
	  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
	}

	/* Built-in method references that are verified to be native. */
	var nativeCreate = getNative(Object, 'create');

	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
	  this.__data__ = nativeCreate ? nativeCreate(null) : {};
	  this.size = 0;
	}

	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(key) {
	  var result = this.has(key) && delete this.__data__[key];
	  this.size -= result ? 1 : 0;
	  return result;
	}

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

	/** Used for built-in method references. */
	var objectProto$3 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
	  var data = this.__data__;
	  if (nativeCreate) {
	    var result = data[key];
	    return result === HASH_UNDEFINED$2 ? undefined : result;
	  }
	  return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
	}

	/** Used for built-in method references. */
	var objectProto$2 = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
	  var data = this.__data__;
	  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty$1.call(data, key);
	}

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
	  var data = this.__data__;
	  this.size += this.has(key) ? 0 : 1;
	  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
	  return this;
	}

	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `Hash`.
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;

	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear() {
	  this.__data__ = [];
	  this.size = 0;
	}

	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
	  var length = array.length;
	  while (length--) {
	    if (eq(array[length][0], key)) {
	      return length;
	    }
	  }
	  return -1;
	}

	/** Used for built-in method references. */
	var arrayProto = Array.prototype;

	/** Built-in value references. */
	var splice = arrayProto.splice;

	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  if (index < 0) {
	    return false;
	  }
	  var lastIndex = data.length - 1;
	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice.call(data, index, 1);
	  }
	  --this.size;
	  return true;
	}

	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  return index < 0 ? undefined : data[index][1];
	}

	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
	  return assocIndexOf(this.__data__, key) > -1;
	}

	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  if (index < 0) {
	    ++this.size;
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }
	  return this;
	}

	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `ListCache`.
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;

	/* Built-in method references that are verified to be native. */
	var Map$1 = getNative(root, 'Map');

	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
	  this.size = 0;
	  this.__data__ = {
	    'hash': new Hash,
	    'map': new (Map$1 || ListCache),
	    'string': new Hash
	  };
	}

	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	  var type = typeof value;
	  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
	    ? (value !== '__proto__')
	    : (value === null);
	}

	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
	  var data = map.__data__;
	  return isKeyable(key)
	    ? data[typeof key == 'string' ? 'string' : 'hash']
	    : data.map;
	}

	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
	  var result = getMapData(this, key)['delete'](key);
	  this.size -= result ? 1 : 0;
	  return result;
	}

	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
	  return getMapData(this, key).get(key);
	}

	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
	  return getMapData(this, key).has(key);
	}

	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
	  var data = getMapData(this, key),
	      size = data.size;

	  data.set(key, value);
	  this.size += data.size == size ? 0 : 1;
	  return this;
	}

	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `MapCache`.
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;

	/**
	 * Appends the elements of `values` to `array`.
	 *
	 * @private
	 * @param {Array} array The array to modify.
	 * @param {Array} values The values to append.
	 * @returns {Array} Returns `array`.
	 */
	function arrayPush(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;

	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}

	/** Built-in value references. */
	var spreadableSymbol = Symbol$1 ? Symbol$1.isConcatSpreadable : undefined;

	/**
	 * Checks if `value` is a flattenable `arguments` object or array.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
	 */
	function isFlattenable(value) {
	  return isArray(value) || isArguments(value) ||
	    !!(spreadableSymbol && value && value[spreadableSymbol]);
	}

	/**
	 * The base implementation of `_.flatten` with support for restricting flattening.
	 *
	 * @private
	 * @param {Array} array The array to flatten.
	 * @param {number} depth The maximum recursion depth.
	 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
	 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
	 * @param {Array} [result=[]] The initial result value.
	 * @returns {Array} Returns the new flattened array.
	 */
	function baseFlatten(array, depth, predicate, isStrict, result) {
	  var index = -1,
	      length = array.length;

	  predicate || (predicate = isFlattenable);
	  result || (result = []);

	  while (++index < length) {
	    var value = array[index];
	    if (predicate(value)) {
	      {
	        arrayPush(result, value);
	      }
	    }
	  }
	  return result;
	}

	/** Built-in value references. */
	var getPrototype = overArg(Object.getPrototypeOf, Object);

	/**
	 * Removes all key-value entries from the stack.
	 *
	 * @private
	 * @name clear
	 * @memberOf Stack
	 */
	function stackClear() {
	  this.__data__ = new ListCache;
	  this.size = 0;
	}

	/**
	 * Removes `key` and its value from the stack.
	 *
	 * @private
	 * @name delete
	 * @memberOf Stack
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function stackDelete(key) {
	  var data = this.__data__,
	      result = data['delete'](key);

	  this.size = data.size;
	  return result;
	}

	/**
	 * Gets the stack value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Stack
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function stackGet(key) {
	  return this.__data__.get(key);
	}

	/**
	 * Checks if a stack value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Stack
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function stackHas(key) {
	  return this.__data__.has(key);
	}

	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE$1 = 200;

	/**
	 * Sets the stack `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Stack
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the stack cache instance.
	 */
	function stackSet(key, value) {
	  var data = this.__data__;
	  if (data instanceof ListCache) {
	    var pairs = data.__data__;
	    if (!Map$1 || (pairs.length < LARGE_ARRAY_SIZE$1 - 1)) {
	      pairs.push([key, value]);
	      this.size = ++data.size;
	      return this;
	    }
	    data = this.__data__ = new MapCache(pairs);
	  }
	  data.set(key, value);
	  this.size = data.size;
	  return this;
	}

	/**
	 * Creates a stack cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Stack(entries) {
	  var data = this.__data__ = new ListCache(entries);
	  this.size = data.size;
	}

	// Add methods to `Stack`.
	Stack.prototype.clear = stackClear;
	Stack.prototype['delete'] = stackDelete;
	Stack.prototype.get = stackGet;
	Stack.prototype.has = stackHas;
	Stack.prototype.set = stackSet;

	/** Detect free variable `exports`. */
	var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

	/** Detect free variable `module`. */
	var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;

	/** Built-in value references. */
	var Buffer = moduleExports ? root.Buffer : undefined;
	    Buffer ? Buffer.allocUnsafe : undefined;

	/**
	 * Creates a clone of  `buffer`.
	 *
	 * @private
	 * @param {Buffer} buffer The buffer to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Buffer} Returns the cloned buffer.
	 */
	function cloneBuffer(buffer, isDeep) {
	  {
	    return buffer.slice();
	  }
	}

	/**
	 * A specialized version of `_.filter` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} predicate The function invoked per iteration.
	 * @returns {Array} Returns the new filtered array.
	 */
	function arrayFilter(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length,
	      resIndex = 0,
	      result = [];

	  while (++index < length) {
	    var value = array[index];
	    if (predicate(value, index, array)) {
	      result[resIndex++] = value;
	    }
	  }
	  return result;
	}

	/**
	 * This method returns a new empty array.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {Array} Returns the new empty array.
	 * @example
	 *
	 * var arrays = _.times(2, _.stubArray);
	 *
	 * console.log(arrays);
	 * // => [[], []]
	 *
	 * console.log(arrays[0] === arrays[1]);
	 * // => false
	 */
	function stubArray() {
	  return [];
	}

	/** Used for built-in method references. */
	var objectProto$1 = Object.prototype;

	/** Built-in value references. */
	var propertyIsEnumerable = objectProto$1.propertyIsEnumerable;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeGetSymbols$1 = Object.getOwnPropertySymbols;

	/**
	 * Creates an array of the own enumerable symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of symbols.
	 */
	var getSymbols = !nativeGetSymbols$1 ? stubArray : function(object) {
	  if (object == null) {
	    return [];
	  }
	  object = Object(object);
	  return arrayFilter(nativeGetSymbols$1(object), function(symbol) {
	    return propertyIsEnumerable.call(object, symbol);
	  });
	};

	/**
	 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
	 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
	 * symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @param {Function} symbolsFunc The function to get the symbols of `object`.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function baseGetAllKeys(object, keysFunc, symbolsFunc) {
	  var result = keysFunc(object);
	  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
	}

	/**
	 * Creates an array of own enumerable property names and symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function getAllKeys(object) {
	  return baseGetAllKeys(object, keys, getSymbols);
	}

	/* Built-in method references that are verified to be native. */
	var DataView = getNative(root, 'DataView');

	/* Built-in method references that are verified to be native. */
	var Promise$1 = getNative(root, 'Promise');

	/* Built-in method references that are verified to be native. */
	var Set$1 = getNative(root, 'Set');

	/** `Object#toString` result references. */
	var mapTag$3 = '[object Map]',
	    objectTag$1 = '[object Object]',
	    promiseTag = '[object Promise]',
	    setTag$3 = '[object Set]',
	    weakMapTag$1 = '[object WeakMap]';

	var dataViewTag$2 = '[object DataView]';

	/** Used to detect maps, sets, and weakmaps. */
	var dataViewCtorString = toSource(DataView),
	    mapCtorString = toSource(Map$1),
	    promiseCtorString = toSource(Promise$1),
	    setCtorString = toSource(Set$1),
	    weakMapCtorString = toSource(WeakMap);

	/**
	 * Gets the `toStringTag` of `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	var getTag = baseGetTag;

	// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
	if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag$2) ||
	    (Map$1 && getTag(new Map$1) != mapTag$3) ||
	    (Promise$1 && getTag(Promise$1.resolve()) != promiseTag) ||
	    (Set$1 && getTag(new Set$1) != setTag$3) ||
	    (WeakMap && getTag(new WeakMap) != weakMapTag$1)) {
	  getTag = function(value) {
	    var result = baseGetTag(value),
	        Ctor = result == objectTag$1 ? value.constructor : undefined,
	        ctorString = Ctor ? toSource(Ctor) : '';

	    if (ctorString) {
	      switch (ctorString) {
	        case dataViewCtorString: return dataViewTag$2;
	        case mapCtorString: return mapTag$3;
	        case promiseCtorString: return promiseTag;
	        case setCtorString: return setTag$3;
	        case weakMapCtorString: return weakMapTag$1;
	      }
	    }
	    return result;
	  };
	}

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Initializes an array clone.
	 *
	 * @private
	 * @param {Array} array The array to clone.
	 * @returns {Array} Returns the initialized clone.
	 */
	function initCloneArray(array) {
	  var length = array.length,
	      result = new array.constructor(length);

	  // Add properties assigned by `RegExp#exec`.
	  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
	    result.index = array.index;
	    result.input = array.input;
	  }
	  return result;
	}

	/** Built-in value references. */
	var Uint8Array = root.Uint8Array;

	/**
	 * Creates a clone of `arrayBuffer`.
	 *
	 * @private
	 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
	 * @returns {ArrayBuffer} Returns the cloned array buffer.
	 */
	function cloneArrayBuffer(arrayBuffer) {
	  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
	  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
	  return result;
	}

	/**
	 * Creates a clone of `dataView`.
	 *
	 * @private
	 * @param {Object} dataView The data view to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned data view.
	 */
	function cloneDataView(dataView, isDeep) {
	  var buffer = cloneArrayBuffer(dataView.buffer) ;
	  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
	}

	/** Used to match `RegExp` flags from their coerced string values. */
	var reFlags = /\w*$/;

	/**
	 * Creates a clone of `regexp`.
	 *
	 * @private
	 * @param {Object} regexp The regexp to clone.
	 * @returns {Object} Returns the cloned regexp.
	 */
	function cloneRegExp(regexp) {
	  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
	  result.lastIndex = regexp.lastIndex;
	  return result;
	}

	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol$1 ? Symbol$1.prototype : undefined,
	    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

	/**
	 * Creates a clone of the `symbol` object.
	 *
	 * @private
	 * @param {Object} symbol The symbol object to clone.
	 * @returns {Object} Returns the cloned symbol object.
	 */
	function cloneSymbol(symbol) {
	  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
	}

	/**
	 * Creates a clone of `typedArray`.
	 *
	 * @private
	 * @param {Object} typedArray The typed array to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the cloned typed array.
	 */
	function cloneTypedArray(typedArray, isDeep) {
	  var buffer = cloneArrayBuffer(typedArray.buffer) ;
	  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
	}

	/** `Object#toString` result references. */
	var boolTag$1 = '[object Boolean]',
	    dateTag$1 = '[object Date]',
	    mapTag$2 = '[object Map]',
	    numberTag$1 = '[object Number]',
	    regexpTag$1 = '[object RegExp]',
	    setTag$2 = '[object Set]',
	    stringTag$1 = '[object String]',
	    symbolTag$1 = '[object Symbol]';

	var arrayBufferTag$1 = '[object ArrayBuffer]',
	    dataViewTag$1 = '[object DataView]',
	    float32Tag$1 = '[object Float32Array]',
	    float64Tag$1 = '[object Float64Array]',
	    int8Tag$1 = '[object Int8Array]',
	    int16Tag$1 = '[object Int16Array]',
	    int32Tag$1 = '[object Int32Array]',
	    uint8Tag$1 = '[object Uint8Array]',
	    uint8ClampedTag$1 = '[object Uint8ClampedArray]',
	    uint16Tag$1 = '[object Uint16Array]',
	    uint32Tag$1 = '[object Uint32Array]';

	/**
	 * Initializes an object clone based on its `toStringTag`.
	 *
	 * **Note:** This function only supports cloning values with tags of
	 * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @param {string} tag The `toStringTag` of the object to clone.
	 * @param {boolean} [isDeep] Specify a deep clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneByTag(object, tag, isDeep) {
	  var Ctor = object.constructor;
	  switch (tag) {
	    case arrayBufferTag$1:
	      return cloneArrayBuffer(object);

	    case boolTag$1:
	    case dateTag$1:
	      return new Ctor(+object);

	    case dataViewTag$1:
	      return cloneDataView(object);

	    case float32Tag$1: case float64Tag$1:
	    case int8Tag$1: case int16Tag$1: case int32Tag$1:
	    case uint8Tag$1: case uint8ClampedTag$1: case uint16Tag$1: case uint32Tag$1:
	      return cloneTypedArray(object);

	    case mapTag$2:
	      return new Ctor;

	    case numberTag$1:
	    case stringTag$1:
	      return new Ctor(object);

	    case regexpTag$1:
	      return cloneRegExp(object);

	    case setTag$2:
	      return new Ctor;

	    case symbolTag$1:
	      return cloneSymbol(object);
	  }
	}

	/**
	 * Initializes an object clone.
	 *
	 * @private
	 * @param {Object} object The object to clone.
	 * @returns {Object} Returns the initialized clone.
	 */
	function initCloneObject(object) {
	  return (typeof object.constructor == 'function' && !isPrototype(object))
	    ? baseCreate(getPrototype(object))
	    : {};
	}

	/** `Object#toString` result references. */
	var mapTag$1 = '[object Map]';

	/**
	 * The base implementation of `_.isMap` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
	 */
	function baseIsMap(value) {
	  return isObjectLike(value) && getTag(value) == mapTag$1;
	}

	/* Node.js helper references. */
	var nodeIsMap = nodeUtil && nodeUtil.isMap;

	/**
	 * Checks if `value` is classified as a `Map` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
	 * @example
	 *
	 * _.isMap(new Map);
	 * // => true
	 *
	 * _.isMap(new WeakMap);
	 * // => false
	 */
	var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;

	/** `Object#toString` result references. */
	var setTag$1 = '[object Set]';

	/**
	 * The base implementation of `_.isSet` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
	 */
	function baseIsSet(value) {
	  return isObjectLike(value) && getTag(value) == setTag$1;
	}

	/* Node.js helper references. */
	var nodeIsSet = nodeUtil && nodeUtil.isSet;

	/**
	 * Checks if `value` is classified as a `Set` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
	 * @example
	 *
	 * _.isSet(new Set);
	 * // => true
	 *
	 * _.isSet(new WeakSet);
	 * // => false
	 */
	var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    objectTag = '[object Object]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    symbolTag = '[object Symbol]',
	    weakMapTag = '[object WeakMap]';

	var arrayBufferTag = '[object ArrayBuffer]',
	    dataViewTag = '[object DataView]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';

	/** Used to identify `toStringTag` values supported by `_.clone`. */
	var cloneableTags = {};
	cloneableTags[argsTag] = cloneableTags[arrayTag] =
	cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
	cloneableTags[boolTag] = cloneableTags[dateTag] =
	cloneableTags[float32Tag] = cloneableTags[float64Tag] =
	cloneableTags[int8Tag] = cloneableTags[int16Tag] =
	cloneableTags[int32Tag] = cloneableTags[mapTag] =
	cloneableTags[numberTag] = cloneableTags[objectTag] =
	cloneableTags[regexpTag] = cloneableTags[setTag] =
	cloneableTags[stringTag] = cloneableTags[symbolTag] =
	cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
	cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
	cloneableTags[errorTag] = cloneableTags[funcTag] =
	cloneableTags[weakMapTag] = false;

	/**
	 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
	 * traversed objects.
	 *
	 * @private
	 * @param {*} value The value to clone.
	 * @param {boolean} bitmask The bitmask flags.
	 *  1 - Deep clone
	 *  2 - Flatten inherited properties
	 *  4 - Clone symbols
	 * @param {Function} [customizer] The function to customize cloning.
	 * @param {string} [key] The key of `value`.
	 * @param {Object} [object] The parent object of `value`.
	 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
	 * @returns {*} Returns the cloned value.
	 */
	function baseClone(value, bitmask, customizer, key, object, stack) {
	  var result;
	  if (result !== undefined) {
	    return result;
	  }
	  if (!isObject$1(value)) {
	    return value;
	  }
	  var isArr = isArray(value);
	  if (isArr) {
	    result = initCloneArray(value);
	  } else {
	    var tag = getTag(value),
	        isFunc = tag == funcTag || tag == genTag;

	    if (isBuffer(value)) {
	      return cloneBuffer(value);
	    }
	    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
	      result = (isFunc) ? {} : initCloneObject(value);
	    } else {
	      if (!cloneableTags[tag]) {
	        return object ? value : {};
	      }
	      result = initCloneByTag(value, tag);
	    }
	  }
	  // Check for circular references and return its corresponding clone.
	  stack || (stack = new Stack);
	  var stacked = stack.get(value);
	  if (stacked) {
	    return stacked;
	  }
	  stack.set(value, result);

	  if (isSet(value)) {
	    value.forEach(function(subValue) {
	      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
	    });
	  } else if (isMap(value)) {
	    value.forEach(function(subValue, key) {
	      result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
	    });
	  }

	  var keysFunc = (getAllKeys)
	    ;

	  var props = isArr ? undefined : keysFunc(value);
	  arrayEach(props || value, function(subValue, key) {
	    if (props) {
	      key = subValue;
	      subValue = value[key];
	    }
	    // Recursively populate clone (susceptible to call stack limits).
	    assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
	  });
	  return result;
	}

	/** Used to compose bitmasks for cloning. */
	var CLONE_DEEP_FLAG = 1,
	    CLONE_SYMBOLS_FLAG = 4;

	/**
	 * This method is like `_.clone` except that it recursively clones `value`.
	 *
	 * @static
	 * @memberOf _
	 * @since 1.0.0
	 * @category Lang
	 * @param {*} value The value to recursively clone.
	 * @returns {*} Returns the deep cloned value.
	 * @see _.clone
	 * @example
	 *
	 * var objects = [{ 'a': 1 }, { 'b': 2 }];
	 *
	 * var deep = _.cloneDeep(objects);
	 * console.log(deep[0] === objects[0]);
	 * // => false
	 */
	function cloneDeep(value) {
	  return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
	}

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';

	/**
	 * Adds `value` to the array cache.
	 *
	 * @private
	 * @name add
	 * @memberOf SetCache
	 * @alias push
	 * @param {*} value The value to cache.
	 * @returns {Object} Returns the cache instance.
	 */
	function setCacheAdd(value) {
	  this.__data__.set(value, HASH_UNDEFINED);
	  return this;
	}

	/**
	 * Checks if `value` is in the array cache.
	 *
	 * @private
	 * @name has
	 * @memberOf SetCache
	 * @param {*} value The value to search for.
	 * @returns {number} Returns `true` if `value` is found, else `false`.
	 */
	function setCacheHas(value) {
	  return this.__data__.has(value);
	}

	/**
	 *
	 * Creates an array cache object to store unique values.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [values] The values to cache.
	 */
	function SetCache(values) {
	  var index = -1,
	      length = values == null ? 0 : values.length;

	  this.__data__ = new MapCache;
	  while (++index < length) {
	    this.add(values[index]);
	  }
	}

	// Add methods to `SetCache`.
	SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
	SetCache.prototype.has = setCacheHas;

	/**
	 * Checks if a `cache` value for `key` exists.
	 *
	 * @private
	 * @param {Object} cache The cache to query.
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function cacheHas(cache, key) {
	  return cache.has(key);
	}

	/**
	 * Converts `set` to an array of its values.
	 *
	 * @private
	 * @param {Object} set The set to convert.
	 * @returns {Array} Returns the values.
	 */
	function setToArray(set) {
	  var index = -1,
	      result = Array(set.size);

	  set.forEach(function(value) {
	    result[++index] = value;
	  });
	  return result;
	}

	/**
	 * This method is like `_.isArrayLike` except that it also checks if `value`
	 * is an object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array-like object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArrayLikeObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLikeObject(document.body.children);
	 * // => true
	 *
	 * _.isArrayLikeObject('abc');
	 * // => false
	 *
	 * _.isArrayLikeObject(_.noop);
	 * // => false
	 */
	function isArrayLikeObject(value) {
	  return isObjectLike(value) && isArrayLike(value);
	}

	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;

	/**
	 * Creates a set object of `values`.
	 *
	 * @private
	 * @param {Array} values The values to add to the set.
	 * @returns {Object} Returns the new set.
	 */
	var createSet = !(Set$1 && (1 / setToArray(new Set$1([,-0]))[1]) == INFINITY) ? noop : function(values) {
	  return new Set$1(values);
	};

	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE = 200;

	/**
	 * The base implementation of `_.uniqBy` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {Function} [iteratee] The iteratee invoked per element.
	 * @param {Function} [comparator] The comparator invoked per element.
	 * @returns {Array} Returns the new duplicate free array.
	 */
	function baseUniq(array, iteratee, comparator) {
	  var index = -1,
	      includes = arrayIncludes,
	      length = array.length,
	      isCommon = true,
	      result = [],
	      seen = result;

	  if (length >= LARGE_ARRAY_SIZE) {
	    var set = createSet(array);
	    if (set) {
	      return setToArray(set);
	    }
	    isCommon = false;
	    includes = cacheHas;
	    seen = new SetCache;
	  }
	  else {
	    seen = result;
	  }
	  outer:
	  while (++index < length) {
	    var value = array[index],
	        computed = value;

	    value = (value !== 0) ? value : 0;
	    if (isCommon && computed === computed) {
	      var seenIndex = seen.length;
	      while (seenIndex--) {
	        if (seen[seenIndex] === computed) {
	          continue outer;
	        }
	      }
	      result.push(value);
	    }
	    else if (!includes(seen, computed, comparator)) {
	      if (seen !== result) {
	        seen.push(computed);
	      }
	      result.push(value);
	    }
	  }
	  return result;
	}

	/**
	 * Creates an array of unique values, in order, from all given arrays using
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * for equality comparisons.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Array
	 * @param {...Array} [arrays] The arrays to inspect.
	 * @returns {Array} Returns the new array of combined values.
	 * @example
	 *
	 * _.union([2], [1, 2]);
	 * // => [2, 1]
	 */
	baseRest(function(arrays) {
	  return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject));
	});

	class ObservedData {
	}

	class SimpleObservedData extends ObservedData {
	  data = {};
	  event = new eventsExports.EventEmitter();
	  constructor(initialData) {
	    super();
	    this.data = initialData;
	  }
	  update(data, path) {
	    if (path) {
	      setValueByKeyPath(path, data, this.data);
	    } else {
	      this.data = data;
	    }
	    const changeEvent = {
	      updateData: data,
	      path: path ?? ""
	    };
	    if (path) {
	      this.event.emit(path, changeEvent);
	    }
	    this.event.emit("", changeEvent);
	  }
	  on(path, callback) {
	    this.event.on(path, callback);
	  }
	  off(path, callback) {
	    this.event.off(path, callback);
	  }
	  getData(path) {
	    return path ? getValueByKeyPath(path, this.data) : this.data;
	  }
	  destroy() {
	  }
	}

	class DataSource extends EventEmitter$1 {
	  isInit = false;
	  /** @tmagic/core 实例 */
	  app;
	  mockData;
	  #type = "base";
	  #id;
	  #schema;
	  #observedData;
	  /** 数据源自定义字段配置 */
	  #fields = [];
	  /** 数据源自定义方法配置 */
	  #methods = [];
	  constructor(options) {
	    super();
	    this.#id = options.schema.id;
	    this.#schema = options.schema;
	    this.app = options.app;
	    this.setFields(options.schema.fields);
	    this.setMethods(options.schema.methods || []);
	    let data = options.initialData;
	    const ObservedDataClass = options.ObservedDataClass || SimpleObservedData;
	    if (this.app.platform === "editor") {
	      this.mockData = options.schema.mocks?.find((mock) => mock.useInEditor)?.data || this.getDefaultData();
	      data = cloneDeep(this.mockData);
	    } else if (typeof options.useMock === "boolean" && options.useMock) {
	      this.mockData = options.schema.mocks?.find((mock) => mock.enable)?.data;
	      data = this.mockData || this.getDefaultData();
	    } else if (!options.initialData) {
	      data = this.getDefaultData();
	    } else {
	      this.#observedData = new ObservedDataClass(options.initialData ?? {});
	      this.isInit = true;
	      return;
	    }
	    this.#observedData = new ObservedDataClass(data ?? {});
	  }
	  get id() {
	    return this.#id;
	  }
	  get type() {
	    return this.#type;
	  }
	  get schema() {
	    return this.#schema;
	  }
	  get fields() {
	    return this.#fields;
	  }
	  get methods() {
	    return this.#methods;
	  }
	  setFields(fields) {
	    this.#fields = fields;
	  }
	  setMethods(methods) {
	    this.#methods = methods;
	  }
	  get data() {
	    return this.#observedData.getData("");
	  }
	  setData(data, path) {
	    this.#observedData.update(data, path);
	    const changeEvent = {
	      updateData: data,
	      path
	    };
	    this.emit("change", changeEvent);
	  }
	  setValue(path, data) {
	    return this.setData(data, path);
	  }
	  onDataChange(path, callback) {
	    this.#observedData.on(path, callback);
	  }
	  offDataChange(path, callback) {
	    this.#observedData.off(path, callback);
	  }
	  getDefaultData() {
	    return getDefaultValueFromFields(this.#fields);
	  }
	  async init() {
	    this.isInit = true;
	  }
	  destroy() {
	    this.#fields = [];
	    this.removeAllListeners();
	    this.#observedData.destroy();
	  }
	}

	const urlencoded = (data) => Object.entries(data).reduce((prev, [key, value]) => {
	  let v = value;
	  if (typeof value === "object") {
	    v = JSON.stringify(value);
	  }
	  if (typeof value !== "undefined") {
	    return `${prev}${prev ? "&" : ""}${globalThis.encodeURIComponent(key)}=${globalThis.encodeURIComponent(`${v}`)}`;
	  }
	  return prev;
	}, "");
	const webRequest = async (options) => {
	  const { url, method = "GET", headers = {}, params = {}, data = {}, ...config } = options;
	  const query = urlencoded(params);
	  let body = JSON.stringify(data);
	  if (headers["Content-Type"]?.includes("application/x-www-form-urlencoded")) {
	    body = urlencoded(data);
	  }
	  const response = await globalThis.fetch(query ? `${url}?${query}` : url, {
	    method,
	    headers,
	    body: method === "GET" ? void 0 : body,
	    ...config
	  });
	  return response.json();
	};
	class HttpDataSource extends DataSource {
	  /** 是否正在发起请求 */
	  isLoading = false;
	  error;
	  /** 请求配置 */
	  httpOptions;
	  /** 请求函数 */
	  #fetch;
	  /** 请求前需要执行的函数队列 */
	  #beforeRequest = [];
	  /** 请求后需要执行的函数队列 */
	  #afterRequest = [];
	  #type = "http";
	  constructor(options) {
	    const { options: httpOptions } = options.schema;
	    super(options);
	    this.httpOptions = httpOptions;
	    if (typeof options.request === "function") {
	      this.#fetch = options.request;
	    } else if (typeof globalThis.fetch === "function") {
	      this.#fetch = webRequest;
	    }
	    this.methods.forEach((method) => {
	      if (typeof method.content !== "function") return;
	      if (method.timing === "beforeRequest") {
	        this.#beforeRequest.push(method.content);
	      }
	      if (method.timing === "afterRequest") {
	        this.#afterRequest.push(method.content);
	      }
	    });
	  }
	  get type() {
	    return this.#type;
	  }
	  async init() {
	    if (this.schema.autoFetch) {
	      await this.request();
	    }
	    super.init();
	  }
	  async request(options = {}) {
	    this.isLoading = true;
	    const { url, params, data, headers, ...otherHttpOptions } = this.httpOptions;
	    let reqOptions = {
	      url: typeof url === "function" ? url({ app: this.app, dataSource: this }) : url,
	      params: typeof params === "function" ? params({ app: this.app, dataSource: this }) : params,
	      data: typeof data === "function" ? data({ app: this.app, dataSource: this }) : data,
	      headers: typeof headers === "function" ? headers({ app: this.app, dataSource: this }) : headers,
	      ...otherHttpOptions,
	      ...options
	    };
	    try {
	      for (const method of this.#beforeRequest) {
	        await method({ options: reqOptions, params: {}, dataSource: this, app: this.app });
	      }
	      if (typeof this.schema.beforeRequest === "function") {
	        reqOptions = await this.schema.beforeRequest(reqOptions, { app: this.app, dataSource: this });
	      }
	      if (this.mockData) {
	        this.setData(this.mockData);
	      } else {
	        let res = await this.#fetch?.(reqOptions);
	        for (const method of this.#afterRequest) {
	          await method({ res, options: reqOptions, params: {}, dataSource: this, app: this.app });
	        }
	        if (typeof this.schema.afterResponse === "function") {
	          res = await this.schema.afterResponse(res, { app: this.app, dataSource: this, options: reqOptions });
	        }
	        if (this.schema.responseOptions?.dataPath) {
	          const data2 = getValueByKeyPath(this.schema.responseOptions.dataPath, res);
	          this.setData(data2);
	        } else {
	          this.setData(res);
	        }
	      }
	      this.error = void 0;
	    } catch (error) {
	      this.error = {
	        msg: error.message
	      };
	      this.emit("error", error);
	    }
	    this.isLoading = false;
	  }
	  get(options) {
	    return this.request({
	      ...options,
	      method: "GET"
	    });
	  }
	  post(options) {
	    return this.request({
	      ...options,
	      method: "POST"
	    });
	  }
	}

	const cache = /* @__PURE__ */ new Map();
	const getDeps = (ds, nodes, inEditor) => {
	  let cacheKey;
	  if (inEditor) {
	    const ids = [];
	    nodes.forEach((node) => {
	      traverseNode(node, (node2) => {
	        ids.push(node2.id);
	      });
	    });
	    cacheKey = `${ds.id}:${ids.join(":")}`;
	  } else {
	    cacheKey = `${ds.id}:${nodes.map((node) => node.id).join(":")}`;
	  }
	  if (cache.has(cacheKey)) {
	    return cache.get(cacheKey);
	  }
	  const watcher = new Watcher();
	  watcher.addTarget(
	    new Target({
	      id: ds.id,
	      type: "data-source",
	      isTarget: (key, value) => {
	        if (`${key}`.includes(DSL_NODE_KEY_COPY_PREFIX)) {
	          return false;
	        }
	        return isDataSourceTarget(ds, key, value, true);
	      }
	    })
	  );
	  watcher.addTarget(
	    new Target({
	      id: ds.id,
	      type: "cond",
	      isTarget: (key, value) => isDataSourceCondTarget(ds, key, value, true)
	    })
	  );
	  watcher.collect(nodes, {}, true);
	  const { deps } = watcher.getTarget(ds.id, "data-source");
	  const { deps: condDeps } = watcher.getTarget(ds.id, "cond");
	  const result = { deps, condDeps };
	  cache.set(cacheKey, result);
	  return result;
	};

	const compiledCondition = (cond, data) => {
	  let result = true;
	  for (const { op, value, range, field } of cond) {
	    const [sourceId, ...fields] = field;
	    const dsData = data[sourceId];
	    if (!dsData || !fields.length) {
	      break;
	    }
	    try {
	      const fieldValue = getValueByKeyPath(fields.join("."), dsData);
	      if (!compiledCond(op, fieldValue, value, range)) {
	        result = false;
	        break;
	      }
	    } catch (e) {
	      console.warn(e);
	    }
	  }
	  return result;
	};
	const compliedConditions = (node, data) => {
	  if (!node[C] || !Array.isArray(node[C]) || !node[C].length) return true;
	  for (const { cond } of node[C]) {
	    if (!cond) continue;
	    if (compiledCondition(cond, data)) {
	      return true;
	    }
	  }
	  return false;
	};
	const createIteratorContentData = (itemData, dsId, fields = [], dsData = {}) => {
	  const data = {
	    ...dsData,
	    [dsId]: {}
	  };
	  let rawData = cloneDeep(dsData[dsId]);
	  let obj = data[dsId];
	  fields.forEach((key, index) => {
	    Object.assign(obj, rawData);
	    if (index === fields.length - 1) {
	      obj[key] = itemData;
	      return;
	    }
	    if (Array.isArray(rawData[key])) {
	      rawData[key] = {};
	      obj[key] = {};
	    }
	    rawData = rawData[key];
	    obj = obj[key];
	  });
	  return data;
	};
	const compliedDataSourceField = (value, data) => {
	  const [prefixId, ...fields] = value;
	  const prefixIndex = prefixId.indexOf(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX);
	  if (prefixIndex > -1) {
	    const dsId = prefixId.substring(prefixIndex + DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX.length);
	    const dsData = data[dsId];
	    if (!dsData) return value;
	    try {
	      return getValueByKeyPath(fields.join("."), dsData);
	    } catch (e) {
	      return value;
	    }
	  }
	  return value;
	};
	const template = (value, data) => value.replaceAll(dataSourceTemplateRegExp, (match, $1) => {
	  try {
	    return getValueByKeyPath($1, data);
	  } catch (e) {
	    return match;
	  }
	});
	const compiledNodeField = (value, data) => {
	  if (typeof value === "string") {
	    return template(value, data);
	  }
	  if (value?.isBindDataSource && value.dataSourceId) {
	    return data[value.dataSourceId];
	  }
	  if (value?.isBindDataSourceField && value.dataSourceId && typeof value.template === "string") {
	    return template(value.template, data[value.dataSourceId]);
	  }
	  if (Array.isArray(value) && typeof value[0] === "string") {
	    return compliedDataSourceField(value, data);
	  }
	  return value;
	};
	const compliedIteratorItem = ({
	  compile,
	  dsId,
	  item,
	  deps,
	  condDeps,
	  inEditor,
	  ctxData
	}) => {
	  const { items, ...node } = item;
	  const newNode = cloneDeep(node);
	  if (condDeps[node.id]?.keys.length && !inEditor) {
	    newNode.condResult = compliedConditions(node, ctxData);
	  }
	  if (Array.isArray(items) && items.length) {
	    newNode.items = items.map(
	      (item2) => compliedIteratorItem({ compile, dsId, item: item2, deps, condDeps, inEditor, ctxData })
	    );
	  } else if (items) {
	    newNode.items = items;
	  }
	  if (!deps[newNode.id]?.keys.length) {
	    return newNode;
	  }
	  return compiledNode(
	    compile,
	    newNode,
	    {
	      [dsId]: deps
	    },
	    dsId
	  );
	};

	class DataSourceManager extends EventEmitter$1 {
	  static dataSourceClassMap = /* @__PURE__ */ new Map();
	  static ObservedDataClass = SimpleObservedData;
	  static register(type, dataSource) {
	    DataSourceManager.dataSourceClassMap.set(type, dataSource);
	  }
	  static getDataSourceClass(type) {
	    return DataSourceManager.dataSourceClassMap.get(type);
	  }
	  static registerObservedData(ObservedDataClass) {
	    DataSourceManager.ObservedDataClass = ObservedDataClass;
	  }
	  app;
	  dataSourceMap = /* @__PURE__ */ new Map();
	  data = {};
	  useMock = false;
	  constructor({ app, useMock, initialData }) {
	    super();
	    this.app = app;
	    this.useMock = useMock;
	    if (initialData) {
	      this.data = initialData;
	    }
	    app.dsl?.dataSources?.forEach((config) => {
	      this.addDataSource(config);
	    });
	    const dataSourceList = Array.from(this.dataSourceMap);
	    if (typeof Promise.allSettled === "function") {
	      Promise.allSettled(dataSourceList.map(([, ds]) => this.init(ds))).then((values) => {
	        const data = {};
	        const errors = {};
	        values.forEach((value, index) => {
	          const dsId = dataSourceList[index][0];
	          if (value.status === "fulfilled") {
	            if (this.data[dsId]) {
	              data[dsId] = this.data[dsId];
	            } else {
	              delete data[dsId];
	            }
	          } else if (value.status === "rejected") {
	            delete data[dsId];
	            errors[dsId] = value.reason;
	          }
	        });
	        this.emit("init", data, errors);
	      });
	    } else {
	      Promise.all(dataSourceList.map(([, ds]) => this.init(ds))).then(() => {
	        this.emit("init", this.data);
	      }).catch(() => {
	        this.emit("init", this.data);
	      });
	    }
	  }
	  async init(ds) {
	    if (ds.isInit) {
	      return;
	    }
	    if (this.app.jsEngine && ds.schema.disabledInitInJsEngine?.includes(this.app.jsEngine)) {
	      return;
	    }
	    for (const method of ds.methods) {
	      if (typeof method.content !== "function") return;
	      if (method.timing === "beforeInit") {
	        await method.content({ params: {}, dataSource: ds, app: this.app });
	      }
	    }
	    await ds.init();
	    for (const method of ds.methods) {
	      if (typeof method.content !== "function") return;
	      if (method.timing === "afterInit") {
	        await method.content({ params: {}, dataSource: ds, app: this.app });
	      }
	    }
	  }
	  get(id) {
	    return this.dataSourceMap.get(id);
	  }
	  async addDataSource(config) {
	    if (!config) return;
	    const DataSourceClass = DataSourceManager.dataSourceClassMap.get(config.type) || DataSource;
	    const ds = new DataSourceClass({
	      app: this.app,
	      schema: config,
	      request: this.app.request,
	      useMock: this.useMock,
	      initialData: this.data[config.id],
	      ObservedDataClass: DataSourceManager.ObservedDataClass
	    });
	    this.dataSourceMap.set(config.id, ds);
	    this.data[ds.id] = ds.data;
	    ds.on("change", (changeEvent) => {
	      this.setData(ds, changeEvent);
	    });
	  }
	  setData(ds, changeEvent) {
	    this.data[ds.id] = ds.data;
	    this.emit("change", ds.id, changeEvent);
	  }
	  removeDataSource(id) {
	    this.get(id)?.destroy();
	    delete this.data[id];
	    this.dataSourceMap.delete(id);
	  }
	  /**
	   * 更新数据源dsl，在编辑器中修改配置后需要更新，一般在其他环境下不需要更新dsl
	   * @param {DataSourceSchema[]} schemas 所有数据源配置
	   */
	  updateSchema(schemas) {
	    schemas.forEach((schema) => {
	      const ds = this.get(schema.id);
	      if (!ds) {
	        return;
	      }
	      this.removeDataSource(schema.id);
	      this.addDataSource(schema);
	      const newDs = this.get(schema.id);
	      if (newDs) {
	        this.init(newDs);
	      }
	    });
	  }
	  /**
	   * 将组件dsl中所有key中数据源相关的配置编译成对应的值
	   * @param {MNode} node 组件dsl
	   * @param {string | number} sourceId 数据源ID
	   * @param {boolean} deep 是否编译子项（items)，默认为false
	   * @returns {MNode} 编译后的组件dsl
	   */
	  compiledNode({ items, ...node }, sourceId, deep = false) {
	    const newNode = cloneDeep(node);
	    if (items) {
	      newNode.items = Array.isArray(items) && deep ? items.map((item) => this.compiledNode(item, sourceId, deep)) : items;
	    }
	    if (node.condResult === false) return newNode;
	    if (node.visible === false) return newNode;
	    return compiledNode(
	      (value) => compiledNodeField(value, this.data),
	      newNode,
	      this.app.dsl?.dataSourceDeps || {},
	      sourceId
	    );
	  }
	  /**
	   * 编译组件条件组配置（用于配置组件显示时机）
	   * @param {{ [NODE_CONDS_KEY]?: DisplayCond[] }} node 显示条件组配置
	   * @returns {boolean} 是否显示
	   */
	  compliedConds(node) {
	    return compliedConditions(node, this.data);
	  }
	  /**
	   * 编译迭代器容器的迭代项的显示条件
	   * @param {any[]} itemData 迭代数据
	   * @param {{ [NODE_CONDS_KEY]?: DisplayCond[] }} node 显示条件组配置
	   * @param {string[]} dataSourceField 迭代数据在数据源中的字段，格式如['dsId', 'key1', 'key2']
	   * @returns {boolean}是否显示
	   */
	  compliedIteratorItemConds(itemData, node, dataSourceField = []) {
	    const [dsId, ...keys] = dataSourceField;
	    const ds = this.get(dsId);
	    if (!ds) return true;
	    const ctxData = createIteratorContentData(itemData, ds.id, keys, this.data);
	    return compliedConditions(node, ctxData);
	  }
	  compliedIteratorItems(itemData, nodes, dataSourceField = []) {
	    const [dsId, ...keys] = dataSourceField;
	    const ds = this.get(dsId);
	    if (!ds) return nodes;
	    const inEditor = this.app.platform === "editor";
	    const ctxData = createIteratorContentData(itemData, ds.id, keys, this.data);
	    const { deps = {}, condDeps = {} } = getDeps(ds.schema, nodes, inEditor);
	    if (!Object.keys(deps).length && !Object.keys(condDeps).length) {
	      return nodes;
	    }
	    return nodes.map(
	      (item) => compliedIteratorItem({
	        compile: (value) => compiledNodeField(value, ctxData),
	        dsId: ds.id,
	        item,
	        deps,
	        condDeps,
	        inEditor,
	        ctxData
	      })
	    );
	  }
	  destroy() {
	    this.removeAllListeners();
	    this.data = {};
	    this.dataSourceMap.forEach((ds) => {
	      ds.destroy();
	    });
	    this.dataSourceMap.clear();
	  }
	  onDataChange(id, path, callback) {
	    return this.get(id)?.onDataChange(path, callback);
	  }
	  offDataChange(id, path, callback) {
	    return this.get(id)?.offDataChange(path, callback);
	  }
	}
	DataSourceManager.register("http", HttpDataSource);

	const C = "displayConds";

	const dslDomRelateConfig = {
	  getIdFromEl: (el) => el?.dataset?.tmagicId,
	  getElById: (doc, id) => doc?.querySelector(`[data-tmagic-id="${id}"]`),
	  setIdToEl: (el, id) => {
	    el.dataset.tmagicId = `${id}`;
	  }
	};
	const getElById = () => dslDomRelateConfig.getElById;
	const isObject = (obj) => Object.prototype.toString.call(obj) === "[object Object]";
	const getKeysArray = (keys) => (
	  // 将 array[0] 转成 array.0
	  `${keys}`.replaceAll(/\[(\d+)\]/g, ".$1").split(".")
	);
	const getValueByKeyPath = (keys = "", data = {}) => {
	  const keyArray = Array.isArray(keys) ? keys : getKeysArray(keys);
	  return keyArray.reduce((accumulator, currentValue) => {
	    if (isObject(accumulator)) {
	      return accumulator[currentValue];
	    }
	    if (Array.isArray(accumulator) && /^\d*$/.test(`${currentValue}`)) {
	      return accumulator[currentValue];
	    }
	    throw new Error(`${data}中不存在${keys}`);
	  }, data);
	};
	const setValueByKeyPath = (keys, value, data = {}) => set(data, keys, value);
	const getDepKeys = (dataSourceDeps = {}, nodeId) => Array.from(
	  Object.values(dataSourceDeps).reduce((prev, cur) => {
	    (cur[nodeId]?.keys || []).forEach((key) => prev.add(key));
	    return prev;
	  }, /* @__PURE__ */ new Set())
	);
	const DSL_NODE_KEY_COPY_PREFIX = "__tmagic__";
	const compiledNode = (compile, node, dataSourceDeps = {}, sourceId) => {
	  let keys = [];
	  if (!sourceId) {
	    keys = getDepKeys(dataSourceDeps, node.id);
	  } else {
	    const dep = dataSourceDeps[sourceId];
	    keys = dep?.[node.id].keys || [];
	  }
	  keys.forEach((key) => {
	    const keys2 = getKeysArray(key);
	    const cacheKey = keys2.map((key2, index) => {
	      if (index < keys2.length - 1) {
	        return key2;
	      }
	      return `${DSL_NODE_KEY_COPY_PREFIX}${key2}`;
	    });
	    let templateValue = getValueByKeyPath(cacheKey, node);
	    if (typeof templateValue === "undefined") {
	      try {
	        const value = getValueByKeyPath(key, node);
	        setValueByKeyPath(cacheKey.join("."), value, node);
	        templateValue = value;
	      } catch (e) {
	        console.warn(e);
	        return;
	      }
	    }
	    let newValue;
	    try {
	      newValue = compile(templateValue);
	    } catch (e) {
	      console.error(e);
	      newValue = "";
	    }
	    setValueByKeyPath(key, newValue, node);
	  });
	  return node;
	};
	const compiledCond = (op, fieldValue, inputValue, range = []) => {
	  if (typeof fieldValue === "string" && typeof inputValue === "undefined") {
	    inputValue = "";
	  }
	  switch (op) {
	    case "is":
	      return fieldValue === inputValue;
	    case "not":
	      return fieldValue !== inputValue;
	    case "=":
	      return fieldValue === inputValue;
	    case "!=":
	      return fieldValue !== inputValue;
	    case ">":
	      return fieldValue > inputValue;
	    case ">=":
	      return fieldValue >= inputValue;
	    case "<":
	      return fieldValue < inputValue;
	    case "<=":
	      return fieldValue <= inputValue;
	    case "between":
	      return range.length > 1 && fieldValue >= range[0] && fieldValue <= range[1];
	    case "not_between":
	      return range.length < 2 || fieldValue < range[0] || fieldValue > range[1];
	    case "include":
	      return fieldValue?.includes?.(inputValue);
	    case "not_include":
	      return typeof fieldValue === "undefined" || !fieldValue.includes?.(inputValue);
	  }
	  return false;
	};
	const getDefaultValueFromFields = (fields) => {
	  const data = {};
	  const defaultValue = {
	    string: void 0,
	    object: {},
	    array: [],
	    boolean: void 0,
	    number: void 0,
	    null: null,
	    any: void 0
	  };
	  fields.forEach((field) => {
	    if (typeof field.defaultValue !== "undefined") {
	      if (field.type === "array" && !Array.isArray(field.defaultValue)) {
	        data[field.name] = defaultValue.array;
	        return;
	      }
	      if (field.type === "object" && !isObject(field.defaultValue)) {
	        if (typeof field.defaultValue === "string") {
	          try {
	            data[field.name] = JSON.parse(field.defaultValue);
	          } catch (e) {
	            data[field.name] = defaultValue.object;
	          }
	          return;
	        }
	        data[field.name] = defaultValue.object;
	        return;
	      }
	      data[field.name] = cloneDeep$1(field.defaultValue);
	      return;
	    }
	    if (field.type === "object") {
	      data[field.name] = field.fields ? getDefaultValueFromFields(field.fields) : defaultValue.object;
	      return;
	    }
	    if (field.type) {
	      data[field.name] = defaultValue[field.type];
	      return;
	    }
	    data[field.name] = void 0;
	  });
	  return data;
	};
	const DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX = "ds-field::";
	const dataSourceTemplateRegExp = /\$\{([\s\S]+?)\}/g;
	const traverseNode = (node, cb, parents = []) => {
	  cb(node, parents);
	  if (Array.isArray(node.items) && node.items.length) {
	    parents.push(node);
	    node.items.forEach((item) => {
	      traverseNode(item, cb, [...parents]);
	    });
	  }
	};

	var DepTargetType = /* @__PURE__ */ ((DepTargetType2) => {
	  DepTargetType2["DEFAULT"] = "default";
	  DepTargetType2["CODE_BLOCK"] = "code-block";
	  DepTargetType2["DATA_SOURCE"] = "data-source";
	  DepTargetType2["DATA_SOURCE_METHOD"] = "data-source-method";
	  DepTargetType2["DATA_SOURCE_COND"] = "data-source-cond";
	  return DepTargetType2;
	})(DepTargetType || {});

	class Target {
	  /**
	   * 如何识别目标
	   */
	  isTarget;
	  /**
	   * 目标id，不可重复
	   * 例如目标是代码块，则为代码块id
	   */
	  id;
	  /**
	   * 目标名称，用于显示在依赖列表中
	   */
	  name;
	  /**
	   * 不同的目标可以进行分类，例如代码块，数据源可以为两个不同的type
	   */
	  type = DepTargetType.DEFAULT;
	  /**
	   * 依赖详情
	   * 实例：{ 'node_id': { name: 'node_name', keys: [ created, mounted ] } }
	   */
	  deps = {};
	  /**
	   * 是否默认收集，默认为true，当值为false时需要传入type参数给collect方法才会被收集
	   */
	  isCollectByDefault;
	  constructor(options) {
	    this.isTarget = options.isTarget;
	    this.id = options.id;
	    this.name = options.name;
	    this.isCollectByDefault = options.isCollectByDefault ?? true;
	    if (options.type) {
	      this.type = options.type;
	    }
	    if (options.initialDeps) {
	      this.deps = options.initialDeps;
	    }
	  }
	  /**
	   * 更新依赖
	   * @param option 节点配置
	   * @param key 哪个key配置了这个目标的id
	   */
	  updateDep({ id, name, key, data }) {
	    const dep = this.deps[id] || {
	      name,
	      keys: []
	    };
	    dep.name = name;
	    dep.data = data;
	    this.deps[id] = dep;
	    if (dep.keys.indexOf(key) === -1) {
	      dep.keys.push(key);
	    }
	  }
	  /**
	   * 删除依赖
	   * @param node 哪个节点的依赖需要移除，如果为空，则移除所有依赖
	   * @param key 节点下哪个key需要移除，如果为空，则移除改节点下的所有依赖key
	   * @returns void
	   */
	  removeDep(id, key) {
	    if (typeof id === "undefined") {
	      Object.keys(this.deps).forEach((depKey) => {
	        delete this.deps[depKey];
	      });
	      return;
	    }
	    const dep = this.deps[id];
	    if (!dep) return;
	    if (key) {
	      const index = dep.keys.indexOf(key);
	      dep.keys.splice(index, 1);
	      if (dep.keys.length === 0) {
	        delete this.deps[id];
	      }
	    } else {
	      delete this.deps[id];
	    }
	  }
	  /**
	   * 判断指定节点下的指定key是否存在在依赖列表中
	   * @param node 哪个节点
	   * @param key 哪个key
	   * @returns boolean
	   */
	  hasDep(id, key) {
	    const dep = this.deps[id];
	    return Boolean(dep?.keys.find((d) => d === key));
	  }
	  destroy() {
	    this.deps = {};
	  }
	}
	const isIncludeArrayField = (keys, fields) => {
	  let f = fields;
	  return keys.some((key, index) => {
	    const field = f.find(({ name }) => name === key);
	    f = field?.fields || [];
	    return field && field.type === "array" && // 不是整数
	    /^(?!\d+$).*$/.test(`${keys[index + 1]}`) && index < keys.length - 1;
	  });
	};
	const isDataSourceTemplate = (value, ds, hasArray = false) => {
	  const templates = value.match(dataSourceTemplateRegExp) || [];
	  if (templates.length <= 0) {
	    return false;
	  }
	  const arrayFieldTemplates = [];
	  const fieldTemplates = [];
	  templates.forEach((tpl) => {
	    const expression = tpl.substring(2, tpl.length - 1);
	    const keys = getKeysArray(expression);
	    const dsId = keys.shift();
	    if (!dsId || dsId !== ds.id) {
	      return;
	    }
	    if (isIncludeArrayField(keys, ds.fields)) {
	      arrayFieldTemplates.push(tpl);
	    } else {
	      fieldTemplates.push(tpl);
	    }
	  });
	  if (hasArray) {
	    return arrayFieldTemplates.length > 0;
	  }
	  return fieldTemplates.length > 0;
	};
	const isSpecificDataSourceTemplate = (value, dsId) => value?.isBindDataSourceField && value.dataSourceId && value.dataSourceId === dsId && typeof value.template === "string";
	const isUseDataSourceField = (value, id) => {
	  if (!Array.isArray(value) || typeof value[0] !== "string") {
	    return false;
	  }
	  const [prefixId] = value;
	  const prefixIndex = prefixId.indexOf(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX);
	  if (prefixIndex === -1) {
	    return false;
	  }
	  const dsId = prefixId.substring(prefixIndex + DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX.length);
	  return dsId === id;
	};
	const isDataSourceTarget = (ds, key, value, hasArray = false) => {
	  if (`${key}`.startsWith(C)) {
	    return false;
	  }
	  if (typeof value === "string") {
	    return isDataSourceTemplate(value, ds, hasArray);
	  }
	  if (isObject(value) && value?.isBindDataSource && value.dataSourceId && value.dataSourceId === ds.id) {
	    return true;
	  }
	  if (isSpecificDataSourceTemplate(value, ds.id)) {
	    return true;
	  }
	  if (isUseDataSourceField(value, ds.id)) {
	    const [, ...keys] = value;
	    const includeArray = isIncludeArrayField(keys, ds.fields);
	    if (hasArray) {
	      return includeArray;
	    }
	    return !includeArray;
	  }
	  return false;
	};
	const isDataSourceCondTarget = (ds, key, value, hasArray = false) => {
	  if (!Array.isArray(value) || !ds) {
	    return false;
	  }
	  const [dsId, ...keys] = value;
	  if (dsId !== ds.id || !`${key}`.startsWith(C)) {
	    return false;
	  }
	  if (ds.fields?.find((field) => field.name === keys[0])) {
	    const includeArray = isIncludeArrayField(keys, ds.fields);
	    if (hasArray) {
	      return includeArray;
	    }
	    return !includeArray;
	  }
	  return false;
	};
	const traverseTarget = (targetsList, cb, type) => {
	  Object.values(targetsList).forEach((targets) => {
	    Object.values(targets).forEach((target) => {
	      if (type && target.type !== type) {
	        return;
	      }
	      cb(target);
	    });
	  });
	};

	class Watcher {
	  targetsList = {};
	  childrenProp = "items";
	  idProp = "id";
	  nameProp = "name";
	  constructor(options) {
	    if (options?.initialTargets) {
	      this.targetsList = options.initialTargets;
	    }
	    if (options?.childrenProp) {
	      this.childrenProp = options.childrenProp;
	    }
	  }
	  getTargetsList() {
	    return this.targetsList;
	  }
	  /**
	   * 获取指定类型中的所有target
	   * @param type 分类
	   * @returns Target[]
	   */
	  getTargets(type = DepTargetType.DEFAULT) {
	    return this.targetsList[type] || {};
	  }
	  /**
	   * 添加新的目标
	   * @param target Target
	   */
	  addTarget(target) {
	    const targets = this.getTargets(target.type) || {};
	    this.targetsList[target.type] = targets;
	    targets[target.id] = target;
	  }
	  /**
	   * 获取指定id的target
	   * @param id target id
	   * @returns Target
	   */
	  getTarget(id, type = DepTargetType.DEFAULT) {
	    return this.getTargets(type)[id];
	  }
	  /**
	   * 判断是否存在指定id的target
	   * @param id target id
	   * @returns boolean
	   */
	  hasTarget(id, type = DepTargetType.DEFAULT) {
	    return Boolean(this.getTarget(id, type));
	  }
	  /**
	   * 判断是否存在指定类型的target
	   * @param type target type
	   * @returns boolean
	   */
	  hasSpecifiedTypeTarget(type = DepTargetType.DEFAULT) {
	    return Object.keys(this.getTargets(type)).length > 0;
	  }
	  /**
	   * 删除指定id的target
	   * @param id target id
	   */
	  removeTarget(id, type = DepTargetType.DEFAULT) {
	    const targets = this.getTargets(type);
	    if (targets[id]) {
	      targets[id].destroy();
	      delete targets[id];
	    }
	  }
	  /**
	   * 删除指定分类的所有target
	   * @param type 分类
	   * @returns void
	   */
	  removeTargets(type = DepTargetType.DEFAULT) {
	    const targets = this.targetsList[type];
	    if (!targets) return;
	    for (const target of Object.values(targets)) {
	      target.destroy();
	    }
	    delete this.targetsList[type];
	  }
	  /**
	   * 删除所有target
	   */
	  clearTargets() {
	    Object.keys(this.targetsList).forEach((key) => {
	      delete this.targetsList[key];
	    });
	  }
	  /**
	   * 收集依赖
	   * @param nodes 需要收集的节点
	   * @param deep 是否需要收集子节点
	   * @param type 强制收集指定类型的依赖
	   */
	  collect(nodes, depExtendedData = {}, deep = false, type) {
	    this.collectByCallback(nodes, type, ({ node, target }) => {
	      this.removeTargetDep(target, node);
	      this.collectItem(node, target, depExtendedData, deep);
	    });
	  }
	  collectByCallback(nodes, type, cb) {
	    traverseTarget(
	      this.targetsList,
	      (target) => {
	        if (!type && !target.isCollectByDefault) {
	          return;
	        }
	        nodes.forEach((node) => {
	          cb({ node, target });
	        });
	      },
	      type
	    );
	  }
	  /**
	   * 清除所有目标的依赖
	   * @param nodes 需要清除依赖的节点
	   */
	  clear(nodes, type) {
	    let { targetsList } = this;
	    if (type) {
	      targetsList = {
	        [type]: this.getTargets(type)
	      };
	    }
	    const clearedItemsNodeIds = [];
	    traverseTarget(targetsList, (target) => {
	      if (nodes) {
	        nodes.forEach((node) => {
	          target.removeDep(node[this.idProp]);
	          if (Array.isArray(node[this.childrenProp]) && node[this.childrenProp].length && !clearedItemsNodeIds.includes(node[this.idProp])) {
	            clearedItemsNodeIds.push(node[this.idProp]);
	            this.clear(node[this.childrenProp]);
	          }
	        });
	      } else {
	        target.removeDep();
	      }
	    });
	  }
	  /**
	   * 清除指定类型的依赖
	   * @param type 类型
	   * @param nodes 需要清除依赖的节点
	   */
	  clearByType(type, nodes) {
	    this.clear(nodes, type);
	  }
	  collectItem(node, target, depExtendedData = {}, deep = false) {
	    const collectTarget = (config, prop = "") => {
	      const doCollect = (key, value) => {
	        const keyIsItems = key === this.childrenProp;
	        const fullKey = prop ? `${prop}.${key}` : key;
	        if (target.isTarget(fullKey, value)) {
	          target.updateDep({
	            id: node[this.idProp],
	            name: `${node[this.nameProp] || node[this.idProp]}`,
	            data: depExtendedData,
	            key: fullKey
	          });
	        } else if (!keyIsItems && Array.isArray(value)) {
	          value.forEach((item, index) => {
	            if (isObject(item)) {
	              collectTarget(item, `${fullKey}[${index}]`);
	            }
	          });
	        } else if (isObject(value)) {
	          collectTarget(value, fullKey);
	        }
	        if (keyIsItems && deep && Array.isArray(value)) {
	          value.forEach((child) => {
	            this.collectItem(child, target, depExtendedData, deep);
	          });
	        }
	      };
	      Object.entries(config).forEach(([key, value]) => {
	        if (typeof value === "undefined" || value === "") return;
	        doCollect(key, value);
	      });
	    };
	    collectTarget(node);
	  }
	  removeTargetDep(target, node, key) {
	    target.removeDep(node[this.idProp], key);
	    if (typeof key === "undefined" && Array.isArray(node[this.childrenProp]) && node[this.childrenProp].length) {
	      node[this.childrenProp].forEach((item) => {
	        this.removeTargetDep(target, item, key);
	      });
	    }
	  }
	}

	const page = [
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
	    onChange: (formState, v, { model }) => {
	      if (!model.style) return v;
	      if (v === "relative") {
	        model.style.height = "auto";
	      } else {
	        const el = getElById()(formState.stage?.renderer?.contentWindow.document, model.id);
	        if (el) {
	          model.style.height = el.getBoundingClientRect().height;
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
	];

	const container = [
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
	    onChange: (formState, v, { model }) => {
	      if (!model.style) return v;
	      if (v === "relative") {
	        model.style.height = "auto";
	      } else {
	        const el = getElById()(formState.stage?.renderer?.contentWindow.document, model.id);
	        if (el) {
	          model.style.height = el.getBoundingClientRect().height;
	        }
	      }
	    }
	  }
	];

	const button = [
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
	];

	const text = [
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
	];

	const img = [
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
	];

	const qrcode = [
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
	];

	const overlay = [];

	const pageFragmentContainer = [
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
	];

	const pageFragment = [
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
	    onChange: (formState, v, { model }) => {
	      if (!model.style) return v;
	      if (v === "relative") {
	        model.style.height = "auto";
	      } else {
	        const el = getElById()(formState.stage?.renderer?.contentWindow.document, model.id);
	        if (el) {
	          model.style.height = el.getBoundingClientRect().height;
	        }
	      }
	    }
	  }
	];

	const iteratorContainer = [
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
	    onChange: (_vm, v = [], { model }) => {
	      if (Array.isArray(v) && v.length > 1) {
	        const [dsId, ...keys] = v;
	        model.dsField = [dsId.replace(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX, ""), ...keys];
	      } else {
	        model.dsField = [];
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
	        name: C,
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
	];

	const configs = {
	  "page": page,
	  "container": container,
	  "button": button,
	  "text": text,
	  "img": img,
	  "qrcode": qrcode,
	  "overlay": overlay,
	  "page-fragment-container": pageFragmentContainer,
	  "page-fragment": pageFragment,
	  "iterator-container": iteratorContainer
	};

	return configs;

}));
//# sourceMappingURL=index.umd.cjs.map

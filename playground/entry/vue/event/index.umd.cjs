(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define([], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.magicPresetEvents = factory());
})(this, function() {
	//#region ../../node_modules/.pnpm/@tmagic+core@1.7.10_typescript@6.0.2/node_modules/@tmagic/core/dist/es/utils.js
	var COMMON_EVENT_PREFIX = "magic:common:events:";
	//#endregion
	return {
		"button": {
			methods: [],
			events: [{
				label: "点击",
				value: `${COMMON_EVENT_PREFIX}click`
			}]
		},
		"container": {
			methods: [],
			events: [{
				label: "点击",
				value: `${COMMON_EVENT_PREFIX}click`
			}]
		},
		"img": {
			methods: [],
			events: []
		},
		"iterator-container": {
			methods: [],
			events: [{
				label: "点击",
				value: `${COMMON_EVENT_PREFIX}click`
			}]
		},
		"overlay": {
			methods: [{
				label: "打开蒙层",
				value: "openOverlay"
			}, {
				label: "关闭蒙层",
				value: "closeOverlay"
			}],
			events: [{
				label: "打开蒙层",
				value: "overlay:open"
			}, {
				label: "关闭蒙层",
				value: "overlay:close"
			}]
		},
		"page": { methods: [{
			label: "刷新页面",
			value: "refresh"
		}] },
		"page-fragment": {
			methods: [],
			events: []
		},
		"page-fragment-container": {
			methods: [],
			events: []
		},
		"qrcode": {
			methods: [],
			events: [{
				label: "点击",
				value: `${COMMON_EVENT_PREFIX}click`
			}]
		},
		"text": {
			methods: [],
			events: [{
				label: "点击",
				value: `${COMMON_EVENT_PREFIX}click`
			}]
		}
	};
});

//# sourceMappingURL=index.umd.cjs.map
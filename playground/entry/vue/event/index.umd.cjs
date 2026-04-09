(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define([], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.magicPresetEvents = factory());
})(this, function() {
	//#region ../../node_modules/.pnpm/@tmagic+core@1.7.9_typescript@6.0.2/node_modules/@tmagic/core/dist/es/utils.js
	var COMMON_EVENT_PREFIX = "magic:common:events:";
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-button@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-help@_193e8aefdf69dc7232773072c3ba31ba/node_modules/@tmagic/vue-button/src/event.ts
	var event_default$9 = {
		methods: [],
		events: [{
			label: "点击",
			value: `${COMMON_EVENT_PREFIX}click`
		}]
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-container@2.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-he_1e8d3612a3cf05bddd803a561fccb47f/node_modules/@tmagic/vue-container/src/event.ts
	var event_default$8 = {
		methods: [],
		events: [{
			label: "点击",
			value: `${COMMON_EVENT_PREFIX}click`
		}]
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-img@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-help@2.0_9670a89f29ce3b6acc8bc3caec0be4fe/node_modules/@tmagic/vue-img/src/event.ts
	var event_default$7 = {
		methods: [],
		events: []
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-iterator-container@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-r_2c8e5695ecc64426f9192a9c7ab46f94/node_modules/@tmagic/vue-iterator-container/src/event.ts
	var event_default$6 = {
		methods: [],
		events: [{
			label: "点击",
			value: `${COMMON_EVENT_PREFIX}click`
		}]
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-overlay@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-help_1f4fb20c6376d23c7084f11846d62b17/node_modules/@tmagic/vue-overlay/src/event.ts
	var event_default$5 = {
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
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-page@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-help@2._1851837d9ae6ff6334f6c229676c9433/node_modules/@tmagic/vue-page/src/event.ts
	var event_default$4 = { methods: [{
		label: "刷新页面",
		value: "refresh"
	}] };
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-page-fragment@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtim_fd8d318b08442f43f45d6e7623492afd/node_modules/@tmagic/vue-page-fragment/src/event.ts
	var event_default$3 = {
		methods: [],
		events: []
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-page-fragment-container@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+_42cbbbcad112162d684ff6476df5272f/node_modules/@tmagic/vue-page-fragment-container/src/event.ts
	var event_default$2 = {
		methods: [],
		events: []
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-qrcode@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-help@_951f42d9581927be7d8bf75d0352533e/node_modules/@tmagic/vue-qrcode/src/event.ts
	var event_default$1 = {
		methods: [],
		events: [{
			label: "点击",
			value: `${COMMON_EVENT_PREFIX}click`
		}]
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-text@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-help@2._4cea0321949a69f56a4a03797d523a21/node_modules/@tmagic/vue-text/src/event.ts
	var event_default = {
		methods: [],
		events: [{
			label: "点击",
			value: `${COMMON_EVENT_PREFIX}click`
		}]
	};
	//#endregion
	return {
		"button": event_default$9,
		"container": event_default$8,
		"img": event_default$7,
		"iterator-container": event_default$6,
		"overlay": event_default$5,
		"page": event_default$4,
		"page-fragment": event_default$3,
		"page-fragment-container": event_default$2,
		"qrcode": event_default$1,
		"text": event_default
	};
});

//# sourceMappingURL=index.umd.cjs.map
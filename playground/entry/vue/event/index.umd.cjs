(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define([], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.magicPresetEvents = factory());
})(this, function() {
	//#region ../../node_modules/.pnpm/@tmagic+core@1.7.9_typescript@5.9.3/node_modules/@tmagic/core/dist/es/utils.js
	var COMMON_EVENT_PREFIX = "magic:common:events:";
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-button@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-help@_a8bb8634c3e85a9b0f1399ed8e6b54c3/node_modules/@tmagic/vue-button/src/event.ts
	var event_default$9 = {
		methods: [],
		events: [{
			label: "点击",
			value: `${COMMON_EVENT_PREFIX}click`
		}]
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-container@2.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-he_6d2cd864d4eadb33a0b7c401a1ffad08/node_modules/@tmagic/vue-container/src/event.ts
	var event_default$8 = {
		methods: [],
		events: [{
			label: "点击",
			value: `${COMMON_EVENT_PREFIX}click`
		}]
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-img@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-help@2.0_2bf3da347b8baafc0aa7b6a8364c2a4b/node_modules/@tmagic/vue-img/src/event.ts
	var event_default$7 = {
		methods: [],
		events: []
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-iterator-container@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-r_23f3eb5318f8aab0279239040dec70f2/node_modules/@tmagic/vue-iterator-container/src/event.ts
	var event_default$6 = {
		methods: [],
		events: [{
			label: "点击",
			value: `${COMMON_EVENT_PREFIX}click`
		}]
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-overlay@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-help_533cc96542eba220c95e08fb6689a45e/node_modules/@tmagic/vue-overlay/src/event.ts
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
	//#region ../../node_modules/.pnpm/@tmagic+vue-page@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-help@2._1ab91835190e75860e49664d1ea13de4/node_modules/@tmagic/vue-page/src/event.ts
	var event_default$4 = { methods: [{
		label: "刷新页面",
		value: "refresh"
	}] };
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-page-fragment@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtim_8a2a67861a6d9f575beaf349c5faa398/node_modules/@tmagic/vue-page-fragment/src/event.ts
	var event_default$3 = {
		methods: [],
		events: []
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-page-fragment-container@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+_f34b50aedf81744975c8086dc4786e42/node_modules/@tmagic/vue-page-fragment-container/src/event.ts
	var event_default$2 = {
		methods: [],
		events: []
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-qrcode@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-help@_47714413f4d6dcc6616f0d88d2b8035a/node_modules/@tmagic/vue-qrcode/src/event.ts
	var event_default$1 = {
		methods: [],
		events: [{
			label: "点击",
			value: `${COMMON_EVENT_PREFIX}click`
		}]
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-text@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-help@2._b5d8a983d271a6bbbc444be8a2dffd22/node_modules/@tmagic/vue-text/src/event.ts
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
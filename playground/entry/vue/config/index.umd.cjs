(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define([], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.magicPresetConfigs = factory());
})(this, function() {
	//#region ../../node_modules/.pnpm/@tmagic+form-schema@1.7.9_typescript@5.9.3/node_modules/@tmagic/form-schema/dist/es/index.js
	var defineFormConfig = (config) => config;
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-button@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-help@_a8bb8634c3e85a9b0f1399ed8e6b54c3/node_modules/@tmagic/vue-button/src/formConfig.ts
	var formConfig_default$9 = defineFormConfig([{
		name: "className",
		type: "data-source-input",
		text: "class"
	}, {
		text: "文本",
		name: "text",
		type: "data-source-input"
	}]);
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+schema@1.7.9_typescript@5.9.3/node_modules/@tmagic/schema/dist/es/index.js
	var NODE_CONDS_KEY = "displayConds";
	(() => {
		const documentMap = /* @__PURE__ */ new Map();
		return (url, crossOrigin, document = globalThis.document) => {
			let loaded = documentMap.get(document);
			if (!loaded) {
				loaded = /* @__PURE__ */ new Map();
				documentMap.set(document, loaded);
			}
			if (loaded.get(url)) return loaded.get(url);
			const load = new Promise((resolve, reject) => {
				const script = document.createElement("script");
				script.type = "text/javascript";
				if (crossOrigin) script.crossOrigin = crossOrigin;
				script.src = url;
				document.body.appendChild(script);
				script.onload = () => {
					resolve();
				};
				script.onerror = () => {
					reject(/* @__PURE__ */ new Error("加载失败"));
				};
				setTimeout(() => {
					reject(/* @__PURE__ */ new Error("timeout"));
				}, 60 * 1e3);
			}).catch((err) => {
				loaded.delete(url);
				throw err;
			});
			loaded.set(url, load);
			return loaded.get(url);
		};
	})();
	(() => {
		const documentMap = /* @__PURE__ */ new Map();
		return (url, document = globalThis.document) => {
			let loaded = documentMap.get(document);
			if (!loaded) {
				loaded = /* @__PURE__ */ new Map();
				documentMap.set(document, loaded);
			}
			if (loaded.get(url)) return loaded.get(url);
			const load = new Promise((resolve, reject) => {
				const node = document.createElement("link");
				node.rel = "stylesheet";
				node.href = url;
				document.head.appendChild(node);
				node.onload = () => {
					resolve();
				};
				node.onerror = () => {
					reject(/* @__PURE__ */ new Error("加载失败"));
				};
				setTimeout(() => {
					reject(/* @__PURE__ */ new Error("timeout"));
				}, 60 * 1e3);
			}).catch((err) => {
				loaded.delete(url);
				throw err;
			});
			loaded.set(url, load);
			return loaded.get(url);
		};
	})();
	var dslDomRelateConfig = {
		getIdFromEl: (el) => el?.dataset?.tmagicId,
		getElById: (doc, id) => doc?.querySelector(`[data-tmagic-id="${id}"]`),
		setIdToEl: (el, id) => {
			el.dataset.tmagicId = `${id}`;
		}
	};
	var getElById = () => dslDomRelateConfig.getElById;
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+utils@1.7.9_@tmagic+schema@1.7.9_typescript@5.9.3__typescript@5.9.3/node_modules/@tmagic/utils/dist/es/index.js
	var DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX = "ds-field::";
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-container@2.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-he_6d2cd864d4eadb33a0b7c401a1ffad08/node_modules/@tmagic/vue-container/src/formConfig.ts
	var formConfig_default$8 = defineFormConfig([{
		name: "className",
		type: "data-source-input",
		text: "class"
	}, {
		name: "layout",
		text: "容器布局",
		type: "select",
		defaultValue: "absolute",
		options: [{
			value: "absolute",
			text: "绝对定位"
		}, {
			value: "relative",
			text: "流式布局"
		}],
		onChange: (formState, v, { model, setModel }) => {
			if (!model.style) return v;
			if (v === "relative") setModel("style.height", "auto");
			else {
				const el = getElById()(formState.stage?.renderer?.contentWindow.document, model.id);
				if (el) setModel("style.height", el.getBoundingClientRect().height);
			}
		}
	}]);
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-img@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-help@2.0_2bf3da347b8baafc0aa7b6a8364c2a4b/node_modules/@tmagic/vue-img/src/formConfig.ts
	var formConfig_default$7 = defineFormConfig([
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
			fieldConfig: { type: "img-upload" }
		},
		{
			text: "链接",
			name: "url",
			type: "data-source-input"
		}
	]);
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-iterator-container@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-r_23f3eb5318f8aab0279239040dec70f2/node_modules/@tmagic/vue-iterator-container/src/formConfig.ts
	var formConfig_default$6 = defineFormConfig([
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
				} else setModel("dsField", []);
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
					options: [{
						value: "absolute",
						text: "绝对定位"
					}, {
						value: "relative",
						text: "流式布局",
						disabled: true
					}]
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
								{
									text: "visible",
									value: "visible"
								},
								{
									text: "hidden",
									value: "hidden"
								},
								{
									text: "clip",
									value: "clip"
								},
								{
									text: "scroll",
									value: "scroll"
								},
								{
									text: "auto",
									value: "auto"
								},
								{
									text: "overlay",
									value: "overlay"
								}
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
								{
									text: "repeat",
									value: "repeat"
								},
								{
									text: "repeat-x",
									value: "repeat-x"
								},
								{
									text: "repeat-y",
									value: "repeat-y"
								},
								{
									text: "no-repeat",
									value: "no-repeat"
								},
								{
									text: "inherit",
									value: "inherit"
								}
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
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-overlay@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-help_533cc96542eba220c95e08fb6689a45e/node_modules/@tmagic/vue-overlay/src/formConfig.ts
	var formConfig_default$5 = defineFormConfig([]);
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-page@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-help@2._1ab91835190e75860e49664d1ea13de4/node_modules/@tmagic/vue-page/src/formConfig.ts
	var formConfig_default$4 = defineFormConfig([
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
			options: [{
				value: "absolute",
				text: "绝对定位"
			}, {
				value: "relative",
				text: "流式布局"
			}],
			onChange: (formState, v, { model, setModel }) => {
				if (!model.style) return v;
				if (v === "relative") setModel("style.height", "auto");
				else {
					const el = getElById()(formState.stage?.renderer?.contentWindow.document, model.id);
					if (el) setModel("style.height", el.getBoundingClientRect().height);
				}
			}
		},
		{
			name: "jsFiles",
			text: "js",
			type: "table",
			items: [{
				name: "url",
				label: "链接"
			}]
		},
		{
			name: "cssFiles",
			text: "css",
			type: "table",
			items: [{
				name: "url",
				label: "链接"
			}]
		},
		{
			text: "css",
			name: "css",
			type: "vs-code",
			language: "css",
			autosize: {
				minRows: 3,
				maxRows: 20
			}
		}
	]);
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-page-fragment@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtim_8a2a67861a6d9f575beaf349c5faa398/node_modules/@tmagic/vue-page-fragment/src/formConfig.ts
	var formConfig_default$3 = defineFormConfig([
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
			options: [{
				value: "absolute",
				text: "绝对定位"
			}, {
				value: "relative",
				text: "流式布局"
			}],
			onChange: (formState, v, { model, setModel }) => {
				if (!model.style) return v;
				if (v === "relative") setModel("style.height", "auto");
				else {
					const el = getElById()(formState.stage?.renderer?.contentWindow.document, model.id);
					if (el) setModel("style.height", el.getBoundingClientRect().height);
				}
			}
		}
	]);
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-page-fragment-container@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+_f34b50aedf81744975c8086dc4786e42/node_modules/@tmagic/vue-page-fragment-container/src/formConfig.ts
	var formConfig_default$2 = defineFormConfig([{
		name: "className",
		type: "data-source-input",
		text: "class"
	}, {
		name: "pageFragmentId",
		text: "页面片ID",
		type: "page-fragment-select"
	}]);
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-qrcode@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-help@_47714413f4d6dcc6616f0d88d2b8035a/node_modules/@tmagic/vue-qrcode/src/formConfig.ts
	var formConfig_default$1 = defineFormConfig([{
		name: "className",
		type: "data-source-input",
		text: "class"
	}, {
		text: "链接",
		name: "url",
		type: "data-source-input"
	}]);
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-text@1.0.0_@tmagic+core@1.7.9_typescript@5.9.3__@tmagic+vue-runtime-help@2._b5d8a983d271a6bbbc444be8a2dffd22/node_modules/@tmagic/vue-text/src/formConfig.ts
	var formConfig_default = defineFormConfig([
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
	//#endregion
	return {
		"button": formConfig_default$9,
		"container": formConfig_default$8,
		"img": formConfig_default$7,
		"iterator-container": formConfig_default$6,
		"overlay": formConfig_default$5,
		"page": formConfig_default$4,
		"page-fragment": formConfig_default$3,
		"page-fragment-container": formConfig_default$2,
		"qrcode": formConfig_default$1,
		"text": formConfig_default
	};
});

//# sourceMappingURL=index.umd.cjs.map
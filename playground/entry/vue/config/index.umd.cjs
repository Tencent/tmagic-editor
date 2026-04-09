(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define([], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.magicPresetConfigs = factory());
})(this, function() {
	//#region ../../node_modules/.pnpm/@tmagic+form-schema@1.7.9_typescript@6.0.2/node_modules/@tmagic/form-schema/dist/es/index.js
	var defineFormConfig = (config) => config;
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-button@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-help@_193e8aefdf69dc7232773072c3ba31ba/node_modules/@tmagic/vue-button/src/formConfig.ts
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
	//#region ../../node_modules/.pnpm/@tmagic+schema@1.7.9_typescript@6.0.2/node_modules/@tmagic/schema/dist/es/index.js
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
	//#region ../../node_modules/.pnpm/@tmagic+utils@1.7.9_@tmagic+schema@1.7.9_typescript@6.0.2__typescript@6.0.2/node_modules/@tmagic/utils/dist/es/index.js
	var DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX = "ds-field::";
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-container@2.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-he_1e8d3612a3cf05bddd803a561fccb47f/node_modules/@tmagic/vue-container/src/formConfig.ts
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
	//#region ../../node_modules/.pnpm/@tmagic+vue-img@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-help@2.0_9670a89f29ce3b6acc8bc3caec0be4fe/node_modules/@tmagic/vue-img/src/formConfig.ts
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
	//#region ../../node_modules/.pnpm/@tmagic+vue-iterator-container@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-r_2c8e5695ecc64426f9192a9c7ab46f94/node_modules/@tmagic/vue-iterator-container/src/formConfig.ts
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
	//#region ../../node_modules/.pnpm/@tmagic+vue-overlay@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-help_1f4fb20c6376d23c7084f11846d62b17/node_modules/@tmagic/vue-overlay/src/formConfig.ts
	var formConfig_default$5 = defineFormConfig([]);
	//#endregion
	//#region ../../node_modules/.pnpm/@tmagic+vue-page@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-help@2._1851837d9ae6ff6334f6c229676c9433/node_modules/@tmagic/vue-page/src/formConfig.ts
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
	//#region ../../node_modules/.pnpm/@tmagic+vue-page-fragment@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtim_fd8d318b08442f43f45d6e7623492afd/node_modules/@tmagic/vue-page-fragment/src/formConfig.ts
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
	//#region ../../node_modules/.pnpm/@tmagic+vue-page-fragment-container@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+_42cbbbcad112162d684ff6476df5272f/node_modules/@tmagic/vue-page-fragment-container/src/formConfig.ts
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
	//#region ../../node_modules/.pnpm/@tmagic+vue-qrcode@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-help@_951f42d9581927be7d8bf75d0352533e/node_modules/@tmagic/vue-qrcode/src/formConfig.ts
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
	//#region ../../node_modules/.pnpm/@tmagic+vue-text@1.0.0_@tmagic+core@1.7.9_typescript@6.0.2__@tmagic+vue-runtime-help@2._4cea0321949a69f56a4a03797d523a21/node_modules/@tmagic/vue-text/src/formConfig.ts
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
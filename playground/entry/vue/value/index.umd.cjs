(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define([], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.magicPresetValues = factory());
})(this, function() {
	//#endregion
	return {
		"button": {
			text: "请输入文本内容",
			multiple: true,
			style: {
				width: "270",
				height: "37.5",
				border: 0,
				backgroundColor: "#fb6f00"
			}
		},
		"container": {
			items: [],
			style: {
				width: "375",
				height: "100"
			}
		},
		"img": {
			src: "https://puui.qpic.cn/vupload/0/1573555382625_bhp0wud8l6w.png/0",
			url: "",
			style: {
				position: "absolute",
				left: "57",
				width: "176",
				height: "176"
			}
		},
		"iterator-container": {
			style: {
				width: "375",
				height: "100"
			},
			itemConfig: { style: {
				width: "100%",
				height: "100%"
			} },
			items: []
		},
		"overlay": {
			style: {
				position: "fixed",
				width: "100%",
				height: "100%",
				top: 0,
				left: 0,
				backgroundColor: "rgba(0, 0, 0, 0.8)",
				zIndex: 100
			},
			items: []
		},
		"page": {
			items: [],
			style: {
				width: "100%",
				height: "100%"
			}
		},
		"page-fragment": {
			items: [],
			style: {
				width: "375",
				height: "817"
			}
		},
		"page-fragment-container": { style: {
			width: "",
			height: ""
		} },
		"qrcode": {
			url: "https://m.film.qq.com",
			style: {
				position: "absolute",
				left: "57",
				width: "176",
				height: "176"
			}
		},
		"text": {
			type: "text",
			text: "请输入文本内容",
			multiple: true,
			style: {
				width: "100",
				height: "auto"
			}
		}
	};
});

//# sourceMappingURL=index.umd.cjs.map
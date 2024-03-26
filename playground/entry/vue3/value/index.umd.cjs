(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.magicPresetValues = factory());
})(this, (function () { 'use strict';

  const page = {
    items: [],
    style: {
      width: "100%",
      height: "100%"
    }
  };

  const container = {
    items: [],
    style: {
      width: "375",
      height: "100"
    }
  };

  const button = {
    text: "请输入文本内容",
    multiple: true,
    style: {
      width: "270",
      height: "37.5",
      border: 0,
      backgroundColor: "#fb6f00"
    }
  };

  const text = {
    type: "text",
    text: "请输入文本内容",
    multiple: true,
    style: {
      width: "100",
      height: "auto"
    }
  };

  const img = {
    src: "https://puui.qpic.cn/vupload/0/1573555382625_bhp0wud8l6w.png/0",
    url: "",
    style: {
      position: "absolute",
      left: "57",
      width: "176",
      height: "176"
    }
  };

  const qrcode = {
    url: "https://m.film.qq.com",
    style: {
      position: "absolute",
      left: "57",
      width: "176",
      height: "176"
    }
  };

  const overlay = {
    style: {
      position: "fixed",
      width: "100%",
      height: "100%",
      top: 0,
      left: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)"
    },
    items: []
  };

  const pageFragmentContainer = {
    style: {
      width: "",
      height: ""
    }
  };

  const pageFragment = {
    items: [],
    style: {
      width: "375",
      height: "817"
    }
  };

  const iteratorContainer = {
    style: {
      width: "375",
      height: "100"
    },
    itemConfig: {
      style: {
        width: "100%",
        height: "100%"
      }
    },
    items: []
  };

  const values = {
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

  return values;

}));
//# sourceMappingURL=index.umd.cjs.map

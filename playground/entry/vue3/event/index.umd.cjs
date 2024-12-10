(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.magicPresetEvents = factory());
})(this, (function () { 'use strict';

  const page = {
    methods: [
      {
        label: "刷新页面",
        value: "refresh"
      }
    ]
  };

  const container = {
    methods: [],
    events: []
  };

  const button = {
    methods: [],
    events: []
  };

  const text = {
    methods: [],
    events: []
  };

  const img = {
    methods: [],
    events: []
  };

  const qrcode = {
    methods: [],
    events: []
  };

  const overlay = {
    methods: [
      {
        label: "打开蒙层",
        value: "openOverlay"
      },
      {
        label: "关闭蒙层",
        value: "closeOverlay"
      }
    ],
    events: [
      {
        label: "打开蒙层",
        value: "overlay:open"
      },
      {
        label: "关闭蒙层",
        value: "overlay:close"
      }
    ]
  };

  const pageFragmentContainer = {
    methods: [],
    events: []
  };

  const pageFragment = {
    methods: [],
    events: []
  };

  const iteratorContainer = {
    methods: [],
    events: []
  };

  const events = {
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

  return events;

}));
//# sourceMappingURL=index.umd.cjs.map

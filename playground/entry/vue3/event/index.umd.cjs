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

  const events = {
    "page": page,
    "overlay": overlay
  };

  return events;

}));
//# sourceMappingURL=index.umd.cjs.map

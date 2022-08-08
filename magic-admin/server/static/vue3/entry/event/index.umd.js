(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.magicPresetEvents = factory());
})(this, (function () { 'use strict';

  const page = {
    methods: [
      {
        label: "\u5237\u65B0\u9875\u9762",
        value: "refresh"
      }
    ]
  };

  const overlay = {
    methods: [
      {
        label: "\u6253\u5F00\u8499\u5C42",
        value: "openOverlay"
      },
      {
        label: "\u5173\u95ED\u8499\u5C42",
        value: "closeOverlay"
      }
    ],
    events: [
      {
        label: "\u6253\u5F00\u8499\u5C42",
        value: "overlay:open"
      },
      {
        label: "\u5173\u95ED\u8499\u5C42",
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
//# sourceMappingURL=index.umd.js.map

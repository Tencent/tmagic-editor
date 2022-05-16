var page = [
  {
    text: "\u9875\u9762\u6807\u8BC6",
    name: "name",
    disabled: true,
    extra: "\u5728\u591A\u9875\u9762\u7684\u60C5\u51B5\u4E0B\u7528\u6765\u6307\u5B9A\u8981\u6253\u5F00\u7684\u9875\u9762"
  },
  {
    text: "\u9875\u9762\u6807\u9898",
    name: "title"
  },
  {
    name: "layout",
    text: "\u5BB9\u5668\u5E03\u5C40",
    type: "select",
    defaultValue: "absolute",
    options: [
      { value: "absolute", text: "\u7EDD\u5BF9\u5B9A\u4F4D" },
      { value: "relative", text: "\u6D41\u5F0F\u5E03\u5C40" }
    ]
  }
];
var container = [
  {
    name: "layout",
    text: "\u5BB9\u5668\u5E03\u5C40",
    type: "select",
    defaultValue: "absolute",
    options: [
      { value: "absolute", text: "\u7EDD\u5BF9\u5B9A\u4F4D" },
      { value: "relative", text: "\u6D41\u5F0F\u5E03\u5C40" }
    ]
  }
];
var button = [
  {
    text: "\u6587\u672C",
    name: "text"
  }
];
var text = [
  {
    name: "text",
    text: "\u6587\u672C"
  },
  {
    name: "multiple",
    text: "\u591A\u884C\u6587\u672C",
    type: "switch"
  }
];
(function() {
  const configs = {
    "page": page,
    "container": container,
    "button": button,
    "text": text
  };
  window.magicPresetConfigs = configs;
})();
//# sourceMappingURL=config.js.map

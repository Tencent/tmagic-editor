var page = {
  items: [],
  style: {
    width: "100%",
    height: "100%"
  }
};
var container = {
  items: [],
  style: {
    width: "375",
    height: "100"
  }
};
var button = {
  text: "\u8BF7\u8F93\u5165\u6587\u672C\u5185\u5BB9",
  multiple: true,
  style: {
    width: "270",
    height: "37.5",
    border: 0,
    backgroundColor: "#fb6f00"
  }
};
var text = {
  type: "text",
  text: "\u8BF7\u8F93\u5165\u6587\u672C\u5185\u5BB9",
  multiple: true,
  style: {
    width: "100",
    height: "auto"
  }
};
(function() {
  const values = {
    "page": page,
    "container": container,
    "button": button,
    "text": text
  };
  window.magicPresetValues = values;
})();
//# sourceMappingURL=value.js.map

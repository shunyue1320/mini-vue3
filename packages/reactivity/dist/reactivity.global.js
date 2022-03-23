var VueReactivity = (() => {
  // packages/shared/src/index.js
  var isObject = (val) => {
    return val !== null && typeof val === "object";
  };

  // packages/reactivity/src/index.js
  console.log("isObject = ", isObject("23456"));
})();
//# sourceMappingURL=reactivity.global.js.map

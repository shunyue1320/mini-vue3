export function hostCreateElement(type) {
  console.log("hostCreateElement", type);
  const element = document.createElement(type);
  return element;
}

export function hostSetElementText(el, text) {
  console.log("hostSetElementText", el, text);
  el.innerText = text;
}

export function hostPatchProp(el, key, preValue, nextValue) {
  // preValue 之前的值
  // 为了之后 update 做准备的值
  // nextValue 当前的值

  console.log(`hostPatchProp 设置属性:${key} 值:${nextValue}`);
  
  switch (key) {
    case "tId":
      el.setAttribute(key, nextValue);
      break;
  }
}

export function hostInsert(el, container) {
  console.log("hostInsert");
  container.append(el);
}
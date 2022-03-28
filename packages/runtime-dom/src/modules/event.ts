function createInvoker(callback) {
  const invoker = e => invoker.value(e)
  invoker.value = callback
  return invoker
}

// 第一次绑定了onClick事件 "a"    el._vei = {click:onClick}  el.addEventListener(click,(e) => a(e); )
// 第二次绑定了onClick事件 "b"    el._vei = {click:onClick}  el.addEventListener(click,(e) => b(e); )
// 第三次绑定了onClick事件  null  el._vei ={}                el.removeEventListener(click,(e) => b(e); )
export function patchEvent(el, eventName, nextValue) {
  // 事件绑定都缓存到了当前dom上
  // 可以先移除掉事件 在重新绑定事件
  // remove -> add  === > add + 自定义事件 （里面调用绑定的方法）
  let invokers = el._vei || (el._vei = {})
  let exits = invokers[eventName] // 先看有没有缓存过
  // 如果绑定的是一个空
  if (exits && nextValue) {
    // 已经绑定过事件了
    exits.value = nextValue // 没有卸载函数 只是改了invoker.value 属性
  } else {
    // onClick = click
    let event = eventName.slice(2).toLowerCase()
    if (nextValue) {
      const invoker = (invokers[eventName] = createInvoker(nextValue))
      el.addEventListener(event, invoker)
    } else if (exits) {
      // 如果有老值，需移除掉老的绑定事件
      el.removeEventListener(event, exits)
      invokers[eventName] = undefined
    }
  }
}

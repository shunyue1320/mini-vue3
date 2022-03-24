import { isObject } from '@vue/shared'
import { mutableHandlers, ReactiveFlags } from './baseHandlers'

const reactiveMap =  new WeakMap(); // key 只能是对象

export function reactive(target) {
  if (!isObject(target)) {
    return
  }

  // 避免已经代理过的对象的子对象再次代理
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }
  // 避免已经代理的对象再次代理
  let exisitingProxy = reactiveMap.get(target)
  if (exisitingProxy) {
    return exisitingProxy
  }

  const proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, proxy)
  return proxy
}
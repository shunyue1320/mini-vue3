import { isObject } from '@vue/shared'
import { track, trigger } from './effect'
import { reactive } from './reactive'

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandlers: ProxyHandler<object> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    track(target, 'get', key)
    // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/get
    let res = Reflect.get(target, key, receiver)

    // 懒代理，取值在深度代理, 性能好 （obj1.obj2.a 当取值时obj2返回的值是对象，则返回这个对象的代理对象，从而实现深度代理）
    if (isObject(res)) {
      return reactive(res)
    }
    return res
  },
  set(target, key, value, receiver) {
    let oldValue = target[key]
    let result = Reflect.set(target, key, value, receiver)
    // 值变化 触发effect监听
    if (oldValue !== value) {
      trigger(target, 'set', key, value, oldValue)
    }

    return result
  }
  // deleteProperty,
  // has,
  // ownKeys
}

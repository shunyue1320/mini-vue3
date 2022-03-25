import { isFunction, isObject } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { isReactive } from './reactive'

function tranversel(value, set = new Set()) {
  if (!isObject(value)) {
    return value
  }
  if (set.has(value)) {
    return value
  }
  set.add(value)
  for (const key in value) {
    tranversel(value[key], set)
  }
  return value
}

export function watch(source, cb) {
  let getter
  if (isReactive(source)) {
    getter = () => tranversel(source)
  } else if (isFunction(source)) {
    getter = source
  } else {
    return
  }

  let cleanup
  const onCleanup = fn => {
    cleanup = fn
  }

  let oldValue
  const job = () => {
    // 清理上一次watch的
    if (cleanup) cleanup()

    const newValue = effect.run()
    cb(newValue, oldValue, onCleanup)
    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter, job)
  oldValue = effect.run()
}

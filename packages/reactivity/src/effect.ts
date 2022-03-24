export let activeEffect = undefined

function cleanupEffect(effect) {
  const { deps } = effect
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect)
  }
  effect.deps.length = 0
}

export class ReactiveEffect {
  active = true
  deps = []
  parent = undefined
  constructor(public fn, public scheduler) {}
  run() {
    // 这里表示如果是非激活的情况，只需要执行函数，不需要进行依赖收集
    if (!this.active) {
      return this.fn()
    }

    try {
      this.parent = activeEffect
      activeEffect = this
      // 清理上一次的
      cleanupEffect(this)
      // 当稍后调用取值操作的时候 就可以获取到这个全局的activeEffect了
      return this.fn()
    } finally {
      activeEffect = this.parent
    }
  }
  stop() {
    if (this.active) {
      this.active = false
      cleanupEffect(this)
    }
  }
}

// 这里fn可以根据状态变化 重新执行， effect可以嵌套着写
export function effect(fn, options: any = {}) {
  // 创建响应式的effect
  const _effect = new ReactiveEffect(fn, options.scheduler)
  _effect.run()
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
const targetMap = new WeakMap()
// targetMap 是公用的，所有 effect 监听都存这
// targetMap = {
//   {响应式对象}: {
//     响应key: [ 响应触发的effect, ... ]
//   }
// }
export function track(target, type, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    trackEffects(dep)
  }
}

export function trackEffects(dep) {
  if (activeEffect) {
    let shouldTrack = !dep.has(activeEffect)

    if (shouldTrack) {
      dep.add(activeEffect)
      // 双向绑定, 取消监听时删除对应订阅
      activeEffect.deps.push(dep)
    }
  }
}

// set改变响应式数据 触发所以订阅事件
export function trigger(target, type, key, value, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }

  // 触发订阅
  let effects = depsMap.get(key)
  if (effects) {
    triggerEffects(effects)
  }
}

export function triggerEffects(effects) {
  effects = new Set(effects)
  effects.forEach(effect => {
    // 避免在 effect 内调用 set 改变响应式数据时触发回调
    if (effect !== activeEffect) {
      if (effect.scheduler) {
        // 如果用户传入了调度函数，则用用户的
        effect.scheduler()
      } else {
        effect.run()
      }
    }
  })
}

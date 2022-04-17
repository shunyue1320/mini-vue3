// 父effectScope.stop() 停止自己家的effect  执行子effectScope.stop() 同时停止自己的effect

export let activeEffectScope = null // 当前的 EffectScope

class EffectScope {
  active = true
  parent: null
  effects = []
  scopes = []
  // effectScope嵌套时使用, detached = true 时子级 EffectScope 不添加到父级 scopes 内，所以父级stop时子级不停止
  constructor(detached) {
    if (!detached && activeEffectScope) {
      activeEffectScope.scopes.push(this)
    }
  }
  run(fn) {
    if (this.active) {
      try {
        this.parent = activeEffectScope
        activeEffectScope = this
        return fn()
      } finally {
        activeEffectScope = this.parent
      }
    }
  }
  stop() {
    if (this.active) {
      // 停止自己身上的 effect
      for (let i = 0; i < this.effects.length; i++) {
        this.effects[i].stop()
      }
      // 停止子级 EffectScope 身上的 effect
      for (let i = 0; i < this.scopes.length; i++) {
        this.scopes[i].stop()
      }
      this.active = false
    }
  }
}

// 存放自己身上的 effect
export function recordEffectScope(effect) {
  if (activeEffectScope && activeEffectScope.active) {
    activeEffectScope.effects.push(effect)
  }
}

export function effectScope(detached = false) {
  return new EffectScope(detached)
}

import { isFunction } from '@vue/shared'
import {
  activeEffect,
  ReactiveEffect,
  trackEffects,
  triggerEffects
} from './effect'

export type ComputedGetter<T> = (...args: any[]) => T
export type ComputedSetter<T> = (v: T) => void

class ComputedRefImpl<T> {
  public dep = new Set
  private _value!: T
  public readonly effect
  public readonly __v_isRef = true
  public readonly IS_READONLY: boolean
  public _dirty = true

  constructor(
    getter: ComputedGetter<T>,
    private readonly _setter: ComputedSetter<T>
  ) {
    this.effect = new ReactiveEffect(getter, () => {
      if(!this._dirty){
        this._dirty = true
        triggerEffects(this.dep) // 发布订阅
      }
    })
  }
  get value() {
    trackEffects(this.dep) // effect 依赖收集
    if(this._dirty){ // 说明这个值是脏的
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }
  set value(newValue) {
    this._setter(newValue)
  }
}

export function computed<T>(getterOrOptions) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>

  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions
    setter = () => {
      console.warn('Write operation failed: computed value is readonly')
    }
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)

  // let ref = {}
  // const _effect = new ReactiveEffect(getterOrOptions, () => {
  //   ref = getterOrOptions()
  // })
  // ref = _effect.run()
  // return ref
}

import { reactive, proxyRefs } from '@vue/reactivity'
import { initProps } from './componentProps'
import { hasOwn, isFunction, ShapeFlags } from '@vue/shared'
export let currentInstance = null
export const getCurrentInstance = () => currentInstance
export const setCurrentInstance = instance => (currentInstance = instance)

export function createComponentInstance(vnode) {
  // 组件的实例
  const instance = {
    data: null,
    vnode, // vue2的源码中组件的虚拟节点叫$vnode  渲染的内容叫_vnode
    subTree: null, // vnode组件的虚拟节点 subTree渲染的组件内容
    isMounted: false,
    update: null,
    propsOptions: vnode.type.props,
    props: {},
    attrs: {},
    proxy: null,
    render: null,
    setupState: {}
  }
  return instance
}

const publicPropertyMap = {
  $attrs: i => i.attrs,
  $slots: i => i.slots
}

const publicInstanceProxy = {
  get(target, key) {
    const { data, props, setupState } = target
    if (data && hasOwn(data, key)) {
      return data[key]
    } else if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (props && hasOwn(props, key)) {
      return props[key]
    }

    // this.$attrs 走这里
    let getter = publicPropertyMap[key]
    if (getter) {
      return getter(target)
    }
  },
  set(target, key, value) {
    const { data, props, setupState } = target
    if (data && hasOwn(data, key)) {
      data[key] = value
      return true
    } else if (hasOwn(setupState, key)) {
      setupState[key] = value

      // 用户操作的属性是代理对象，这里面被屏蔽了
      // 但是我们可以通过instance.props 拿到真实的props
    } else if (props && hasOwn(props, key)) {
      console.warn(
        'attempting to mutate prop, Props are readonly.' + (key as string)
      )
      return false
    }
    return true
  }
}

export function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children
  }
}

export function setupComponent(instance) {
  let { props, type, children } = instance.vnode
  // 得到 props attrs
  initProps(instance, props)
  // 得到 slots
  initSlots(instance, children)

  instance.proxy = new Proxy(instance, publicInstanceProxy)
  let data = type.data

  if (data) {
    if (!isFunction(data)) {
      return console.warn('data option must be a function')
    }
    instance.data = reactive(data.call(instance.proxy))
  }
  // 组件上的 render 方法
  let setup = type.setup
  if (setup) {
    const setupContext = {
      // 典型的发布订阅模式
      emit: (event, ...args) => {
        // 事件的实现原理
        const eventName = `on${event[0].toUpperCase() + event.slice(1)}`
        // 找到虚拟节点的属性有存放props
        const handler = instance.vnode.props[eventName]
        handler && handler(...args)
      },
      attrs: instance.attrs,
      slots: instance.slots
    }

    setCurrentInstance(instance)
    const setupResult = setup(instance.props, setupContext)
    setCurrentInstance(null)

    // setup 返回的是函数说明是 render 方法
    if (isFunction(setupResult)) {
      instance.render = setupResult
    } else {
      // proxyRefs 对内部的ref 进行取消.value
      instance.setupState = proxyRefs(setupResult)
    }
  }

  if (!instance.render) {
    instance.render = type.render
  }
}

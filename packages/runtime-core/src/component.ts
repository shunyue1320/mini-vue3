import { reactive } from '@vue/reactivity'
import { initProps } from './componentProps'
import { hasOwn, isFunction } from '@vue/shared'

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
    render: null
  }
  return instance
}

const publicPropertyMap = {
  $attrs: i => i.attrs
}

const publicInstanceProxy = {
  get(target, key) {
    const { data, props } = target
    if (data && hasOwn(data, key)) {
      return data[key]
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
    const { data, props } = target
    if (data && hasOwn(data, key)) {
      data[key] = value
      return true

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

export function setupComponent(instance) {
  let { props, type } = instance.vnode
  initProps(instance, props)
  instance.proxy = new Proxy(instance, publicInstanceProxy)
  let data = type.data

  if (data) {
    if (!isFunction(data)) {
      return console.warn('data option must be a function')
    }
    instance.data = reactive(data.call(instance.proxy))
  }
  // 组件上的 render 方法
  instance.render = type.render
}

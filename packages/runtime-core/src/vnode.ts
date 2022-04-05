import { isArray, isObject, isString, ShapeFlags } from '@vue/shared'

export const Text = Symbol('Text')

export const Fragment = Symbol('Fragment')

export function isVnode(value) {
  return !!(value && value.__v_isVnode)
}

// 判断两个虚拟节点是否是相同节点，套路是1）标签名相同 2） key是一样的
export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}

// 虚拟节点有很多：组件的、元素的、文本的   h('h1')
export function createVnode(type, props, children = null, patchFlag = 0) {
  let shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT // 组件标记
    : 0

  // 虚拟dom就是一个vnode对象，方便diff算法。
  const vnode = {
    type,
    props,
    children,
    el: null, // 虚拟节点上对应的真实节点，后续diff算法
    key: props?.['key'],
    __v_isVnode: true,
    shapeFlag,
    patchFlag
  }

  if (children) {
    let type = 0
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN
    } else if (isObject(children)) {
      type = ShapeFlags.SLOTS_CHILDREN // 这个组件是带有插槽的
    } else {
      children = String(children)
      type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag |= type
  }

  // 性能优化：把动态节点存到 currentBlock 中，后续只 diff 动态节点
  if (currentBlock && vnode.patchFlag > 0) {
    currentBlock.push(vnode)
  }
  return vnode
}

export { createVnode as createElementVNode }

// 用一个数组来收集多个动态节点 先执行 openBlock 后执行 createElementBlock
let currentBlock = null
export function openBlock() {
  currentBlock = []
}

export function createElementBlock(type, props, children, patchFlag) {
  return setupBlock(createVnode(type, props, children, patchFlag))
}

function setupBlock(vnode) {
  vnode.dynamicChildren = currentBlock
  currentBlock = []
  return vnode
}

export function toDisplayString(val) {
  return isString(val)
    ? val
    : val == null
    ? ''
    : isObject(val)
    ? JSON.stringify(val)
    : String(val)
}

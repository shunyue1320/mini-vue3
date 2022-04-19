export { createRenderer } from './renderer'
export { h } from './h'
export {
  Text,
  isVnode,
  isSameVnode,
  createVnode,
  Fragment,
  openBlock,
  toDisplayString,
  createElementVNode,
  createElementBlock
} from './vnode'
export { getCurrentInstance, setCurrentInstance } from './component'
export {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated
} from './apiLifecycle'

export { provide, inject } from './apiInject'
export { TeleportImpl as Teleport } from './components/Teleport'
export { defineAsyncComponent } from './apiAsyncComponent'

import { isArray, isString, ShapeFlags } from '@vue/shared'
import { Text, createVnode, isSameVnode } from './vnode'

export function createRenderer(renderOptions) {
  // 对 dom 节点的增删改查的跨平台 api，可由用户传入 （默认为操作浏览器dom api）
  let {
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createElement: hostCreateElement,
    createText: hostCreateText,
    patchProp: hostPatchProp
  } = renderOptions



  const patch = (n1, n2, container, anchor = null) => {
    // TODO
  }

  const unmount = (vnode) => {
    // TODO
  }

  const render = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        // 之前有vnode之后没有，需要卸载之前的vnode
        unmount(container._vnode)
      }
    } else {
      // 之前有vnode之后也有，需要更新vnode diff 算法
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode
  }

  return {
    render
  }
}

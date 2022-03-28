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

  const processText = (n1, n2, container) => {
    if (n1 === null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    } else {
      // 文本仅内容变化，则复用老的节点
      const el = (n2.el = n1.el)
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children)
      }
    }
  }

  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // TODO 挂载
    } else {
      // TODO diff
    }
  }

  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) {
      return
    }
    // 判断两个元素不相同，不相同卸载 n1 再添加 n2
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1)
      n1 = null
    }
    const { type, shapeFlag } = n2
    switch (type) {
      case Text:
        // 处理文本
        processText(n1, n2, container)
        break
      default:
        // 处理元素
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor)
        }
        break
    }
  }

  const unmount = vnode => {
    hostRemove(vnode.el)
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

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

  const normalize = (children, i) => {
    if (isString(children[i])) {
      let vnode = createVnode(Text, null, children[i])
      children[i] = vnode
    }
    return children[i]
  }

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalize(children, i)
      patch(null, child, container)
    }
  }

  const mountElement = (vnode, container, anchor) => {
    let { type, props, children, shapeFlag } = vnode
    // 将真实元素挂载到这个虚拟节点上，后续用于复用节点和更新
    let el = (vnode.el = hostCreateElement(type))
    // 标签属性
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 数组
      mountChildren(children, el)
    }
    // 虚拟节点插入 app
    hostInsert(el, container, anchor)
  }

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

  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      // 新的里面有，直接用新的盖掉
      hostPatchProp(el, key, oldProps[key], newProps[key])
    }
    for (const key in oldProps) {
      // 老的里面有新的没有，则删除
      if (newProps[key] == null) {
        hostPatchProp(el, key, oldProps[key], undefined)
      }
    }
  }

  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }

  // 核心 diff 流程
  const patchKeyedChildren = (c1, c2, el) => {
    // TODO
  }

  // 比较新旧 vnode
  const patchChildren = (n1, n2, el) => {
    // 比较两个虚拟节点的儿子的差异 ， el就是当前的父节点
    const c1 = n1.children // 旧的
    const c2 = n2.children // 新的
    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag

    // 新的 vnode 是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 删除所有子节点
      unmountChildren(c1)
      // 文本	!== 文本
      if (c1 !== c2) {
        hostSetElementText(el, c2)
      }
    } else {
      // 旧的 vnode 是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 就的 vnode 是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 核心 diff 流程 （比较新旧 vnode）
          patchKeyedChildren(c1, c2, el)
        } else {
          // 新的 vnode 不是数组
          unmountChildren(c1)
        }
      } else {
        // 旧的 vnode 是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '') // 清空文本，进行挂载
        }
        // 新的 vnode 是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el) // 直接挂载
        }
      }
    }
  }

  // 先复用节点、在比较属性、在比较儿子
  const patchElement = (n1, n2) => {
    let el = (n2.el = n1.el)
    let oldProps = n1.props || {}
    let newProps = n2.props || {}

    patchProps(oldProps, newProps, el)
    patchChildren(n1, n2, el)
  }

  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // 挂载
      mountElement(n2, container, anchor)
    } else {
      // diff
      patchElement(n1, n2)
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

import { reactive, ReactiveEffect } from '@vue/reactivity'
import { isArray, isString, ShapeFlags } from '@vue/shared'
import { Text, createVnode, isSameVnode, Fragment } from './vnode'
import { getSequence } from './sequence'
import { queueJob } from './scheduler'
import { createComponentInstance, setupComponent } from './component'
import { hasPropsChanged, updateProps } from './componentProps'

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

  const processFragment = (n1, n2, container) => {
    if (n1 == null) {
      mountChildren(n2.children, container)
    } else {
      patchChildren(n1, n2, container)
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
    let i = 0
    let e1 = c1.length - 1 // 老的
    let e2 = c2.length - 1 // 新的

    /*************** start 特殊处理：针对常规头尾增删规操作 *******************/

    // 从前往后逐一对比 vnode 不同跳出
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      // 比较两个 vnode 是同一个
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el) // 这样做就是比较两个节点的属性和子节点
      } else {
        break
      }
      i++
    }

    // 从后往前逐一对比 vnode 不同跳出
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      e1--
      e2--
    }

    // 有一方全部比较完毕了 ，要么就删除 ， 要么就添加
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          const nextPos = e2 + 1
          const anchor = nextPos < c2.length ? c2[nextPos].el : null
          patch(null, c2[i], el, anchor) // 新增
          i++
        }
      }
    } else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]) // 卸载
          i++
        }
      }
    }

    /*************** end 特殊处理：针对常规头尾增删规操作 *******************/

    // 乱序比对
    let s1 = i
    let s2 = i
    const keyToNewIndexMap = new Map()
    for (let i = s2; i < e2; i++) {
      keyToNewIndexMap.set(c2[i].key, i)
    }

    // 循环老的元素 看一下新的里面有没有，如果有说明要比较差异，没有要添加到列表中，老的有新的没有要删除
    const toBePatched = e2 - s2 + 1 // 新的总个数
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0) // 一个记录是否比对过的映射表
    for (let i = s1; i <= e1; i++) {
      const oldChild = c1[i] // 老的孩子
      let newIndex = keyToNewIndexMap.get(oldChild.key) // 用老的孩子去新的里面找
      if (newIndex == undefined) {
        unmount(oldChild) // 多余的删掉
      } else {
        // 新的位置对应的老的位置 , 如果数组里放的值>0说明 已经pactch过了
        newIndexToOldIndexMap[newIndex - s2] = i + 1 // 用来标记当前所patch过的结果
        patch(oldChild, c2[newIndex], el)
      }
    } // 到这这是新老属性和儿子的比对，没有移动位置

    // 获取最长递增子序列
    let increment = getSequence(newIndexToOldIndexMap)

    // 需要移动位置
    let j = increment.length - 1
    for (let i = toBePatched - 1; i >= 0; i--) {
      let index = i + s2
      let current = c2[index] // 找到h
      let anchor = index + 1 < c2.length ? c2[index + 1].el : null
      if (newIndexToOldIndexMap[i] === 0) {
        // 创建   5 3 4 0
        patch(null, current, el, anchor)
      } else {
        // 不是0 说明是已经比对过属性和儿子的了
        if (i != increment[j]) {
          hostInsert(current.el, el, anchor) // 目前无论如何都做了一遍倒叙插入，其实可以不用的， 可以根据刚才的数组来减少插入次数
        } else {
          j--
        }
      }

      // 这里发现缺失逻辑 我需要看一下current有没有el。如果没有el说明是新增的逻辑
    }
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
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 删除所有子节点
        unmountChildren(c1)
      }
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

  const mountComponent = (vnode, container, anchor) => {
    // 1.创建组件实例
    let instance = (vnode.component = createComponentInstance(vnode))
    // 2. 赋值给实例
    setupComponent(instance)
    // 3. 创建 effect
    setupRenderEffect(instance, container, anchor)
  }

  const updateComponentPreRender = (instance, next) => {
    instance.next = null
    instance.vnode = next
    updateProps(instance.props, next.props)
  }

  const setupRenderEffect = (instance, container, anchor) => {
    const { render, proxy } = instance
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const subTree = render.call(proxy)
        patch(null, subTree, container, anchor)
        instance.subTree = subTree
        instance.isMounted = true
      } else {
        let { next } = instance
        // 先更新 props 属性再执行 render
        if (next) {
          updateComponentPreRender(instance, next)
        }
        const subTree = render.call(proxy)
        patch(instance.subTree, subTree, container, anchor)
        instance.subTree = subTree
      }
    }

    // 组件的异步更新
    const effect = new ReactiveEffect(componentUpdateFn, () => {
      queueJob(instance.update)
    })
    // 我们将组件强制更新的逻辑保存到了组件的实例上，后续可以使用
    // 调用effect.run可以让组件强制重新渲染
    let update = (instance.update = effect.run.bind(effect))
    update()
  }

  const shouldUpdateComponent = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1
    const { props: nextProps, children: nextChildren } = n2
    if (prevProps === nextProps) {
      return
    }
    if (prevChildren || nextChildren) {
      return true
    }
    return hasPropsChanged(prevProps, nextProps)
  }

  const updateComponent = (n1, n2) => {
    // instance.props 是响应式的，而且可以更改  属性的更新会导致页面重新渲染
    const instance = (n2.component = n1.component) // 对于元素而言，复用的是dom节点，对于组件来说复用的是实例
    // 需要更新就强制调用组件的 update 方法
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2 // 将新的虚拟节点放到next属性上
      instance.update() // 统一调用update方法来更新
    }
  }

  // 统一处理组件， 里面在区分是普通的还是 函数式组件
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor)
    } else {
      // props 改变组件更新
      updateComponent(n1, n2)
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
      case Fragment:
        processFragment(n1, n2, container)
        break
      default:
        // 处理元素
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor)
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

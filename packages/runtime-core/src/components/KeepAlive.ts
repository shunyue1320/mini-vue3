import { isVnode } from '../vnode'
import { ShapeFlags } from '@vue/shared'
import { getCurrentInstance } from '../component'
import { onMounted, onUpdated } from '../apiLifecycle'

function resetShapeFlag(vnode) {
  let shapeFlag = vnode.shapeFlag
  if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
    shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
  }
  if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
    shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE
  }
  vnode.shapeFlag = shapeFlag
}

export const KeepAliveImpl = {
  __isKeepAlive: true,
  props: {
    include: {}, // 要缓存的有哪些
    exclude: {}, // 哪些不要缓存
    max: {} // 缓存个数
  },
  setup(props, { slots }) {
    const keys = new Set() // 缓存的key
    const cache = new Map() // key 对应的缓存组件虚拟节点

    const instance = getCurrentInstance()
    const { createElement, move } = instance.ctx.renderer
    const storageContainer = createElement('div') // 稍后我们要把渲染好的组件移入进去

    instance.ctx.deactivate = function (vnode) {
      move(vnode, storageContainer) // 移入到虚拟节点
      // 调用deactivate()
    }

    instance.ctx.activate = function (vnode, container, anchor) {
      move(vnode, container, anchor) // 移入到页面渲染
      // 调用activate()
    }

    let pendingCacheKey = null
    // 怎么操作dom元素
    function cacheSubTree() {
      if (pendingCacheKey) {
        // 挂载完毕后缓存当前实例对应的subTree
        cache.set(pendingCacheKey, instance.subTree)
      }
    }

    onMounted(cacheSubTree)
    onUpdated(cacheSubTree)
    const { include, exclude, max } = props
    let current = null
    function pruneCacheEntry(key) {
      resetShapeFlag(current)
      cache.delete(key)
      keys.delete(key)
    }

    // keeyp-alive本身没有功能，渲染的是插槽
    return () => {
      // keep-alive 默认会取去slots的default属性 返回的虚拟节点的第一个
      let vnode = slots.default()

      // 看一下vnode是不是组件，只有组件才能缓存，且必须是虚拟节点而且是带状态的组件
      if (
        !isVnode(vnode) ||
        !(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)
      ) {
        return vnode
      }

      const comp = vnode.type
      const key = vnode.key == null ? comp : vnode.key
      const name = comp.name
      // 组件的名字，可以根据组件的名字来决定是否需要缓存
      if (
        (name && include && !include.split(',').includes(name)) ||
        (exclude && exclude.split(',').includes(name))
      ) {
        return vnode
      }

      let cacheVnode = cache.get(key)
      // 找有没有缓存过
      if (cacheVnode) {
        vnode.component = cacheVnode.component // 告诉复用缓存的component
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE // 标识初始化的时候 不要走创建了
        // SRU 算法
        keys.delete(key)
        keys.add(key)
      } else {
        keys.add(key)
        pendingCacheKey = key
        if (max && keys.size > max) {
          // 迭代器 拿到第一个 key 进行清除
          pruneCacheEntry(keys.values().next().value)
        }
      }
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE // 标识这个组件稍后是假的卸载
      current = vnode

      return vnode
    }
  }
}

export const isKeepAlive = vnode => vnode.type.__isKeepAlive

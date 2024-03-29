// runtime-dom 都是对浏览器dom的操作 独立出来 便于夸平台

import { createRenderer } from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

// 合并 domAPI 属性api
const renderOptions = Object.assign(nodeOps, { patchProp })

export function render(vnode, container) {
  // 选传入平台dom操作的api 在创建渲染器 （目的： 方便跨平台时更换dom api）
  createRenderer(renderOptions).render(vnode, container, null)
}

export { createRenderer }
export * from '@vue/reactivity'
export * from '@vue/runtime-core'

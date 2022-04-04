// runtime-dom 都是对浏览器dom的操作 独立出来 便于夸平台

import { createRenderer } from '@vue/runtime-core'
export {
  h,
  Text,
  isVnode,
  isSameVnode,
  Fragment,
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  getCurrentInstance,
  setCurrentInstance
} from '@vue/runtime-core'
export { ref, toRefs, reactive, computed } from '@vue/reactivity'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

// 合并 domAPI 属性api
const renderOptions = Object.assign(nodeOps, { patchProp })

export function render(vnode, container) {
  // 选传入平台dom操作的api 在创建渲染器 （目的： 方便跨平台时更换dom api）
  createRenderer(renderOptions).render(vnode, container)
}

export { createRenderer }

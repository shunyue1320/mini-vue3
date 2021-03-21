import { render } from "./renderer"
import { createVNode } from "./createVNode"

export const createApp = (rootComponent) => {
  const app = {
    _component: rootComponent,
    _container: null,

    mount(rootContainer) {
      console.log("基于根组件创建 vnode")
      const vnode = createVNode(rootComponent)
      app._container = rootContainer
      console.log("调用 render，基于 vnode 进行开箱")
      render(vnode, rootContainer)
    }
  }
  return app
}
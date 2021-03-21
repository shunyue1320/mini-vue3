import { ShapeFlags } from "../shared"

export const createVNode = function (
  type: any,
  props?: any,
  children?: string | Array<any>
) {
  const vnode = {
    el: null,
    component: null,
    type,
    props,
    children,
    ShapeFlags: getShapeFlag(type)
  }

  // 基于 children 再次设置 shapeFlag
  if (Array.isArray(children)) {
    vnode.ShapeFlags |= ShapeFlags.ARRAY_CHILDREN
  } else if (typeof children === 'string') {
    vnode.ShapeFlags |= ShapeFlags.TEXT_CHILDREN
  }
  return vnode
}

/* 
type的类型情况
  string：用户设置的 createVNode("div")
  object: 组件对象 createVNode(App)
*/
function getShapeFlag(type: any) {
  return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}
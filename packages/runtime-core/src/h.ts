import { isArray, isObject } from '@vue/shared'
import { createVnode, isVnode } from './vnode'

// 各种用法
// h('div',{style:{"color"：“red”}},'hello')
// h('div','hello')
// h('div',null,'hello','world')
// h('div',null,h('span'))
// h('div',null,[h('span')])

export function h(type, propsChildren?, children?) {
  const l = arguments.length

  if (l === 2) {
    if (isObject(propsChildren) && !isArray(propsChildren)) {
      if (isVnode(propsChildren)) {
        return createVnode(type, null, [propsChildren])
      }
      return createVnode(type, propsChildren)
    } else {
      return createVnode(type, null, propsChildren)
    }
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2)
    } else if (l === 3 && isVnode(children)) {
      children = [children]
    }
    return createVnode(type, propsChildren, children)
  }
}

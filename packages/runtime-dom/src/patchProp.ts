// dom属性的操作api
import { patchAttr } from './modules/attr'
import { patchClass } from './modules/class'
import { patchEvent } from './modules/event'
import { patchStyle } from './modules/style'

// 标签上属性的新老替换
export function patchProp(el, key, prevValue, nextValue) {
  if (key === 'class') {
    patchClass(el, nextValue)
  } else if (key === 'style') {
    // 样式 prevValue：{color:'red',fontSzie:'12'}  nextValue：{color:'blue',background:"red"}
    patchStyle(el, prevValue, nextValue)
  } else if (/^on[^a-z]/.test(key)) {
    // events  addEventListener
    patchEvent(el, key, nextValue)
  } else {
    // 普通属性 // el.setAttribute
    patchAttr(el, key, nextValue)
  }
}

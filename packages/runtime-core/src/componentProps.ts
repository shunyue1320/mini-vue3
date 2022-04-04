import { reactive } from '@vue/reactivity'
import { hasOwn } from '@vue/shared'

export function initProps(instance, rawProps) {
  const props = {}
  const attrs = {}
  const options = instance.propsOptions || {}

  // 区分传递给本组件的 props 与 不是本组件接收的 attrs
  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key]
      if (hasOwn(options, key)) {
        props[key] = value
      } else {
        attrs[key] = value
      }
    }
  }

  // 这里props不希望在组件内部被更改，但是props得是响应式的，因为后续属性变化了要更新视图， 用的应该是 shallowReactive 浅监听
  instance.props = reactive(props)
  instance.attrs = attrs
}

export function hasPropsChanged(prevProps = {},nextProps = {}) {
  const nextKeys = Object.keys(nextProps);
  if(nextKeys.length !== Object.keys(prevProps).length){
    return true
  }
  for(let i = 0; i < nextKeys.length;i++){
    const key = nextKeys[i];
    if (prevProps[key] !== nextProps[key]) {
      return true
    }
  }
  return false
}

export function updateProps(prevProps,nextProps){ 
  for (const key in nextProps) {
    prevProps[key] = nextProps[key]
  }
  for (const key in prevProps) {
    if (!hasOwn(nextProps, key)) {
      delete prevProps[key]
    }
  }
}

import { currentInstance } from './component'

// provide 存在 currentInstance 上
export function provide(key, value) {
  // 一定在 setup 内才能拿到 currentInstance
  if (!currentInstance) {
    return
  }
  const parentProvides =
    currentInstance.parent && currentInstance.parent.provides
  let provides = currentInstance.provides

  // 第一次 provide 才走进下面if内合并父级 provides 创建自己的 provides
  if (parentProvides === provides) {
    provides = currentInstance.provides = Object.create(provides)
  }
  provides[key] = value
}

export function inject(key, defaultValue) {
  if (!currentInstance) {
    return
  }
  const provides = currentInstance.parent && currentInstance.parent.provides
  if (provides && (key in provides)) {
    return provides[key]
  } else if (arguments.length > 1) {
    return defaultValue
  }
}

export const isTeleport = type => type.__isTeleport

export const TeleportImpl = {
  __isTeleport: true,
  process(n1, n2, container, anchor, internals) {
    let { mountChildren, patchChildren, move } = internals
    if (!n1) {
      const target = document.querySelector(n2.props.to)
      if (target) {
        mountChildren(n2.children, target)
      }
    } else {
      // 先对比变化渲染更新
      patchChildren(n1, n2, container)
      // 如果传送位置不一样移动子元素
      if (n2.props.to !== n1.props.to) {
        const nextTagert = document.querySelector(n2.props.to)
        // 将更新后的孩子放到新的容器里  移动到新的容器中
        n2.children.forEach(child => {
          move(child, nextTagert)
        })
      }
    }
  }
}

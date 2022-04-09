import { PatchFlags } from '@vue/shared'
import { createCallExpression, NodeTypes } from '../ast'

export function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
}

export function transformText(node, context) {
  // 我期望 将多个子节点拼接在一起
  // 你是不是文本
  // 需要遇到元素的时候 才能处理 多个子节点
  if (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT) {
    return () => {
      // 5 表达式  +  2 文本  =》 COMPOUND_EXPRESSION  最后只需要创建的时候创建一个节点就可以了
      let currentContainer = null
      let children = node.children
      let hasText = false
      for (let i = 0; i < children.length; i++) {
        let child = children[i] // 拿到第一个孩子
        hasText = true
        if (isText(child)) {
          // 看下一个节点是不是文本
          for (let j = i + 1; j < children.length; j++) {
            let next = children[j]
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child]
                }
              }
              // 直接将下一个节点和第一个节点拼接在一起
              currentContainer.children.push(`+`, next)
              children.splice(j, 1) // 删除拼接的节点
              j--
            } else {
              currentContainer = null
              break
            }
          }
        }
      }
      // !true  =>  false || xxx
      if (!hasText || children.length === 1) {
        // 长度是1 而且是文本   ( 就是元素也不管)
        return
      }

      // 只有是为本 而且是多个才要处理

      // 需要给多个儿子中的创建文本节点添加 patchFlag
      for (let i = 0; i < children.length; i++) {
        const child = children[i]

        const callArgs = []
        // createTextVnode(_ctx.xxx)
        if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
          // 都是文本
          callArgs.push(child)
          if (node.type !== NodeTypes.TEXT) {
            // 动态节点
            callArgs.push(PatchFlags.TEXT) // 靶向更新
          }
          children[i] = {
            // 添加一个createTextVnode这个方法
            type: NodeTypes.TEXT_CALL, // 通过createTextVnode来实现
            content: child,
            codegenNode: createCallExpression(context, callArgs)
          }
        }
      }
    }
  }
}

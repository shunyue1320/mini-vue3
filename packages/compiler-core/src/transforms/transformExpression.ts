import { NodeTypes } from '../ast'

export function transformExpression(node, context) {
  // {{aaa}} -> _ctx.aaa
  // 是不是表达式
  if (node.type === NodeTypes.INTERPOLATION) {
    let content = node.content.content
    node.content.content = `_ctx.${content}`
  }
}

// 替换并且增加方法 即可

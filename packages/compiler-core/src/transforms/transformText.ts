import { NodeTypes } from '../ast'

export function transformText(node, context) {
  // 我期望 将多个子节点拼接在一起
  // 你是不是文本
  // 需要遇到元素的时候 才能处理 多个子节点
  if (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT) {
    return () => {}
  }
}

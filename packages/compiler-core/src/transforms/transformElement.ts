import { NodeTypes } from '../ast'

export function transformElement(node, context) {
  // 我们期望 给所有儿子处理完后，给元素重新添加children属性
  // 可以判断你是不是元素
  if (node.type === NodeTypes.ELEMENT) {
    return () => {}
  }
}

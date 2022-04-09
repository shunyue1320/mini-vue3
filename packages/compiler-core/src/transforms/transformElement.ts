import { createObjectExpression, createVnodeCall, NodeTypes } from '../ast'

export function transformElement(node, context) {
  // 我们期望 给所有儿子处理完后，给元素重新添加children属性
  // 可以判断你是不是元素
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // createElementVnode('div',{},孩子)

      let vnodeTag = `"${node.tag}"`
      let properties = []
      let props = node.props
      for (let i = 0; i < props.length; i++) {
        properties.push({
          key: props[i].name,
          value: props[i].value.content
        })
      }
      // 创建一个属性的表达式
      const propsExpression =
        properties.length > 0 ? createObjectExpression(properties) : null

      // 需要考虑孩子的情况  直接是一个节点
      let childrenNode = null
      if (node.children.length === 1) {
        childrenNode = node.children[0]
      } else if (node.children.length > 1) {
        childrenNode = node.children
      }

      // createElementVnode
      node.codegenNode = createVnodeCall(
        context,
        vnodeTag,
        propsExpression,
        childrenNode
      )
    }
  }
}

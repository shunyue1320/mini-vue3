import { CREATE_ELEMENT_VNODE, CREATE_TEXT } from './runtimeHelpers'

export const enum NodeTypes {
  ROOT, // 根节点
  ELEMENT, // 元素
  TEXT, // 文本
  COMMENT, // 注释
  SIMPLE_EXPRESSION, // 简单表达式  aaa   :a="aa"
  INTERPOLATION, // 模板表达式  {{aaa}}
  ATTRIBUTE,
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION, // 复合表达式  {{aa}} abc
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL, // 文本调用
  // codegen
  VNODE_CALL, // 元素调用
  JS_CALL_EXPRESSION, // js调用表达式
  JS_OBJECT_EXPRESSION
}

export function createCallExpression(context, args) {
  let callee = context.helper(CREATE_TEXT)
  return {
    callee,
    type: NodeTypes.JS_CALL_EXPRESSION,
    arguments: args
  }
}

export function createObjectExpression(properties) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    properties
  }
}

export function createVnodeCall(
  context,
  vnodeTag,
  propsExpression,
  childrenNode
) {
  context.helper(CREATE_ELEMENT_VNODE)
  return {
    type: NodeTypes.VNODE_CALL,
    tag: vnodeTag,
    props: propsExpression,
    children: childrenNode
  }
}

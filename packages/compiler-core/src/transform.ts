import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING } from './runtimeHelpers'
import { transformElement } from './transforms/transformElement'
import { transformExpression } from './transforms/transformExpression'
import { transformText } from './transforms/transformText'

function createTransformContext(root) {
  const context = {
    currentNode: root, // 当前正在转化的是谁
    parent: null, // 当前转化的父节点是谁
    helpers: new Map(), // 优化 超过20个相同节点会被字符串化

    helper(name) {
      // 根据使用过的方法进行优化
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    },
    nodeTransforms: [transformElement, transformText, transformExpression]
  }
  return context
}

function traverse(node, context) {
  context.currentNode = node
  const transforms = context.nodeTransforms
  const exitsFns = []
  for (let i = 0; i < transforms.length; i++) {
    let onExit = transforms[i](node, context) // 在执行的时候 有可能这个node被删除了
    if (onExit) {
      exitsFns.push(onExit)
    }
    if (!context.currentNode) return // 如果当前节点被删掉了，那么就不考虑儿子了
  }
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      // 宏 常量
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      for (let i = 0; i < node.children.length; i++) {
        context.parent = node
        traverse(node.children[i], context)
      }
  }
  context.currentNode = node // 当执行退出韩式的时候保证currentNode指向的依旧是对的
  let i = exitsFns.length
  while (i--) {
    exitsFns[i]()
  }
}

export function transform(ast) {
  // 对树进行遍历操作
  const context = createTransformContext(ast)
  traverse(ast, context)
}

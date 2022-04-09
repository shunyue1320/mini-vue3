import { parse } from './parse'
import { transform } from './transform'

export function compile(template) {
  // 将模板转成抽象语法树
  const ast = parse(template) // 这里需要将html语法转换成js语法  编译原理
  transform(ast)
  return ast
}

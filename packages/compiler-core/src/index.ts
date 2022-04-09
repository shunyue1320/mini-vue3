import { parse } from './parse'
import { transform } from './transform'
import { generate } from './generate'

export function compile(template) {
  // 将模板转成抽象语法树
  const ast = parse(template) // 这里需要将html语法转换成js语法  编译原理

  // 元素、属性、表达式、文本
  transform(ast)

  // 最终生成代码
  return generate(ast)
}

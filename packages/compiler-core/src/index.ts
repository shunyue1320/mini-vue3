import { NodeTypes } from './ast'

function createParserContext(template) {
  return {
    line: 1,
    column: 1,
    offset: 0,
    source: template, // 此字段会被不停的进行解析 slice
    originalSource: template
  }
}

function isEnd(context) {
  const source = context.source
  return !source // 如果解析完毕后为空字符串时表示解析完毕
}

function getCursor(context) {
  let { line, column, offset } = context
  return { line, column, offset }
}

function advancePositionWithMutation(context, source, endIndex) {
  let linesCount = 0

  let linePos = -1
  for (let i = 0; i < endIndex; i++) {
    if (source.charCodeAt(i) == 10) {
      linesCount++
      linePos = i
    }
  }
  context.line += linesCount
  context.offset += endIndex
  context.column =
    linePos == -1 ? context.column + endIndex : endIndex - linePos
}

function advanceBy(context, endIndex) {
  // 每次删掉内容的时候 都要更新最新的行列和偏移量信息
  let source = context.source
  advancePositionWithMutation(context, source, endIndex)
  context.source = source.slice(endIndex)
}

function parseTextData(context, endIndex) {
  const rawText = context.source.slice(0, endIndex)
  advanceBy(context, endIndex)
  return rawText
}

function getSelection(context, start, end?) {
  end = end || getCursor(context)
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  }
}

function parseText(context) {
  // 在解析文本的时候 要看 后面到哪里结束
  let endTokens = ['<', '{{']
  // as {{das<dsadsadda
  let endIndex = context.source.length // 默认认为到最后结束
  for (let i = 0; i < endTokens.length; i++) {
    let index = context.source.indexOf(endTokens[i], 1)
    // 找到了 并且第一次比整个字符串小
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }
  // 创建 行列信息
  const start = getCursor(context) // 开始
  // 取内容
  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content: content,
    loc: getSelection(context, start)
  }
  // 在获取结束的位置
}

function parse(template) {
  // 创建一个解析的上下文 来进行处理
  const context = createParserContext(template)
  // `<`    元素
  // `{{}}` 说明表达式
  // `其他`  就是文本
  const nodes = []
  while (!isEnd(context)) {
    const source = context.source
    let node
    if (source.startsWith('{{')) {
      node = 'xxx'
    } else if (source[0] === '<') {
      // 标签
      node = 'qqq'
    }

    // 文本
    if (!node) {
      node = parseText(context)
    }

    nodes.push(node)
    console.log(nodes)
    break
  }
}

export function compile(template) {
  // 将模板转成抽象语法树
  const ast = parse(template) // 这里需要将html语法转换成js语法  编译原理
  return ast

  // TODO: transform(ast)
  // TODO: generate(ast)
}

import { NodeTypes } from './ast'

function createParserContext(template) {
  return {
    line: 1,
    column: 1,
    offset: 0,
    source: template, // 此字段会被不停的进行解析 slice ｜ 边解析边删除
    originalSource: template // 备份
  }
}

function getCursor(context) {
  let { line, column, offset } = context
  return { line, column, offset }
}

function createRoot(children, loc) {
  return {
    type: NodeTypes.ROOT, // Fragment
    children,
    loc
  }
}

function getSelection(context, start, end?) {
  end = end || getCursor(context)
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  }
}

export function parse(template) {
  // 创建一个解析的上下文 来进行处理
  const context = createParserContext(template)
  // < 元素
  // {{}} 说明表达式
  // 其他就是文本
  const start = getCursor(context)
  return createRoot(parseChildren(context), getSelection(context, start))
}

function parseChildren(context) {
  const nodes = []
  while (!isEnd(context)) {
    const source = context.source
    let node
    if (source.startsWith('{{')) {
      node = parseInterpolation(context)
    } else if (source[0] === '<') {
      // 标签
      node = parseElement(context)
    }
    // 文本
    if (!node) {
      // {{aa}}  aaa  {{bbb}}
      node = parseText(context)
    }
    nodes.push(node)
  }
  nodes.forEach((node, i) => {
    if (node.type === NodeTypes.TEXT) {
      if (!/[^\t\r\n\f ]/.test(node.content)) {
        nodes[i] = null
      }
    }
  })
  return nodes.filter(Boolean)
}

function isEnd(context) {
  const source = context.source
  if (context.source.startsWith('</')) {
    return true
  }
  return !source // 如果解析完毕后为空字符串时表示解析完毕
}

function parseInterpolation(context) {
  // 处理表达式的信息
  const start = getCursor(context) // xxx  }}
  const closeIndex = context.source.indexOf('}}', 2) // 查找结束的大括号
  advanceBy(context, 2) // {{  xx }}
  const innerStart = getCursor(context)
  const innerEnd = getCursor(context) // advancePositionWithMutation

  // 拿到原始的内容
  const rawContentLength = closeIndex - 2 // 原始内容的长度
  let preContent = parseTextData(context, rawContentLength) // 可以返回文本内容，是并且可以更新信息
  let content = preContent.trim()
  let startOffset = preContent.indexOf(content) //   {{  xxxx}}

  if (startOffset > 0) {
    advancePositionWithMutation(innerStart, preContent, startOffset)
  }
  let endOffset = startOffset + content.length
  advancePositionWithMutation(innerEnd, preContent, endOffset)
  advanceBy(context, 2)
  return {
    type: NodeTypes.INTERPOLATION, // 表达式
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, start) // 表达式相关的信息
  }
}
function advanceBy(context, endIndex) {
  // 每次删掉内容的时候 都要更新最新的行列和偏移量信息
  let source = context.source
  advancePositionWithMutation(context, source, endIndex)
  context.source = source.slice(endIndex)
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

function parseTextData(context, endIndex) {
  const rawText = context.source.slice(0, endIndex)
  advanceBy(context, endIndex)
  return rawText
}

function parseElement(context) {
  // </div>
  let ele = parseTag(context) // <div>
  // 儿子
  let children = parseChildren(context) // 处理儿子的时候 可能没有儿子
  if (context.source.startsWith('</')) {
    parseTag(context)
  }
  ele.loc = getSelection(context, ele.loc.start) // 计算最新的位置信息
  ele.children = children // 挂载儿子节点
  return ele
}
function parseTag(context) {
  const start = getCursor(context)
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source)
  const tag = match[1] // 标签名   div   aa=1  >
  advanceBy(context, match[0].length) // 删除整个标签
  advanceBySpaces(context)

  let props = parseAttributes(context)
  // <div>  <div/>
  // 可能有属性
  let isSelfClosing = context.source.startsWith('/>')

  advanceBy(context, isSelfClosing ? 2 : 1)
  return {
    type: NodeTypes.ELEMENT,
    tag: tag,
    isSelfClosing,
    children: [],
    props,
    loc: getSelection(context, start)
  }
}
function advanceBySpaces(context) {
  let match = /^[ \t\r\n]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}
function parseAttributes(context) {
  // a=1 b=2 >
  const props = []
  while (context.source.length > 0 && !context.source.startsWith('>')) {
    const prop = parseAttribute(context)
    props.push(prop)
    advanceBySpaces(context)
  }
  return props
}
function parseAttribute(context) {
  const start = getCursor(context)
  // 属性的名字
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
  let name = match[0]
  advanceBy(context, name.length) // a  = '
  advanceBySpaces(context)
  advanceBy(context, 1)
  let value = parseAttributeValue(context)
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: {
      type: NodeTypes.TEXT,
      ...value
    },
    loc: getSelection(context, start)
  }
}
function parseAttributeValue(context) {
  const start = getCursor(context)
  let quote = context.source[0]
  let content
  if (quote == '"' || quote === "'") {
    advanceBy(context, 1) // "a"
    const endIndex = context.source.indexOf(quote)
    content = parseTextData(context, endIndex)
    advanceBy(context, 1) // "a"
  }
  return {
    content,
    loc: getSelection(context, start)
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

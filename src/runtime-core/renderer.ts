import { ShapeFlags } from "../shared"
import { createComponentInstance } from "./component"
import { hostCreateElement, hostSetElementText, hostPatchProp, hostInsert } from "./render-api"
import { h } from "./h"

export const render = (vnode, container) => {
  console.log("调用 patch")
  patch(null, vnode, container)
}

// n1: oldVnode n2:newVnode
function patch(n1, n2, container) {
  const { type, shapeFlag } = n2
  switch (type) {
    case "text":
      // todo
      break;
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) { // 按位包含运算 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_AND_assignment
        console.log("处理 element")
        processElement(n1, n2, container)
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        console.log("处理 component");
        processComponent(n1, n2, container)
      }
  }
}

function processElement(n1, n2, container) {
  if (!n1) {
    mountElement(n2, container)
  } else {
    // todo
    // updateElement()
  }
}

function mountElement(vnode, container) {
  const { shapeFlag, props } = vnode
  // 1. 创建 element 基于可扩展的渲染 api
  const el = (vnode.el = hostCreateElement(vnode.type))

  // 2. 创建单子组件或多子组件
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    console.log(`处理文本:${vnode.children}`)
    hostSetElementText(el, vnode.children)
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // children为数组，内部需要依次调用 patch 递归来处理
    mountChildren(vnode.children, el)
  }

  // 3. 处理 props
  if (props) {
    for (const key in props) {
      // 需要过滤掉vue自身用的key: 如 beforeMount、mounted
      const nextVal = props[key]
      hostPatchProp(el, key, null, nextVal)
    }
  }

  // todo
  // 触发 beforeMount() 钩子
  console.log("vnodeHook  -> onVnodeBeforeMount")
  console.log("DirectiveHook  -> beforeMount")
  console.log("transition  -> beforeEnter")

  // 4. 插入
  hostInsert(el, container)

  // todo
  // 触发 mounted() 钩子
  console.log("vnodeHook  -> onVnodeMounted")
  console.log("DirectiveHook  -> mounted")
  console.log("transition  -> enter")
}

function mountChildren(children, container) {
  children.forEach(VNodeChild => {
    // 处理 vnodeChild 不是 vnode 的情况
    patch(null, VNodeChild, container)
  })
}

function processComponent(n1, n2, container) {
  // 如果 n1 没有值的话，那么就是 mount
  if (!n1) {
    // 初始化 component
    mountComponent(n2, container);
  } else {
    // todo
    // updateComponent()
  }
}

function mountComponent(initialVNode, container) {
  // 1. 先创建一个 component instance
  const instance = (initialVNode.component = createComponentInstance(
    initialVNode
  ));
  console.log(`创建组件实例:${instance.type.name}`);
  // 2. 给 instance 加工加工
  setupComponent(instance);

  setupRenderEffect(instance, container);
}

function setupComponent(instance) {
  // 1. 处理 props
  initProps();
  // 2. 处理 slots
  initSlots();

  // 源码里面有两种类型的 component
  // 一种是基于 options 创建的
  // 还有一种是 function 的
  // 这里处理的是 options 创建的
  // 叫做 stateful 类型
  setupStatefulComponent(instance);
}


function initProps() {
  // todo
  console.log("initProps");
}

function initSlots() {
  // todo
  console.log("initSlots");
}

function setupStatefulComponent(instance) {
  // todo
  // 1. 先创建代理 proxy
  console.log("创建 proxy");
  // 2. 调用 setup
  // todo
  // 应该传入 props 和 setupContext
  const setupResult = instance.setup && instance.setup(instance.props);

  // 3. 处理 setupResult
  handleSetupResult(instance, setupResult);
}


function handleSetupResult(instance, setupResult) {
  // setup 返回值不一样的话，会有不同的处理
  // 1. 看看 setupResult 是个什么
  if (typeof setupResult === "function") {
    // 如果返回的是 function 的话，那么绑定到 render 上
    // 认为是 render 逻辑
    // setup(){ return ()=>(h("div")) }
    instance.render = setupResult;
  } else if (typeof setupResult === "object") {
    // 返回的是一个对象的话
    // 先存到 setupState 上
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  // 给 instance 设置 render

  // 先取到用户设置的 component options
  const Component = instance.type;

  if (!instance.render) {
    // todo
    // 调用 compile 模块来编译 template
    // Component.render = compile(Component.template, {
    //     isCustomElement: instance.appContext.config.isCustomElement || NO
    //   })
  }

  instance.render = Component.render;

  // applyOptions()
}


function applyOptions() {
  // 兼容 vue2.x
  // todo
}

function setupRenderEffect(instance, container) {
  // 源码里面是直接调用了 reactivity
  // 因为这次只处理初始化逻辑
  // 所以暂时用不到
  // 后面这里是作为 update 的主要逻辑

  // 调用 render
  // 应该传入 ctx 也就是 proxy
  // ctx 可以选择暴露给用户的 api
  // 源代码里面是调用的 renderComponentRoot 函数
  // 这里为了简化直接调用 render
  console.log("调用 render,获取 subTree");
  const subTree = instance.render(instance.proxy);
  console.log("subTree", subTree);

  // todo
  console.log(`${instance.type.name}:触发 beforeMount hook`);
  console.log(`${instance.type.name}:触发 onVnodeBeforeMount hook`);

  // 这里基于 subTree 再次调用 patch
  // 基于 render 返回的 vnode ，再次进行渲染
  // 这里我把这个行为隐喻成开箱
  // 一个组件就是一个箱子
  // 里面有可能是 element （也就是可以直接渲染的）
  // 也有可能还是 component
  // 这里就是递归的开箱
  // 而 subTree 就是当前的这个箱子（组件）装的东西
  // 箱子（组件）只是个概念，它实际是不需要渲染的
  // 要渲染的是箱子里面的 subTree
  patch(null, subTree, container);

  console.log(`${instance.type.name}:触发 mounted hook`);
}
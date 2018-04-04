---
title: 尝鲜 workerize 源码
tags:
  - js
  - web worker
categories: 
  - 前端
  - 源码分析
date: 2018-01-16 10:11:31
---

## 写在前面
最近正好在看web worker相关的东西，今天无意中就看到了github一周最热项目的推送中，有这么一个项目[workerize](https://github.com/developit/workerize)，repo里的文档的描述如下：
> Moves a module into a Web Worker, automatically reflecting exported functions as asynchronous proxies.

## 例子
关于README很简单，包含一个类似hello world的例子就没其他什么了。但是从例子本身可以看出这个库要解决的问题，是想通过模块化的方式编写运行在web worker中的脚本，因为通常情况下，web worker每加载一个脚本文件是需要通过一个符合同源策略的URL的，这样会对服务端发送一个额外的请求。同时对于web worker本身加载的js文件的执行环境，与主线程是隔离的（这也是它在进行复杂运算时不会阻塞主线程的原因），与主线程的通讯靠``postMessage``api和``onmessage``回调事件来通讯，这样我们在编写一些通信代码时，需要同时在两个不同的环境中分别编写发送消息和接受消息的逻辑，比较繁琐，同时这些代码也不能以模块化的形式存在。

如果存在一种方式，我们可以以模块化的方式来编写代码，注入web worker，之后还能通过类似Promsie机制来处理等异步，那便是极好的。

先来看看例子：
```
import workerize from 'workerize'

let worker1 = workerize(`
	export function add(a, b) {
		let start = Date.now();
		while (Date.now()-start < 500);
		return a + b;
  }

  export default function minus(a, b){
    let start = Date.now();
		while (Date.now()-start < 500);
    return a - b
  }
`)

let worker2 = workerize(function (m) {
  m.add = function (a, b) {
    let start = Date.now()
    while (Date.now() - start < 500);
    return a + b
  }
});

(async () => {
  console.log('1 + 2 = ', await worker1.add(1, 2))
  console.log('3 + 9 = ', await worker2.call('add', [3, 9]))
})()
```

worker1和worker2是两种不同的使用方式，一种是以字符串的形式声明模块，一种以函数的形式声明模块。但是无论哪种，最后的结果都是一样的，我们可以通过worker实例显示的调用我们想要调用的方法，每个方法的调用结果均是一个Promise，因此它还可以完美的适配async/await语法。

## 源码
那么问题来了，这种模块的加载机制和调用方式是怎样实现的呢？我在运行demo代码的时候心中也默默想到，我去，看了好几天的web worker原来还能这么玩，所以一定要研究研究它的源码和它的实现原理。

打开源代码才发现其实并没有多少代码，官文文档也通过一句话强调了这一点：
> Just 900 bytes of gzipped ES3

所以对其中主要的两点进行简单说明：
* 如何实现按内容模块化加载脚本而不是通过URL
* 如何通过Promise来代理主线程与worker线程的通讯过程

### 使用Blob动态生成加载脚本资源
```
let blob = new Blob([code], {
      type: 'application/javascript'
    }),
    url = URL.createObjectURL(blob),
    worker = new Worker(url)
```
这其实不是什么新鲜的东西，就是将代码的内容转化为Blob对象，之后再通过``URL.createObjectURL``将Blob对象转化为URL的形式，之后再用worker加载它，仅此而已。但是这里的问题是，这个``code``是哪里从哪里来的呢？

### 将加载代码模块化
在加载代码之前，还有重要的一步，就是需要将加载的代码转变为模块，模板本身只对外暴露统一的接口，这样不论对于主线程还是worker线程，就有了统一的约束条件。源码中作者把上一步中的``code``转化为了类似commonjs的形式，主要涉及的代码有:
```
let exportsObjName = `__EXPORTS_${Math.random().toString().substring(2)}__`
  if (typeof code === 'function') code = `(${toCode(code)})(${exportsObjName})`
  code = toCjs(code, exportsObjName, exports)
  code += `\n(${toCode(setup)})(self, ${exportsObjName}, {})`
```
和``toCjs``方法
```
function toCjs (code, exportsObjName, exports) {
  exportsObjName = exportsObjName || 'exports'
  exports = exports || {}
  code = code.replace(/^(\s*)export\s+default\s+/m, (s, before) => {
    exports.default = true
    return `${before}${exportsObjName}.default = `
  })
  code = code.replace(/^(\s*)export\s+(function|const|let|var)(\s+)([a-zA-Z$_][a-zA-Z0-9$_]*)/m, (s, before, type, ws, name) => {
    exports[name] = true
    return `${before}${exportsObjName}.${name} = ${type}${ws}${name}`
  })
  return `var ${exportsObjName} = {};\n${code}\n${exportsObjName};`
}
```
关于toCjs方法，如果你的正则知识比较扎实的话，可以发现，它做了一件事，就是将字符串类型的code中的所有导出方法的声明，使用commonjs的导出语法替换掉(中间会涉及一些具体的语法规则)，如下：
```
// 如果 exportsObjName 使用默认值 exports, ...代表省略代码
export function foo(){ ... } => exports.foo = function foo(){ ... }
export default ... => exports.default = ...
```
如果code是函数类型，则首先使用``toCode``函数将code转化为string类型，之后再将它转化为IIFE的形式，如下
```
// 如果 exportsObjName 使用默认值 exports, ...代表省略代码
// 传入的code是如下形式：
function( m ){ 
  ... 
}
// 转化为
(function( m ){
  ...
})(exports)
```
这里的``exportsObjName``代表模块的名字，默认值是``exports``(联想commonjs)，不过这里会在一开始就随机生成一个模块名字，生成代码如下：
```
let exportsObjName = `__EXPORTS_${Math.random().toString().substring(2)}__`
```
这样只有我们按照约定的语法来编写web worker加载的代码，它便会加载了一个符合同样约定的commonjs模块。

### 使用 Promise 来做异步代理
经过上面两步，web worker加载到了模块化的代码，但是worker线程与主线程进行通讯则是仍然需要通过``postMessage``方法和``onmessage``回调事件来进行，如果无法优雅地处理这里的异步逻辑，那么之前所做的工作其实意义并不大。

workerize针对这里的异步逻辑，设计了一个简单的rpc协议（文档中将这个称作``a tiny, purpose-built RPC``），先来看一下源码中的``setup``函数：
```
function setup (ctx, rpcMethods, callbacks) {
    ctx.addEventListener('message', ({ data }) => {
      // 只捕获满足条件的数据对象
      if (data.type === 'RPC') {
        // 获取数据对象中的 id 属性
        let id = data.id
        if (id != null) {
          // 如果数据对象中存在非空 method 属性，则证明是主线程发送的消息
          if (data.method) {
            // 获取所要调用的方法实例
            let method = rpcMethods[data.method]
            if (method == null) {
              // 如果所调用的方法实例不存在，则发送方法不存在的消息
              ctx.postMessage({ type: 'RPC', id, error: 'NO_SUCH_METHOD' })
            } else {
              // 如果方法存在，则调用它，并将调用结果按不同的类型发送
              Promise.resolve()
                .then(() => method.apply(null, data.params))
                .then(result => { ctx.postMessage({ type: 'RPC', id, result }) })
                .catch(error => { ctx.postMessage({ type: 'RPC', id, error }) })
            }
          // 如果 method 属性为空，则证明是 worker 线程发送的消息
          } else {
            // 获取每个消息所对应的处于pending状态的Promise实例
            let callback = callbacks[id]
            if (callback == null) throw Error(`Unknown callback ${id}`)
            delete callbacks[id]

            // 按消息的类型将Promise转化为resolve状态或reject状态。
            if (data.error) callback.reject(Error(data.error))
            else callback.resolve(data.result)
          }
        }
      }
    })
  }
```
根据注释我们可以知道，这里的setup函数包含了rpc协议的解析规则，因此主线程和worker线程对会调用该方法来注册安装这个rpc协议，具体的代码如下：
* 主线程: ``setup(worker, worker.rpcMethods, callbacks)``
* worker线程: ``code += `\n(${toCode(setup)})(self, ${exportsObjName}, {})``

这两处代码都是在各自的作用域中，将rpc协议与当前加载的模块绑定起来，只不过主进程所传``callbacks``是有意义的，而worker则使用一个空对象代替。

### 注册调用逻辑
在拥有了rpc协议的基础上，只需要实现调用逻辑即可，代码如下：
```
worker.call = (method, params) => new Promise((resolve, reject) => {
    let id = `rpc${++counter}`
    callbacks[id] = { method, resolve, reject }
    worker.postMessage({ type: 'RPC', id, method, params })
})
```
这个``call``方法，每次会将一次方法的调用，转化为一个``pending``状态的``Promise``实例，并存在``callbacks``变量中，同时向worker线程发送一个格式为调用方法数据格式的消息。

```
for (let i in exports) {
   if (exports.hasOwnProperty(i) && !(i in worker)) {
     worker[i] = (...args) => worker.call(i, args)
   }
}
```
同时在初始化的过程中，会将主线程加载的模块中的每个方法，都绑定一个快捷方法，其方法名与模块中的函数声明保持一致，内部则使用``worker.call``来完成调用逻辑。

## 最后
关于这个库本身，还存在一些可以探讨的问题，比如：
* 是否支持依赖解析机制
* 如果引入外部依赖模块
* 针对消息是否需要按队列进行处理

关于前两点，似乎作者有一个相同的项目，叫做``workerize-loader``，可以解决，关于第三点，作者在代码中增加了todo，表示实现消息队列机制可能没有必要，因为当前的通讯基于postMessage，本身的结果已经是有序状态的了。

关于源码本身的分析大概就这样了，希望可以抛砖引玉，如有错误，还望指正。
